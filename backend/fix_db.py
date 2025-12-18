from app import app, db
from sqlalchemy import inspect
import os


def check_and_fix_db():
    print("Checking database status...")
    with app.app_context():
        db_uri = app.config["SQLALCHEMY_DATABASE_URI"]
        print(f"Database URI: {db_uri}")

        try:
            # Try to connect and inspect
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            print(f"Existing tables: {tables}")

            required_tables = ["users", "cad_files"]
            missing_tables = [t for t in required_tables if t not in tables]

            if missing_tables:
                print(f"Missing tables: {missing_tables}")
                print("Creating missing tables...")
                db.create_all()
                print("Tables created.")
            else:
                print("All required tables exist.")

        except Exception as e:
            print(f"Error accessing database: {e}")
            print("Attempting to initialize database and create tables...")
            try:
                db.create_all()
                print("Tables created successfully.")
            except Exception as e2:
                print(f"CRITICAL: Failed to create tables: {e2}")


if __name__ == "__main__":
    check_and_fix_db()
