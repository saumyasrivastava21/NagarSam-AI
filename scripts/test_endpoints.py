"""
Quick endpoint test: URL submission + file upload + pothole model audit.
Run: python scripts/test_endpoints.py
"""
import requests
import glob
import time

BASE = "http://localhost:8000/api/v1"

# Wait for server
for _ in range(10):
    try:
        r = requests.get(f"{BASE}/ai/health", timeout=3)
        if r.status_code == 200:
            print("[OK] Backend is UP:", r.json())
            break
    except Exception:
        time.sleep(1)
else:
    print("[FAIL] Backend not reachable")
    raise SystemExit(1)

POTHOLE_URL = "https://images.unsplash.com/photo-1578983427937-26078ee3d9d3?w=800&auto=format&fit=crop&q=80"
CRACK_URL = "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80"

print("\n--- Test 1: image_url (Pothole Unsplash) ---")
data = {"image_url": POTHOLE_URL, "confidence_threshold": "0.15"}
resp = requests.post(f"{BASE}/ai/detect", data=data, timeout=60)
print(f"  Status: {resp.status_code}")
if resp.status_code == 200:
    r = resp.json()
    dets = r.get("detections", [])
    print(f"  Detections ({len(dets)}):", [(d["class_name"], round(d["confidence"], 3)) for d in dets])
    print(f"  Primary defect: {r.get('primary_defect')} @ {r.get('primary_confidence')}")
    print(f"  Inference time: {r.get('inference_time_ms')}ms")
else:
    print(f"  Error body: {resp.text[:400]}")

print("\n--- Test 2: image_url (Crack Unsplash) ---")
data2 = {"image_url": CRACK_URL, "confidence_threshold": "0.10"}
resp2 = requests.post(f"{BASE}/ai/detect", data=data2, timeout=60)
print(f"  Status: {resp2.status_code}")
if resp2.status_code == 200:
    r2 = resp2.json()
    dets2 = r2.get("detections", [])
    print(f"  Detections ({len(dets2)}):", [(d["class_name"], round(d["confidence"], 3)) for d in dets2])
    print(f"  Primary defect: {r2.get('primary_defect')} @ {r2.get('primary_confidence')}")
else:
    print(f"  Error body: {resp2.text[:400]}")

print("\n--- Test 3: File upload ---")
imgs = glob.glob("backend/storage/uploads/*.*")
if imgs:
    with open(imgs[0], "rb") as f:
        files = {"file": ("test.jpg", f, "image/jpeg")}
        resp3 = requests.post(f"{BASE}/ai/detect", files=files, data={"confidence_threshold": "0.10"}, timeout=60)
        print(f"  Status: {resp3.status_code}")
        if resp3.status_code == 200:
            r3 = resp3.json()
            dets3 = r3.get("detections", [])
            print(f"  Detections ({len(dets3)}):", [(d["class_name"], round(d["confidence"], 3)) for d in dets3])
            print(f"  Primary: {r3.get('primary_defect')}")
        else:
            print(f"  Error: {resp3.text[:400]}")
else:
    print("  No stored uploads found")

print("\n--- Test 4: Model info ---")
resp4 = requests.get(f"{BASE}/ai/model-info", timeout=10)
print(f"  Status: {resp4.status_code}")
if resp4.status_code == 200:
    info = resp4.json()
    for key, m in info.get("models", {}).items():
        print(f"  [{key}] {m['name']} — status={m['status']}, classes={m.get('classes_count')}")

print("\nDone.")
