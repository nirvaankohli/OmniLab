from flask import Flask, request, jsonify, make_response, send_from_directory
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman
import jwt
import datetime
import os
import re
from functools import wraps
from models import db, User, CADFile
from dotenv import load_dotenv
from werkzeug.utils import secure_filename


load_dotenv()

app = Flask(__name__)


app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev_key_fallback")
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["UPLOAD_FOLDER"] = os.path.join(app.root_path, "uploads")
app.config["MAX_CONTENT_LENGTH"] = 100 * 1024 * 1024


os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)


IS_PRODUCTION = os.getenv("FLASK_ENV") == "production"
COOKIE_SECURE = IS_PRODUCTION
COOKIE_HTTPONLY = True
COOKIE_SAMESITE = "None" if not IS_PRODUCTION else "Strict"

COOKIE_SAMESITE = "Lax"


CORS(
    app,
    resources={r"/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}},
    supports_credentials=True,
)

db.init_app(app)
bcrypt = Bcrypt(app)
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://",
)

talisman = Talisman(app, force_https=IS_PRODUCTION, content_security_policy=None)


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.cookies.get("auth_token")
        if not token:
            return jsonify({"message": "Token is missing!"}), 401

        try:
            data = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
            current_user = User.query.filter_by(id=data["user_id"]).first()
            if not current_user:
                return jsonify({"message": "User invalid!"}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Token expired!"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"message": "Invalid token!"}), 401

        return f(current_user, *args, **kwargs)

    return decorated


def validate_password(password):
    if len(password) < 8:
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[a-z]", password):
        return False
    if not re.search(r"[0-9]", password):
        return False
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False
    return True


@app.route("/auth/register", methods=["POST"])
@limiter.limit("5 per minute")
def register():
    data = request.get_json()
    if (
        not data
        or not data.get("username")
        or not data.get("password")
        or not data.get("teamName")
    ):
        return jsonify({"message": "Missing fields"}), 400

    username = data.get("username").strip()
    team_name = data.get("teamName").strip()
    password = data.get("password")

    if not validate_password(password):
        return (
            jsonify(
                {
                    "message": "Password weak. Must be 8+ chars, include upper, lower, number, and special char."
                }
            ),
            400,
        )

    if User.query.filter_by(username=username).first():
        return jsonify({"message": "Username already exists"}), 409

    hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")
    new_user = User(
        username=username, team_name=team_name, password_hash=hashed_password
    )

    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "User registered successfully"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Error creating user"}), 500


@app.route("/auth/login", methods=["POST"])
@limiter.limit("10 per minute")
def login():
    data = request.get_json()
    if not data or not data.get("username") or not data.get("password"):
        return jsonify({"message": "Missing data"}), 400

    user = User.query.filter_by(username=data.get("username")).first()

    if not user or not bcrypt.check_password_hash(
        user.password_hash, data.get("password")
    ):
        return jsonify({"message": "Invalid credentials"}), 401

    token = jwt.encode(
        {
            "user_id": user.id,
            "exp": datetime.datetime.now(datetime.timezone.utc)
            + datetime.timedelta(hours=1),
        },
        app.config["SECRET_KEY"],
        algorithm="HS256",
    )

    response = make_response(
        jsonify(
            {
                "message": "Login successful",
                "user": {"username": user.username, "teamName": user.team_name},
            }
        )
    )

    # Set HttpOnly Cookie
    response.set_cookie(
        "auth_token",
        token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=3600,
    )

    return response


@app.route("/auth/logout", methods=["POST"])
def logout():
    response = make_response(jsonify({"message": "Logged out"}))
    response.set_cookie(
        "auth_token",
        "",
        expires=0,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
    )
    return response


@app.route("/auth/me", methods=["GET"])
@token_required
def get_current_user(current_user):
    return jsonify(
        {
            "id": current_user.id,
            "username": current_user.username,
            "teamName": current_user.team_name,
            "created_at": current_user.created_at,
        }
    )


# --- File Routes ---

ALLOWED_EXTENSIONS = {"stl", "obj", "glb", "gltf"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/api/upload", methods=["POST"])
@token_required
@limiter.limit("10 per minute")
def upload_file(current_user):
    if "file" not in request.files:
        return jsonify({"message": "No file part"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"message": "No selected file"}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        # Use user id prefix for simple separation
        user_upload_dir = os.path.join(
            app.config["UPLOAD_FOLDER"], str(current_user.id)
        )
        os.makedirs(user_upload_dir, exist_ok=True)

        # Timestamp to avoid overwrites
        timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
        safe_filename = f"{timestamp}_{filename}"
        filepath = os.path.join(user_upload_dir, safe_filename)

        file.save(filepath)

        new_file = CADFile(
            filename=filename, filepath=filepath, user_id=current_user.id
        )
        db.session.add(new_file)
        db.session.commit()

        return (
            jsonify(
                {
                    "message": "File uploaded successfully",
                    "id": new_file.id,
                    "filename": filename,
                }
            ),
            201,
        )

    return jsonify({"message": "File type not allowed"}), 400


@app.route("/api/files", methods=["GET"])
@token_required
def list_files(current_user):
    files = (
        CADFile.query.filter_by(user_id=current_user.id)
        .order_by(CADFile.created_at.desc())
        .all()
    )
    output = []
    for file in files:
        output.append(
            {"id": file.id, "filename": file.filename, "uploaded_at": file.created_at}
        )
    return jsonify({"files": output})


@app.route("/api/files/<int:file_id>", methods=["GET"])
@token_required
def get_file(current_user, file_id):
    file_record = CADFile.query.filter_by(id=file_id, user_id=current_user.id).first()
    if not file_record:
        return jsonify({"message": "File not found"}), 404

    directory = os.path.dirname(file_record.filepath)
    filename = os.path.basename(file_record.filepath)
    return send_from_directory(directory, filename)


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
