import io
import json
import pytest
from PIL import Image
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def create_incident_report():
    img = Image.new("RGB", (200, 200), color=(80, 80, 80))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    
    data = {
        "citizen_name": "Deepak Sharma",
        "primary_defect": "pothole",
        "description": "Hazardous crater near hospital entrance",
        "latitude": "26.8600",
        "longitude": "80.9500",
        "address": "Hospital Road, Ward 3",
        "ward_id": "WARD-03",
    }
    resp = client.post("/api/v1/reports", files={"file": ("incident_test.jpg", buf.getvalue(), "image/jpeg")}, data=data)
    assert resp.status_code == 201
    return resp.json()

def test_incident_triage_flow():
    """Verify incident retrieval, confirmation, rejection, and worker assignment."""
    report = create_incident_report()
    incident_id = report["incidentId"]

    # 1. Fetch incident details
    inc_resp = client.get(f"/api/v1/incidents/{incident_id}")
    assert inc_resp.status_code == 200
    inc_data = inc_resp.json()
    assert inc_data["id"] == incident_id
    assert inc_data["status"] == "OPEN"
    assert inc_data["primaryDefect"] == "pothole"

    # 2. Update priority
    pri_resp = client.patch(f"/api/v1/incidents/{incident_id}/priority", json={
        "priority": "CRITICAL",
        "note": "Immediate risk near hospital"
    })
    assert pri_resp.status_code == 200
    assert pri_resp.json()["priority"] == "CRITICAL"
    assert pri_resp.json()["priorityScore"] >= 90.0

    # 3. Confirm incident
    confirm_resp = client.post(f"/api/v1/incidents/{incident_id}/confirm", json={"note": "Confirmed on site"})
    assert confirm_resp.status_code == 200
    assert confirm_resp.json()["status"] == "CONFIRMED"

    # 4. Assign to worker
    assign_resp = client.post(f"/api/v1/incidents/{incident_id}/assign", json={
        "worker_id": "USR-WORKER-01",
        "instructions": "Use quick-setting cold mix patch.",
        "due_in_hours": 24
    })
    assert assign_resp.status_code == 200
    assigned_inc = assign_resp.json()
    assert assigned_inc["status"] == "ASSIGNED"
    assert assigned_inc["workOrderId"] is not None
    assert assigned_inc["assignedWorkerId"] == "USR-WORKER-01"

def test_incident_rejection_requires_reason():
    """Verify rejection without reason fails and with reason succeeds."""
    report = create_incident_report()
    incident_id = report["incidentId"]

    # Reject without reason should fail validation
    bad_reject = client.post(f"/api/v1/incidents/{incident_id}/reject", json={"reason": ""})
    assert bad_reject.status_code in [400, 422]

    # Reject with valid reason
    good_reject = client.post(f"/api/v1/incidents/{incident_id}/reject", json={"reason": "Private driveway, not municipal road."})
    assert good_reject.status_code == 200
    assert good_reject.json()["status"] == "REJECTED"
    assert "Private driveway" in good_reject.json()["rejectionReason"]

def test_audit_logs_endpoint():
    """Verify audit logs capture actions."""
    # Register/login admin
    admin_email = "admin_triage@example.com"
    client.post("/api/v1/auth/register", json={
        "full_name": "Admin Officer",
        "email": admin_email,
        "password": "admin_password_123",
        "role": "ADMIN"
    })
    login_resp = client.post("/api/v1/auth/login", json={
        "email": admin_email,
        "password": "admin_password_123"
    })
    token = login_resp.json()["access_token"]

    logs_resp = client.get("/api/v1/audit-logs", headers={"Authorization": f"Bearer {token}"})
    assert logs_resp.status_code == 200
    assert "data" in logs_resp.json()
    assert logs_resp.json()["total"] >= 1
