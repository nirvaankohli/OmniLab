import requests
import sys
import python

BASE_URL = "http://127.0.0.1:5000"


def test_flow():

    print("\nTesting Registration...")
    session = requests.Session()


    print("Testing Registration...")
    reg_data = {
        "username": "testuser1",
        "teamName": "RoboticsTeam",
        "password": "StrongPassword123!",
    }
    try:
        r = session.post(f"{BASE_URL}/auth/register", json=reg_data)
        print(f"Register: {r.status_code} - {r.text}")
    except requests.exceptions.ConnectionError:
        print("ERROR: Could not connect to server. Is it running?")
        sys.exit(1)

    if r.status_code not in [201, 409]: 
        
        sys.exit(1)


    # 2. 
    
    print("\nTesting Login...")
    login_data = {"username": "testuser1", "password": "StrongPassword123!"}
    r = session.post(f"{BASE_URL}/auth/login", json=login_data)
    print(f"Login: {r.status_code} - {r.text}")
    if r.status_code != 200:
        sys.exit(1)

    # Check cookie
    if "auth_token" not in session.cookies:
        print("ERROR: auth_token cookie not found!")
        sys.exit(1)
    else:
        print("Success: auth_token cookie received.")

    # 3. Access Protected Route
    print("\nTesting Protected Route (/auth/me)...")
    r = session.get(f"{BASE_URL}/auth/me")
    print(f"Me: {r.status_code} - {r.text}")
    if r.status_code != 200:
        sys.exit(1)

    print("\nALL TESTS PASSED")


if __name__ == "__main__":
    test_flow()
