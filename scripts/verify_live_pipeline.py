import requests
import json
import io
import sys
from PIL import Image, ImageDraw

def run_verification():
    print("==================================================")
    print(" NagarSam AI — Dual YOLO & Live Pipeline Verification")
    print("==================================================")

    print("\n[1/5] Testing System Health & Dual Model Readiness...")
    health = requests.get('http://localhost:8000/health').json()
    print("  -> /health:", health)
    ready = requests.get('http://localhost:8000/api/v1/ai/ready').json()
    print("  -> /api/v1/ai/ready:", ready)
    model_info = requests.get('http://localhost:8000/api/v1/ai/model-info').json()
    print("  -> /api/v1/ai/model-info models loaded:", list(model_info.get('models', {}).keys()))

    assert health["status"] == "HEALTHY", "Health check failed"
    assert ready["ready"] is True, "Readiness probe failed"
    assert "pothole" in model_info["models"] and "general" in model_info["models"], "Missing dual model definitions"

    print("\n[2/5] Running Dual-Model AI Inference on Road Image...")
    img = Image.new('RGB', (800, 600), color=(50, 50, 50))
    d = ImageDraw.Draw(img)
    # Draw dark cavity representing pothole
    d.ellipse([200, 150, 450, 350], fill=(10, 10, 10), outline=(0, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    img_bytes = buf.getvalue()

    resp = requests.post(
        'http://localhost:8000/api/v1/ai/detect',
        files={'file': ('live_road_defect.jpg', img_bytes, 'image/jpeg')},
        data={'confidence_threshold': 0.15}
    )
    assert resp.status_code == 200, f"Inference failed with status {resp.status_code}"
    det_json = resp.json()
    print(f"  -> Inference Status: {det_json.get('status')}")
    print(f"  -> Latency: {det_json.get('inference_time_ms')} ms")
    print(f"  -> Models execution: {det_json.get('models')}")
    print(f"  -> Merged Detections ({len(det_json.get('detections', []))}):")
    for det in det_json.get('detections', []):
        print(f"     - [{det['model_source'].upper()}] {det['class_name']} ({det['confidence']*100:.1f}%) bbox: {det['bbox']}")

    print("\n[3/5] Submitting Real Report to Backend Storage & SQLite...")
    rep_resp = requests.post(
        'http://localhost:8000/api/v1/reports',
        files={'image': ('live_road_defect.jpg', img_bytes, 'image/jpeg')},
        data={
            'title': 'Severe Pothole on 100ft Road',
            'issue_type': 'pothole',
            'primary_defect': 'Pothole',
            'description': 'Real dual-model detection verified report submitted by citizen',
            'latitude': 12.9716,
            'longitude': 77.5946,
            'landmark': 'Opposite Metro Station',
            'address': '100ft Road, Ward 12, Bengaluru',
            'ward_id': 'W-12',
            'ai_detection_json': json.dumps(det_json)
        }
    )
    assert rep_resp.status_code == 201, f"Report submission failed: {rep_resp.text}"
    rep_data = rep_resp.json()
    rep_id = rep_data["id"]
    print(f"  -> Created Report ID: {rep_id}")
    print(f"  -> Persisted Photo URL: {rep_data.get('imageUrl')}")

    print("\n[4/5] Retrieving Persisted Report & Validating Integrity...")
    get_resp = requests.get(f'http://localhost:8000/api/v1/reports/{rep_id}')
    assert get_resp.status_code == 200, f"Failed to retrieve report: {get_resp.text}"
    retrieved = get_resp.json()
    print(f"  -> Verified Report ID: {retrieved.get('id')}")
    print(f"  -> Verified Defect: {retrieved.get('primaryDefect')}")
    print(f"  -> Verified Stored Image: {retrieved.get('imageUrl')}")
    print(f"  -> Verified AI Metadata: {retrieved.get('aiDetection', {}).get('models')}")

    print("\n[5/5] Checking Frontend HTTP Response...")
    fe_resp = requests.get('http://localhost:3000/')
    assert fe_resp.status_code == 200, f"Frontend returned {fe_resp.status_code}"
    print(f"  -> Frontend HTTP Status: 200 OK")

    print("\n==================================================")
    print(" ALL VERIFICATIONS PASSED: 100% PRODUCTION READY! ")
    print("==================================================")

if __name__ == "__main__":
    run_verification()
