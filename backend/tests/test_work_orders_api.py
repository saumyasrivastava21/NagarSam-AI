import io
import json
import pytest
from PIL import Image
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def setup_incident():
    img = Image.new("RGB", (200, 200), color=(50, 50, 50))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")

    data = {
        "citizen_name": "Suresh Gupta",
        "primary_defect": "pothole",
        "description": "Severe road hole causing bicycle falls",
        "latitude": "26.8550",
        "longitude": "80.9450",
        "address": "Park Road, Ward 2",
        "ward_id": "WARD-02",
    }
    r = client.post("/api/v1/reports", files={"file": ("wo_test.jpg", buf.getvalue(), "image/jpeg")}, data=data)
    assert r.status_code == 201
    return r.json()["incidentId"]

def test_complete_work_order_lifecycle():
    """Verify full worker lifecycle: Create -> Assign -> Accept -> Start -> Complete -> Verify."""
    incident_id = setup_incident()

    # 1. Create work order
    wo_create_resp = client.post("/api/v1/work-orders", json={
        "incident_id": incident_id,
        "assigned_worker_id": "USR-WORKER-02",
        "instructions": "Fill with hot bituminous mix and compact with roller.",
        "priority": "HIGH",
    })
    assert wo_create_resp.status_code == 201
    wo = wo_create_resp.json()
    wo_id = wo["id"]
    assert wo_id.startswith("WO-2026-")
    assert wo["status"] == "ASSIGNED"

    # 2. Worker accepts work order
    accept_resp = client.post(f"/api/v1/work-orders/{wo_id}/accept")
    assert accept_resp.status_code == 200
    assert accept_resp.json()["status"] == "ACCEPTED"

    # 3. Worker starts repair on site
    start_resp = client.post(f"/api/v1/work-orders/{wo_id}/start")
    assert start_resp.status_code == 200
    assert start_resp.json()["status"] == "IN_PROGRESS"

    # 4. Worker completes repair and uploads after-photo
    after_img = Image.new("RGB", (300, 300), color=(120, 120, 120))
    after_buf = io.BytesIO()
    after_img.save(after_buf, format="JPEG")

    complete_resp = client.post(
        f"/api/v1/work-orders/{wo_id}/complete",
        files={"after_file": ("repaired_road.jpg", after_buf.getvalue(), "image/jpeg")},
        data={"notes": "Pothole filled and compacted flush with road level.", "labor_hours": "2.5"}
    )
    assert complete_resp.status_code == 200
    completed_wo = complete_resp.json()
    assert completed_wo["status"] == "COMPLETED"
    assert completed_wo["afterImageUrl"] != ""
    assert completed_wo["verification"] is not None

    # 5. Officer reviews and approves verification
    verify_resp = client.post(f"/api/v1/work-orders/{wo_id}/verify", json={
        "approved": True,
        "notes": "Quality inspection verified. Smooth finish."
    })
    assert verify_resp.status_code == 200
    assert verify_resp.json()["status"] == "RESOLVED"
