def test_register_and_login(client):
    # Register new user
    reg_resp = client.post("/api/auth/register", json={
        "email": "newanalyst@aquasense.org",
        "password": "SecurePassword123!",
        "full_name": "New Analyst",
        "role": "standard"
    })
    assert reg_resp.status_code == 201
    reg_data = reg_resp.json()
    assert reg_data["email"] == "newanalyst@aquasense.org"
    assert reg_data["role"] == "standard"

    # Login
    login_resp = client.post("/api/auth/login", json={
        "email": "newanalyst@aquasense.org",
        "password": "SecurePassword123!"
    })
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert "access_token" in login_data
    assert login_data["user"]["email"] == "newanalyst@aquasense.org"

    # Profile check
    headers = {"Authorization": f"Bearer {login_data['access_token']}"}
    me_resp = client.get("/api/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "newanalyst@aquasense.org"

def test_login_invalid_password(client):
    resp = client.post("/api/auth/login", json={
        "email": "testadmin@aquasense.org",
        "password": "WrongPassword999!"
    })
    assert resp.status_code == 401
