import requests
import sys
import os

BASE_URL = "http://127.0.0.1:5000"


def test_flow():
    session = requests.Session()

    # 1. Register/Login
    print("Testing Auth...")
    reg_data = {
        "username": "caduser",
        "teamName": "CADTeam",
        "password": "StrongPassword123!",
    }
    # Try register, if fails (409) then login
    r = session.post(f"{BASE_URL}/auth/register", json=reg_data)
    if r.status_code == 201:
        # Login
        login_data = {"username": "caduser", "password": "StrongPassword123!"}
        r = session.post(f"{BASE_URL}/auth/login", json=login_data)
    elif r.status_code == 409:
        # User exists, just login
        login_data = {"username": "caduser", "password": "StrongPassword123!"}
        r = session.post(f"{BASE_URL}/auth/login", json=login_data)

    if r.status_code != 200:
        print(f"Login failed: {r.text}")
        sys.exit(1)
    print("Logged in.")

    # 2. Upload File
    print("\nTesting Upload...")
    # Create dummy file
    with open("test.stl", "w") as f:
        f.write("mock stl content")

    with open("test.stl", "rb") as f_up:
        files = {"file": ("test.stl", f_up)}
        r = session.post(f"{BASE_URL}/api/upload", files=files)

    print(f"Upload: {r.status_code} - {r.text}")
    if r.status_code != 201:
        sys.exit(1)

    file_id = r.json()["id"]

    # 3. List Files
    print("\nTesting List Files...")
    r = session.get(f"{BASE_URL}/api/files")
    print(f"List: {r.status_code} - {r.text}")
    if len(r.json()["files"]) == 0:
        print("Error: File list empty")
        sys.exit(1)

    # 4. Download File
    print("\nTesting Download...")
    r = session.get(f"{BASE_URL}/api/files/{file_id}")
    if r.status_code == 200:
        print(f"Download Success. Content: {r.text}")
    else:
        print(f"Download Failed: {r.status_code}")
        sys.exit(1)

    # Cleanup
    os.remove("test.stl")
    print("\nALL CAD TESTS PASSED")


if __name__ == "__main__":
    test_flow()
