import os
import time
import io
import base64
import asyncio
import threading
from typing import List, Dict, Tuple, Optional, Any
from PIL import Image
import numpy as np
import requests
from ultralytics import YOLO

from backend.app.config import settings
from backend.app.schemas.ai import (
    DetectionItem,
    DetectionResponse,
    ImageMeta,
    ModelInfoResponse,
    SingleModelInfo,
    ModelExecutionStatus,
    DualModelMetadata,
)

class DualYOLOInferenceService:
    _instance: Optional["DualYOLOInferenceService"] = None
    _lock = threading.Lock()

    def __init__(self):
        self.pothole_path = settings.POTHOLE_MODEL_PATH
        self.general_path = settings.GENERAL_MODEL_PATH

        self.pothole_model: Optional[YOLO] = None
        self.general_model: Optional[YOLO] = None

        self.pothole_classes: Dict[int, str] = {}
        self.general_classes: Dict[int, str] = {}

        self.pothole_ready = False
        self.general_ready = False

        self.pothole_error: Optional[str] = None
        self.general_error: Optional[str] = None

        self._semaphore = asyncio.Semaphore(settings.MAX_CONCURRENT_INFERENCES)
        self.load_models()

    @classmethod
    def get_instance(cls) -> "DualYOLOInferenceService":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = DualYOLOInferenceService()
        return cls._instance

    @property
    def is_ready(self) -> bool:
        # Service is ready when at least one model is operational (or both)
        return self.pothole_ready or self.general_ready

    @property
    def general_class_names(self) -> Dict[int, str]:
        return self.general_classes

    @property
    def pothole_class_names(self) -> Dict[int, str]:
        return self.pothole_classes

    @property
    def class_names(self) -> Dict[int, str]:
        # Authoritative unified 5 classes
        return {
            0: "longitudinal crack",
            1: "transverse crack",
            2: "alligator crack",
            3: "other corruption",
            4: "pothole"
        }

    def load_models(self):
        """Loads and initializes both Model A (Pothole) and Model B (General Defect)."""
        # 1. Load Pothole Model
        try:
            if not os.path.exists(self.pothole_path):
                self.pothole_ready = False
                self.pothole_error = f"Pothole checkpoint not found at: {self.pothole_path}"
                print(f"[DualYOLOInferenceService] WARN: {self.pothole_error}")
            else:
                print(f"[DualYOLOInferenceService] Loading Pothole Detector from {self.pothole_path}...")
                self.pothole_model = YOLO(self.pothole_path)
                self.pothole_classes = {int(k): str(v) for k, v in self.pothole_model.names.items()}
                self.pothole_ready = True
                self.pothole_error = None
                print(f"[DualYOLOInferenceService] Pothole model loaded ({len(self.pothole_classes)} classes)")
        except Exception as e:
            self.pothole_ready = False
            self.pothole_error = str(e)
            print(f"[DualYOLOInferenceService] Error loading Pothole model: {e}")

        # 2. Load General Defect Model
        try:
            if not os.path.exists(self.general_path):
                self.general_ready = False
                self.general_error = f"General checkpoint not found at: {self.general_path}"
                print(f"[DualYOLOInferenceService] WARN: {self.general_error}")
            else:
                print(f"[DualYOLOInferenceService] Loading General Road Defect Detector from {self.general_path}...")
                self.general_model = YOLO(self.general_path)
                self.general_classes = {int(k): str(v) for k, v in self.general_model.names.items()}
                self.general_ready = True
                self.general_error = None
                print(f"[DualYOLOInferenceService] General model loaded ({len(self.general_classes)} classes: {self.general_classes})")
        except Exception as e:
            self.general_ready = False
            self.general_error = str(e)
            print(f"[DualYOLOInferenceService] Error loading General model: {e}")

    def get_model_info(self) -> ModelInfoResponse:
        p_info = SingleModelInfo(
            name=settings.POTHOLE_MODEL_NAME,
            version=settings.POTHOLE_MODEL_VERSION,
            checkpoint_path=os.path.basename(self.pothole_path),
            architecture="Ultralytics YOLO (PyTorch)",
            classes_count=len(self.pothole_classes),
            classes={4: "Pothole"} if self.pothole_ready else self.pothole_classes,
            device=settings.MODEL_DEVICE,
            status="READY" if self.pothole_ready else f"UNAVAILABLE: {self.pothole_error}",
        )

        g_info = SingleModelInfo(
            name=settings.GENERAL_MODEL_NAME,
            version=settings.GENERAL_MODEL_VERSION,
            checkpoint_path=os.path.basename(self.general_path),
            architecture="Ultralytics YOLO (PyTorch)",
            classes_count=len(self.general_classes),
            classes=self.general_classes,
            device=settings.MODEL_DEVICE,
            status="READY" if self.general_ready else f"UNAVAILABLE: {self.general_error}",
        )

        overall_status = "FULLY_READY" if (self.pothole_ready and self.general_ready) else "PARTIALLY_READY" if self.is_ready else "UNAVAILABLE"

        return ModelInfoResponse(
            status=overall_status,
            device=settings.MODEL_DEVICE,
            models={
                "pothole": p_info,
                "general": g_info,
            }
        )

    def process_image(self, image_input) -> Tuple[Image.Image, int, int]:
        """Loads and verifies image dimensions without distortion."""
        max_bytes = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024
        
        if isinstance(image_input, Image.Image):
            img = image_input.convert("RGB")
        elif isinstance(image_input, bytes):
            if len(image_input) > max_bytes:
                raise ValueError(f"Image file size exceeds {settings.MAX_IMAGE_SIZE_MB}MB.")
            img = Image.open(io.BytesIO(image_input)).convert("RGB")
        elif isinstance(image_input, str):
            if image_input.startswith("data:image"):
                header, base64_data = image_input.split(",", 1)
                img_bytes = base64.b64decode(base64_data)
                img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
            elif image_input.startswith("http://") or image_input.startswith("https://"):
                resp = requests.get(image_input, timeout=15)
                resp.raise_for_status()
                img = Image.open(io.BytesIO(resp.content)).convert("RGB")
            elif os.path.exists(image_input):
                img = Image.open(image_input).convert("RGB")
            else:
                img_bytes = base64.b64decode(image_input)
                img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        else:
            raise ValueError(f"Unsupported image input type: {type(image_input)}")

        width, height = img.size
        if width <= 0 or height <= 0:
            raise ValueError("Invalid image dimensions detected.")
        return img, width, height

    @staticmethod
    def _calculate_iou(boxA: List[float], boxB: List[float]) -> float:
        """Calculates Intersection-over-Union (IoU) between two bounding boxes [x1, y1, x2, y2]."""
        xA = max(boxA[0], boxB[0])
        yA = max(boxA[1], boxB[1])
        xB = min(boxA[2], boxB[2])
        yB = min(boxA[3], boxB[3])
        interArea = max(0.0, xB - xA) * max(0.0, yB - yA)
        boxAArea = max(0.0, boxA[2] - boxA[0]) * max(0.0, boxA[3] - boxA[1])
        boxBArea = max(0.0, boxB[2] - boxB[0]) * max(0.0, boxB[3] - boxB[1])
        denom = boxAArea + boxBArea - interArea
        return interArea / denom if denom > 0 else 0.0

    def _sync_predict_dual(
        self,
        img: Image.Image,
        confidence_threshold: Optional[float] = None
    ) -> Tuple[List[DetectionItem], DualModelMetadata, str, float]:
        """Runs both models, filters routing, merges valid predictions, and captures per-model status."""
        pothole_conf = confidence_threshold if confidence_threshold is not None else settings.POTHOLE_CONFIDENCE_THRESHOLD
        general_conf = confidence_threshold if confidence_threshold is not None else settings.GENERAL_CONFIDENCE_THRESHOLD

        pothole_status = "uninitialized"
        general_status = "uninitialized"
        pothole_err = None
        general_err = None

        merged_detections: List[DetectionItem] = []

        t0 = time.perf_counter()

        pothole_detections: List[DetectionItem] = []
        general_detections: List[DetectionItem] = []

        # 1. Run Pothole-Specific Model
        if self.pothole_ready and self.pothole_model is not None:
            try:
                p_results = self.pothole_model.predict(
                    source=img,
                    conf=pothole_conf,
                    iou=settings.MODEL_IOU_THRESHOLD,
                    imgsz=settings.MODEL_IMAGE_SIZE,
                    verbose=False,
                    device=settings.MODEL_DEVICE
                )
                pothole_status = "completed"

                if len(p_results) > 0 and p_results[0].boxes is not None:
                    p_boxes = p_results[0].boxes
                    for i in range(len(p_boxes)):
                        raw_cls_id = int(p_boxes.cls[i].item())
                        raw_cls_name = self.pothole_classes.get(raw_cls_id, "Pothole")
                        conf_score = round(float(p_boxes.conf[i].item()), 4)
                        xyxy = [round(float(c), 2) for c in p_boxes.xyxy[i].tolist()]

                        # Only accept if class is pothole or single-class index 0
                        if raw_cls_id == 0 or "pothole" in str(raw_cls_name).lower():
                            pothole_detections.append(
                                DetectionItem(
                                    class_id=4,
                                    class_name="Pothole",
                                    confidence=conf_score,
                                    bbox=xyxy,
                                    model_source="pothole"
                                )
                            )
            except Exception as e:
                pothole_status = "failed"
                pothole_err = str(e)
        else:
            pothole_status = "failed"
            pothole_err = self.pothole_error or "Model not loaded"

        # 2. Run General Road-Defect Model
        if self.general_ready and self.general_model is not None:
            try:
                g_results = self.general_model.predict(
                    source=img,
                    conf=general_conf,
                    iou=settings.MODEL_IOU_THRESHOLD,
                    imgsz=settings.MODEL_IMAGE_SIZE,
                    verbose=False,
                    device=settings.MODEL_DEVICE
                )
                general_status = "completed"

                if len(g_results) > 0 and g_results[0].boxes is not None:
                    g_boxes = g_results[0].boxes
                    for i in range(len(g_boxes)):
                        cls_id = int(g_boxes.cls[i].item())
                        cls_name = self.general_classes.get(cls_id, f"class_{cls_id}")
                        conf_score = round(float(g_boxes.conf[i].item()), 4)
                        xyxy = [round(float(c), 2) for c in g_boxes.xyxy[i].tolist()]

                        if cls_id == 4 or "pothole" in cls_name.lower():
                            # Check if pothole model already detected a pothole with high IoU
                            has_overlap = False
                            for p_det in pothole_detections:
                                iou = self._calculate_iou(xyxy, p_det.bbox)
                                if iou > 0.4:
                                    has_overlap = True
                                    break
                            if not has_overlap:
                                pothole_detections.append(
                                    DetectionItem(
                                        class_id=4,
                                        class_name="Pothole",
                                        confidence=conf_score,
                                        bbox=xyxy,
                                        model_source="general"
                                    )
                                )
                        else:
                            general_detections.append(
                                DetectionItem(
                                    class_id=cls_id,
                                    class_name=cls_name,
                                    confidence=conf_score,
                                    bbox=xyxy,
                                    model_source="general"
                                )
                            )
            except Exception as e:
                general_status = "failed"
                general_err = str(e)
        else:
            general_status = "failed"
            general_err = self.general_error or "Model not loaded"

        # Merge deduplicated pothole and general detections
        merged_detections = pothole_detections + general_detections

        t1 = time.perf_counter()
        inference_time_ms = round((t1 - t0) * 1000, 2)

        # 3. Determine Overall Dual-Model Execution Status
        if pothole_status == "completed" and general_status == "completed":
            overall_status = "completed"
        elif pothole_status == "completed" or general_status == "completed":
            overall_status = "partial"
        else:
            overall_status = "failed"

        models_meta = DualModelMetadata(
            pothole=ModelExecutionStatus(
                name=settings.POTHOLE_MODEL_NAME,
                version=settings.POTHOLE_MODEL_VERSION,
                status=pothole_status,
                error=pothole_err,
                classes_count=len(self.pothole_classes)
            ),
            general=ModelExecutionStatus(
                name=settings.GENERAL_MODEL_NAME,
                version=settings.GENERAL_MODEL_VERSION,
                status=general_status,
                error=general_err,
                classes_count=len(self.general_classes)
            )
        )

        return merged_detections, models_meta, overall_status, inference_time_ms

    async def detect_async(
        self,
        image_input,
        confidence_threshold: Optional[float] = None
    ) -> DetectionResponse:
        """Asynchronous non-blocking dual-model inference pipeline."""
        if not self.is_ready:
            self.load_models()
            if not self.is_ready:
                raise RuntimeError("No AI models are available. Check checkpoint availability.")

        img, width, height = self.process_image(image_input)

        async with self._semaphore:
            detections, models_meta, overall_status, inference_time_ms = await asyncio.to_thread(
                self._sync_predict_dual, img, confidence_threshold
            )

        primary_defect = None
        primary_confidence = None
        if detections:
            sorted_by_conf = sorted(detections, key=lambda d: d.confidence, reverse=True)
            primary_defect = sorted_by_conf[0].class_name
            primary_confidence = sorted_by_conf[0].confidence

        import uuid
        req_id = f"req_{uuid.uuid4().hex[:12]}"

        return DetectionResponse(
            request_id=req_id,
            status=overall_status,
            source="live",
            image=ImageMeta(width=width, height=height),
            inference_time_ms=inference_time_ms,
            models=models_meta,
            detections=detections,
            primary_defect=primary_defect,
            primary_confidence=primary_confidence,
        )

    def detect(self, image_input, confidence_threshold: Optional[float] = None) -> DetectionResponse:
        """Synchronous wrapper for test execution."""
        if not self.is_ready:
            self.load_models()
            if not self.is_ready:
                raise RuntimeError("No AI models are available.")

        img, width, height = self.process_image(image_input)
        detections, models_meta, overall_status, inference_time_ms = self._sync_predict_dual(img, confidence_threshold)

        primary_defect = None
        primary_confidence = None
        if detections:
            sorted_by_conf = sorted(detections, key=lambda d: d.confidence, reverse=True)
            primary_defect = sorted_by_conf[0].class_name
            primary_confidence = sorted_by_conf[0].confidence

        import uuid
        req_id = f"req_{uuid.uuid4().hex[:12]}"

        return DetectionResponse(
            request_id=req_id,
            status=overall_status,
            source="live",
            image=ImageMeta(width=width, height=height),
            inference_time_ms=inference_time_ms,
            models=models_meta,
            detections=detections,
            primary_defect=primary_defect,
            primary_confidence=primary_confidence,
        )

inference_service = DualYOLOInferenceService.get_instance()
dual_inference_service = inference_service
