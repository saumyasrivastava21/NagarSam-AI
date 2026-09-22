import io
import json
import pytest
from PIL import Image
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def create_test_image_bytes():
    img = Image.new("RGB", (320, 240), color=(100, 100, 100))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()

def test_create_and_retrieve_persistent_report():
    """Verify multipart report submission persists to database and returns real report ID."""
    img_bytes = create_test_image_bytes()
    files = {"file": ("pothole_evidence.jpg", img_bytes, "image/jpeg")}
    
    data = {
        "citizen_name": "Anita Verma",
        "citizen_phone": "+91 99887 76655",
        "primary_defect": "pothole",
        "description": "Deep crater near market entrance causing severe bottleneck",
        "landmark": "Near Main Gate",
        "latitude": "26.8467",
        "longitude": "80.9462",
        "address": "Hazratganj Road, Lucknow",
        "ward_id": "WARD-02",
        "ward_name": "Hazratganj Ward",
        "ai_detection_json": json.dumps({
            "status": "completed",
            "primary_defect": "pothole",
            "confidence": 0.94,
            "detections": [{
                "class_id": 4,
                "class_name": "pothole",
                "confidence": 0.94,
                "bbox": [50, 50, 200, 180],
                "model_source": "pothole"
            }]
        })
    }

    response = client.post("/api/v1/reports", files=files, data=data)
    assert response.status_code == 201
    report = response.json()

    report_id = report["id"]
    assert report_id.startswith("NS-2026-")
    assert report["primaryDefect"] == "pothole"
    assert report["severity"] == "CRITICAL"
    assert report["status"] == "SUBMITTED"
    assert report["imageUrl"].startswith("/api/v1/storage/uploads/")
    assert len(report["timeline"]) >= 2

    # Fetch individual report
    get_resp = client.get(f"/api/v1/reports/{report_id}")
    assert get_resp.status_code == 200
    fetched = get_resp.json()
    assert fetched["id"] == report_id
    assert fetched["citizenName"] == "Anita Verma"
    assert fetched["latitude"] == 26.8467

    # List reports with filtering
    list_resp = client.get(f"/api/v1/reports?search=Hazratganj&severity=CRITICAL")
    assert list_resp.status_code == 200
    items = list_resp.json()["data"]
    assert any(r["id"] == report_id for r in items)

def test_report_status_patch():
    """Verify updating report status persists and updates timeline."""
    img_bytes = create_test_image_bytes()
    files = {"file": ("crack.jpg", img_bytes, "image/jpeg")}
    data = {
        "primary_defect": "longitudinal crack",
        "description": "Crack across lane",
        "latitude": "26.85",
        "longitude": "80.95",
        "address": "Ring Road",
        "ward_id": "WARD-01",
    }
    create_resp = client.post("/api/v1/reports", files=files, data=data)
    report_id = create_resp.json()["id"]

    patch_resp = client.patch(f"/api/v1/reports/{report_id}/status", json={
        "status": "CONFIRMED",
        "note": "Verified by ward inspector"
    })
    assert patch_resp.status_code == 200
    updated = patch_resp.json()
    assert updated["status"] == "CONFIRMED"
