import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_auth_registration_login_lifecycle():
    """Verify citizen registration, token receipt, and /me access."""
    reg_email = "test_citizen_01@example.com"
    reg_payload = {
        "full_name": "Ravi Kumar",
        "email": reg_email,
        "password": "secure_password_123",
        "role": "CITIZEN",
        "phone": "+91 98765 11111"
    }

    # 1. Register
    reg_resp = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_resp.status_code in [201, 409]

    # 2. Login
    login_resp = client.post("/api/v1/auth/login", json={
        "email": reg_email,
        "password": "secure_password_123"
    })
    assert login_resp.status_code == 200
    token_data = login_resp.json()
    assert "access_token" in token_data
    assert "refresh_token" in token_data
    assert token_data["user"]["email"] == reg_email
    assert token_data["user"]["role"] == "CITIZEN"

    access_token = token_data["access_token"]
    refresh_token = token_data["refresh_token"]

    # 3. Access /auth/me with Bearer token
    me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {access_token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == reg_email

    # 4. Refresh token
    refresh_resp = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert refresh_resp.status_code == 200
    new_tokens = refresh_resp.json()
    assert "access_token" in new_tokens

    # 5. Invalid credentials check
    bad_login = client.post("/api/v1/auth/login", json={
        "email": reg_email,
        "password": "wrong_password_xyz"
    })
    assert bad_login.status_code == 401

def test_rbac_protection():
    """Verify RBAC role checks block unauthorized roles."""
    # Register a field worker
    worker_email = "test_worker_01@example.com"
    client.post("/api/v1/auth/register", json={
        "full_name": "Worker Ramesh",
        "email": worker_email,
        "password": "worker_password_123",
        "role": "FIELD_WORKER"
    })

    login_resp = client.post("/api/v1/auth/login", json={
        "email": worker_email,
        "password": "worker_password_123"
    })
    token = login_resp.json()["access_token"]

    # Field worker attempting to access admin/officer users list
    resp = client.get("/api/v1/users", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403
