import os
import io
import pytest
import numpy as np
from PIL import Image, ImageDraw
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.inference_service import inference_service
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

def test_checkpoint_exists_and_loads():
    """Verify that the YOLO checkpoint exists and loads successfully."""
    assert os.path.exists(settings.MODEL_PATH), f"Checkpoint not found at {settings.MODEL_PATH}"
    assert inference_service.model is not None
    assert len(inference_service.class_names) == 5
    assert inference_service.is_ready is True

def test_locked_five_class_mapping_order():
    """Verify that the 5 classes match the exact RDD2022 index order."""
    expected = {
        0: "longitudinal crack",
        1: "transverse crack",
        2: "alligator crack",
        3: "other corruption",
        4: "pothole"
    }
    
    actual = inference_service.class_names
    for cls_id, expected_name in expected.items():
        assert cls_id in actual, f"Class ID {cls_id} missing from model names"
        assert actual[cls_id].lower() == expected_name.lower(), (
            f"Class ID {cls_id} mismatch: expected '{expected_name}', got '{actual[cls_id]}'"
        )

def test_system_health_endpoint():
    """Verify /health reports healthy status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert data["model_loaded"] is True
    assert data["classes_count"] == 5

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
    assert ready_resp.json()["classes_count"] == 5

def test_model_info_endpoint():
    """Verify /api/v1/ai/model-info returns complete checkpoint metadata."""
    response = client.get("/api/v1/ai/model-info")
    assert response.status_code == 200
    data = response.json()
    assert data["model_name"] == settings.MODEL_NAME
    assert data["classes_count"] == 5
    assert "0" in data["classes"] or 0 in data["classes"]
    assert data["status"] == "READY"

def test_classes_endpoint():
    """Verify /api/v1/ai/classes returns verified class dictionary."""
    response = client.get("/api/v1/ai/classes")
    assert response.status_code == 200
    classes = response.json()
    assert len(classes) == 5
    assert classes["0"] == "longitudinal crack"
    assert classes["1"] == "transverse crack"
    assert classes["2"] == "alligator crack"
    assert classes["3"] == "other corruption"
    assert classes["4"] == "pothole"

def test_detect_endpoint_with_image_upload():
    """Verify /api/v1/ai/detect handles multipart file upload and returns valid response."""
    img_bytes = create_synthetic_road_image(800, 600)
    files = {"file": ("test_road.jpg", img_bytes, "image/jpeg")}
    
    response = client.post(
        "/api/v1/ai/detect",
        files=files,
        data={"confidence_threshold": "0.10"}
    )
    assert response.status_code == 200
    data = response.json()
    
    assert data["status"] == "completed"
    assert data["source"] == "live"
    assert data["image"]["width"] == 800
    assert data["image"]["height"] == 600
    assert "inference_time_ms" in data
    assert isinstance(data["inference_time_ms"], (int, float))
    assert isinstance(data["detections"], list)
    
    # If detections are found, verify bounding box structure
    for det in data["detections"]:
        assert det["class_id"] in [0, 1, 2, 3, 4]
        assert det["class_name"] in [
            "longitudinal crack", "transverse crack", "alligator crack", "other corruption", "pothole"
        ]
        assert 0.0 <= det["confidence"] <= 1.0
        assert len(det["bbox"]) == 4
        x1, y1, x2, y2 = det["bbox"]
        assert 0 <= x1 <= x2 <= 800
        assert 0 <= y1 <= y2 <= 600

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
    assert data["status"] == "completed"
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
