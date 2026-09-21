"""
Verification script for NagarSam AI Road Defect YOLO Checkpoint.
Extracts architecture, embedded class names, parameter counts, and inference specs.
"""
import sys
import os
import time
import torch
from PIL import Image
import numpy as np

def verify_checkpoint(checkpoint_path: str):
    print("=" * 70)
    print("NAGARSAM AI — YOLO ROAD DEFECT CHECKPOINT AUDIT")
    print("=" * 70)
    
    if not os.path.exists(checkpoint_path):
        print(f"ERROR: Checkpoint not found at {checkpoint_path}")
        return False

    print(f"Checkpoint Path: {os.path.abspath(checkpoint_path)}")
    print(f"File Size: {os.path.getsize(checkpoint_path) / (1024*1024):.2f} MB")
    
    # Load with Ultralytics YOLO
    from ultralytics import YOLO
    model = YOLO(checkpoint_path)
    
    print("\n--- Model Specifications ---")
    print(f"Model Class: {type(model).__name__}")
    print(f"Task: {getattr(model, 'task', 'detect')}")
    print(f"Device: {model.device}")
    
    # Embedded class names
    names = model.names
    print(f"\nNumber of Classes: {len(names)}")
    print("Embedded Class Mapping (model.names):")
    for cls_id, cls_name in sorted(names.items()):
        print(f"  [{cls_id}] => '{cls_name}'")
        
    # Expected authoritative mapping
    expected_mapping = {
        0: "longitudinal crack",
        1: "transverse crack",
        2: "alligator crack",
        3: "other corruption",
        4: "pothole"
    }
    
    print("\n--- Validation against Expected 5-Class Schema ---")
    mismatch = False
    for k, v in expected_mapping.items():
        actual_v = names.get(k, None)
        if actual_v is None or actual_v.lower() != v.lower():
            print(f"  MISMATCH at Class ID {k}: expected '{v}', found '{actual_v}'")
            mismatch = True
        else:
            print(f"  MATCH: Class ID {k} -> '{actual_v}' (expected '{v}')")
            
    if mismatch:
        print("\n[WARNING] Checkpoint class names deviate from expected mapping.")
    else:
        print("\n[SUCCESS] Checkpoint embedded classes match the exact 5-class RDD2022 schema.")

    # Test dummy inference for pipeline validation
    print("\n--- Testing Raw Inference Pipeline ---")
    dummy_img = np.zeros((640, 640, 3), dtype=np.uint8)
    t0 = time.perf_counter()
    results = model.predict(dummy_img, verbose=False, conf=0.25)
    t1 = time.perf_counter()
    latency_ms = (t1 - t0) * 1000
    print(f"Dummy image inference executed in {latency_ms:.2f} ms")
    print(f"Boxes detected on blank image: {len(results[0].boxes)}")
    print("=" * 70)
    return not mismatch

if __name__ == "__main__":
    ckpt = "models/nagrik OS initial.pt"
    if len(sys.argv) > 1:
        ckpt = sys.argv[1]
    success = verify_checkpoint(ckpt)
    sys.exit(0 if success else 1)
