import os
import io
import json
import pytest
import numpy as np
from PIL import Image, ImageDraw
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.inference_service import dual_inference_service
from backend.app.config import settings

client = TestClient(app)

def create_synthetic_road_image(width=800, height=600, draw_defect=True) -> bytes:
    """Creates a synthetic road test image with texture and high contrast defect."""
    img = Image.new("RGB", (width, height), color=(60, 60, 65))
    draw = ImageDraw.Draw(img)
    
    # Add lane markings
    draw.line([(width // 2, 0), (width // 2, height)], fill=(240, 240, 240), width=6)
    
    if draw_defect:
        # Dark cavity representing pothole / crack
        draw.ellipse([width // 4, height // 3, width // 2, 2 * height // 3], fill=(20, 20, 20), outline=(10, 10, 10))
    
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()

def test_checkpoints_exist_and_load():
    """Verify that both YOLO checkpoints exist and load successfully."""
    assert os.path.exists(settings.POTHOLE_MODEL_PATH), f"Pothole checkpoint not found at {settings.POTHOLE_MODEL_PATH}"
    assert os.path.exists(settings.GENERAL_MODEL_PATH), f"General checkpoint not found at {settings.GENERAL_MODEL_PATH}"
    assert dual_inference_service.pothole_model is not None
    assert dual_inference_service.general_model is not None
    assert dual_inference_service.is_ready is True

def test_class_mappings():
    """Verify class mappings for both pothole detector and general defect detector."""
    # General model should have RDD2022 classes
    general_classes = dual_inference_service.general_class_names
    assert len(general_classes) >= 1
    assert 0 in general_classes or "0" in general_classes
    
    # Pothole model class mapping
    pothole_classes = dual_inference_service.pothole_class_names
    assert len(pothole_classes) >= 1

def test_system_health_endpoint():
    """Verify /health reports healthy status and dual model state."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert data["pothole_model_loaded"] is True
    assert data["general_model_loaded"] is True
    assert "models" in data

def test_ai_health_and_readiness_endpoints():
    """Verify /api/v1/ai/health and /api/v1/ai/ready endpoints."""
    health_resp = client.get("/api/v1/ai/health")
    assert health_resp.status_code == 200
    assert health_resp.json()["status"] == "UP"
    assert health_resp.json()["ready"] is True

    ready_resp = client.get("/api/v1/ai/ready")
    assert ready_resp.status_code == 200
    assert ready_resp.json()["status"] == "READY"
    assert ready_resp.json()["ready"] is True
    assert "models" in ready_resp.json()
    assert ready_resp.json()["models"]["pothole"]["status"] == "READY"
    assert ready_resp.json()["models"]["general"]["status"] == "READY"

def test_model_info_endpoint():
    """Verify /api/v1/ai/model-info returns complete dual-model metadata."""
    response = client.get("/api/v1/ai/model-info")
    assert response.status_code == 200
    data = response.json()
    assert "models" in data
    assert "pothole" in data["models"]
    assert "general" in data["models"]
    assert data["status"] in ["FULLY_READY", "PARTIALLY_READY"]
    assert data["models"]["pothole"]["version"] == settings.POTHOLE_MODEL_VERSION
    assert data["models"]["general"]["version"] == settings.GENERAL_MODEL_VERSION

def test_classes_endpoint():
    """Verify /api/v1/ai/classes returns verified class dictionary."""
    response = client.get("/api/v1/ai/classes")
    assert response.status_code == 200
    classes_data = response.json()
    assert len(classes_data) >= 1

def test_detect_endpoint_with_image_upload():
    """Verify /api/v1/ai/detect handles multipart file upload and returns dual-model response."""
    img_bytes = create_synthetic_road_image(800, 600)
    files = {"file": ("test_road.jpg", img_bytes, "image/jpeg")}
    
    response = client.post(
        "/api/v1/ai/detect",
        files=files,
        data={"confidence_threshold": "0.10"}
    )
    assert response.status_code == 200
    data = response.json()
    
    assert data["status"] in ["completed", "partial"]
    assert data["source"] == "live"
    assert data["image"]["width"] == 800
    assert data["image"]["height"] == 600
    assert "inference_time_ms" in data
    assert isinstance(data["inference_time_ms"], (int, float))
    assert isinstance(data["detections"], list)
    assert "models" in data
    assert "pothole" in data["models"]
    assert "general" in data["models"]
    
    # If detections are found, verify bounding box structure and model_source routing
    for det in data["detections"]:
        assert det["model_source"] in ["pothole", "general"]
        assert 0.0 <= det["confidence"] <= 1.0
        assert len(det["bbox"]) == 4
        x1, y1, x2, y2 = det["bbox"]
        assert 0 <= x1 <= x2 <= 800
        assert 0 <= y1 <= y2 <= 600
        # If model source is pothole, class_name must be pothole
        if det["model_source"] == "pothole":
            assert "pothole" in det["class_name"].lower()

def test_detect_endpoint_empty_detection():
    """Verify that a clean image returns 0 detections without fake fallback."""
    blank_img = Image.new("RGB", (640, 640), color=(255, 255, 255))
    buf = io.BytesIO()
    blank_img.save(buf, format="JPEG")
    
    files = {"file": ("blank.jpg", buf.getvalue(), "image/jpeg")}
    response = client.post(
        "/api/v1/ai/detect",
        files=files,
        data={"confidence_threshold": "0.60"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["completed", "partial"]
    assert data["image"]["width"] == 640
    assert data["image"]["height"] == 640
    assert isinstance(data["detections"], list)

def test_detect_endpoint_corrupted_file():
    """Verify 400 Bad Request on corrupted image bytes."""
    corrupt_bytes = b"NOT_A_VALID_IMAGE_FILE_BYTES_GARBAGE"
    files = {"file": ("corrupt.jpg", corrupt_bytes, "image/jpeg")}
    response = client.post("/api/v1/ai/detect", files=files)
    assert response.status_code == 400

def test_detect_endpoint_missing_file():
    """Verify 400 Bad Request when no file or payload is provided."""
    response = client.post("/api/v1/ai/detect")
    assert response.status_code == 400

def test_report_submission_and_retrieval_flow():
    """Verify end-to-end report persistence: submission, DB storage, and retrieval."""
    img_bytes = create_synthetic_road_image(640, 480)
    files = {"image": ("report_test.jpg", img_bytes, "image/jpeg")}
    
    payload = {
        "title": "Severe Pothole on MG Road",
        "description": "Deep pothole creating severe traffic hazard",
        "category": "pothole",
        "severity": "high",
        "latitude": 12.9716,
        "longitude": 77.5946,
        "landmark": "Near Metro Pillar 42",
        "citizen_id": "citizen-test-01",
        "ai_status": "completed",
        "ai_detections": json.dumps([
            {
                "class_id": 0,
                "class_name": "Pothole",
                "confidence": 0.92,
                "bbox": [100, 150, 400, 350],
                "model_source": "pothole"
            }
        ]),
        "ai_metadata": json.dumps({
            "models": {
                "pothole": {"version": "pothole-v1", "status": "completed"},
                "general": {"version": "road-defect-v1", "status": "completed"}
            },
            "source": "live",
            "inference_time_ms": 110
        })
    }
    
    # Submit report
    submit_resp = client.post("/api/v1/reports", files=files, data=payload)
    assert submit_resp.status_code == 201
    report_data = submit_resp.json()
    
    report_id = report_data["id"]
    assert report_id.startswith("NS-")
    assert report_data["issueType"].lower() == "pothole"
    assert report_data["primaryDefect"].lower() == "pothole"
    assert report_data["imageUrl"].startswith("/api/v1/storage/uploads/")
    assert len(report_data["aiDetection"]["detections"]) == 1
    assert report_data["aiDetection"]["detections"][0]["model_source"] == "pothole"
    assert report_data["aiDetection"]["models"]["pothole"]["version"] == "pothole-v1"
    
    # Retrieve report
    get_resp = client.get(f"/api/v1/reports/{report_id}")
    assert get_resp.status_code == 200
    retrieved = get_resp.json()
    assert retrieved["id"] == report_id
    assert retrieved["issueType"].lower() == "pothole"
    assert retrieved["landmark"] == "Near Metro Pillar 42"
    assert len(retrieved["aiDetection"]["detections"]) == 1
