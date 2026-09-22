import io
import json
import uuid
import pytest
from PIL import Image
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.db.session import SessionLocal
from backend.app.db.models import User, UserRole, Report, Incident, WorkOrder, Verification, Notification, AuditLog

client = TestClient(app)

def create_synthetic_road_image():
    img = Image.new("RGB", (640, 480), color=(128, 128, 128))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()

def test_full_civic_lifecycle_e2e():
    """
    Complete end-to-end civic lifecycle test across all 4 roles:
    Citizen -> Officer -> Field Worker -> AI Verification -> Resolution Sign-off.
    """
    run_id = uuid.uuid4().hex[:6]
    # 1. Register Citizen
    citizen_email = f"citizen_e2e_{run_id}@nagarsam.gov"
    reg_res = client.post("/api/v1/auth/register", json={
        "full_name": "E2E Citizen Tester",
        "email": citizen_email,
        "password": "Password@123",
        "role": "CITIZEN",
        "phone": "+91-9876543210"
    })
    assert reg_res.status_code in [200, 201]

    # Login Citizen
    cit_login = client.post("/api/v1/auth/login", json={
        "email": citizen_email,
        "password": "Password@123"
    })
    assert cit_login.status_code == 200
    cit_token = cit_login.json()["access_token"]
    cit_headers = {"Authorization": f"Bearer {cit_token}"}

    # 2. Run Inference on Real Road Image
    img_bytes = create_synthetic_road_image()
    infer_res = client.post(
        "/api/v1/ai/detect",
        files={"file": ("road_hazard.jpg", img_bytes, "image/jpeg")},
        data={"confidence_threshold": 0.25}
    )
    assert infer_res.status_code == 200
    inference_output = infer_res.json()
    assert "detections" in inference_output
    assert "models" in inference_output

    # 3. Submit Citizen Report
    report_payload = {
        "title": "Severe Pothole on Hazratganj Marg",
        "description": "Deep asphalt crater creating severe hazard for two-wheelers",
        "category": "pothole",
        "severity": "HIGH",
        "latitude": 26.8467,
        "longitude": 80.9462,
        "landmark": "Opposite General Post Office",
        "address": "Hazratganj, Lucknow",
        "ai_status": "completed",
        "ai_detections": json.dumps(inference_output.get("detections", [])),
        "ai_metadata": json.dumps(inference_output.get("models", {}))
    }

    rep_res = client.post(
        "/api/v1/reports",
        files={"image": ("road_hazard.jpg", img_bytes, "image/jpeg")},
        data=report_payload,
        headers=cit_headers
    )
    assert rep_res.status_code == 201
    report_data = rep_res.json()
    report_id = report_data["id"]
    assert report_id.startswith("NS-")

    # 4. Verify Persistence & Incident Creation
    get_rep = client.get(f"/api/v1/reports/{report_id}", headers=cit_headers)
    assert get_rep.status_code == 200
    assert get_rep.json()["status"] == "SUBMITTED"

    # 5. Register & Login Officer
    officer_email = f"officer_e2e_{run_id}@nagarsam.gov"
    client.post("/api/v1/auth/register", json={
        "full_name": "Chief Ward Officer",
        "email": officer_email,
        "password": "Password@123",
        "role": "OFFICER"
    })
    off_login = client.post("/api/v1/auth/login", json={
        "email": officer_email,
        "password": "Password@123"
    })
    off_token = off_login.json()["access_token"]
    off_headers = {"Authorization": f"Bearer {off_token}"}

    # Officer queries incidents queue
    incidents_res = client.get("/api/v1/incidents", headers=off_headers)
    assert incidents_res.status_code == 200
    inc_list = incidents_res.json()["data"]
    matching_inc = next((i for i in inc_list if i.get("report_id") == report_id or i.get("id") == report_data.get("incidentId")), None)
    assert matching_inc is not None
    incident_id = matching_inc["id"]

    # Officer confirms incident
    conf_res = client.post(
        f"/api/v1/incidents/{incident_id}/confirm",
        json={"severity": "HIGH", "notes": "Confirmed severe pothole by field inspection"},
        headers=off_headers
    )
    assert conf_res.status_code == 200

    # 6. Register Field Worker
    worker_email = f"worker_e2e_{run_id}@nagarsam.gov"
    client.post("/api/v1/auth/register", json={
        "full_name": "Road Repair Crew Lead",
        "email": worker_email,
        "password": "Password@123",
        "role": "FIELD_WORKER"
    })
    worker_login = client.post("/api/v1/auth/login", json={
        "email": worker_email,
        "password": "Password@123"
    })
    worker_user = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {worker_login.json()['access_token']}"}).json()
    worker_id = worker_user["id"]
    worker_headers = {"Authorization": f"Bearer {worker_login.json()['access_token']}"}

    # Officer creates Work Order and assigns to Worker
    wo_create = client.post(
        "/api/v1/work-orders",
        json={
            "incident_id": incident_id,
            "title": f"Patching and resurfacing pothole #{incident_id}",
            "instructions": "Use cold-mix asphalt and compact thoroughly.",
            "assigned_worker_id": worker_id,
            "priority": "HIGH"
        },
        headers=off_headers
    )
    assert wo_create.status_code == 201
    work_order_id = wo_create.json()["id"]

    # 7. Field Worker Workflow: Accept -> Start -> Complete with After Photo
    # Worker views assigned jobs
    my_jobs = client.get("/api/v1/work-orders/my-assignments", headers=worker_headers)
    assert my_jobs.status_code == 200
    assert any(j["id"] == work_order_id for j in my_jobs.json())

    # Worker accepts
    acc_res = client.post(f"/api/v1/work-orders/{work_order_id}/accept", headers=worker_headers)
    assert acc_res.status_code == 200
    assert acc_res.json()["status"] == "ACCEPTED"

    # Worker starts
    start_res = client.post(f"/api/v1/work-orders/{work_order_id}/start", headers=worker_headers)
    assert start_res.status_code == 200
    assert start_res.json()["status"] == "IN_PROGRESS"

    # Worker completes repair and uploads after-photo
    after_img = create_synthetic_road_image()
    comp_res = client.post(
        f"/api/v1/work-orders/{work_order_id}/complete",
        files={"after_photo": ("repaired_road.jpg", after_img, "image/jpeg")},
        data={
            "completion_notes": "Filled with 50kg asphalt patch, compacted level with road surface.",
            "labor_hours": 2.5,
            "materials_used": json.dumps(["Cold-mix asphalt 50kg", "Bitumen emulsion"])
        },
        headers=worker_headers
    )
    assert comp_res.status_code == 200
    assert comp_res.json()["status"] in ["COMPLETED", "VERIFYING"]

    # 8. Officer Reviews Verification and Approves Resolution
    verif_list = client.get("/api/v1/verifications", headers=off_headers)
    assert verif_list.status_code == 200
    verif_record = next((v for v in verif_list.json()["data"] if v["workOrderId"] == work_order_id), None)
    assert verif_record is not None
    verif_id = verif_record["id"]

    review_res = client.post(
        f"/api/v1/verifications/{verif_id}/review",
        json={"decision": "APPROVE", "notes": "Smooth repair verified. Road surface safe."},
        headers=off_headers
    )
    assert review_res.status_code == 200
    assert review_res.json()["work_order_status"] == "RESOLVED"

    # 9. Verify Citizen Synchronization & Notifications
    cit_notifs = client.get("/api/v1/notifications", headers=cit_headers)
    assert cit_notifs.status_code == 200
    resolved_notif = next((n for n in cit_notifs.json() if n["type"] == "REPORT_RESOLVED"), None)
    assert resolved_notif is not None
    assert "repaired and officially verified" in resolved_notif["message"]

    # Check report state is RESOLVED
    final_rep = client.get(f"/api/v1/reports/{report_id}", headers=cit_headers).json()
    assert final_rep["status"] == "RESOLVED"
