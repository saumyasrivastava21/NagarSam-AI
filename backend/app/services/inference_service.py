import os
import time
import io
import base64
import asyncio
import threading
from typing import List, Dict, Tuple, Optional
from PIL import Image
import numpy as np
import requests
from ultralytics import YOLO

from backend.app.config import settings
from backend.app.schemas.ai import DetectionItem, DetectionResponse, ImageMeta, ModelInfoResponse

class YOLOInferenceService:
    _instance: Optional["YOLOInferenceService"] = None
    _lock = threading.Lock()

    def __init__(self):
        self.checkpoint_path = settings.MODEL_PATH
        self.model: Optional[YOLO] = None
        self.class_names: Dict[int, str] = {}
        self.is_ready = False
        self.load_error: Optional[str] = None
        self._semaphore = asyncio.Semaphore(settings.MAX_CONCURRENT_INFERENCES)
        self.load_model()

    @classmethod
    def get_instance(cls) -> "YOLOInferenceService":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = YOLOInferenceService()
        return cls._instance

    def _ensure_checkpoint_available(self) -> str:
        """Downloads checkpoint from S3 if configured and not present locally."""
        local_path = self.checkpoint_path
        if os.path.exists(local_path):
            return local_path

        # If S3 URI is configured, attempt secure download
        if settings.MODEL_S3_URI and settings.MODEL_S3_URI.startswith("s3://"):
            try:
                import boto3
                from urllib.parse import urlparse
                parsed = urlparse(settings.MODEL_S3_URI)
                bucket_name = parsed.netloc
                key = parsed.path.lstrip('/')
                
                os.makedirs(settings.MODEL_CACHE_DIR, exist_ok=True)
                download_dest = os.path.join(settings.MODEL_CACHE_DIR, os.path.basename(key) or "model.pt")
                print(f"[YOLOInferenceService] Downloading model artifact from {settings.MODEL_S3_URI} to {download_dest}...")
                
                s3_client = boto3.client("s3")
                s3_client.download_file(bucket_name, key, download_dest)
                print(f"[YOLOInferenceService] S3 Model download complete: {download_dest}")
                self.checkpoint_path = download_dest
                return download_dest
            except Exception as e:
                print(f"[YOLOInferenceService] Failed to download from S3 ({settings.MODEL_S3_URI}): {e}")
        
        return local_path

    def load_model(self):
        """Loads and validates the YOLO11 model checkpoint."""
        try:
            target_path = self._ensure_checkpoint_available()
            if not os.path.exists(target_path):
                self.is_ready = False
                self.load_error = f"Checkpoint not found at: {target_path}."
                print(f"[YOLOInferenceService] ERROR: {self.load_error}")
                return

            print(f"[YOLOInferenceService] Loading YOLO model from {target_path}...")
            self.model = YOLO(target_path)
            
            # Extract and verify class mapping directly from model checkpoint
            names = self.model.names
            self.class_names = {int(k): str(v) for k, v in names.items()}
            self.is_ready = True
            self.load_error = None
            print(f"[YOLOInferenceService] Model loaded successfully on device '{settings.MODEL_DEVICE}' with {len(self.class_names)} classes: {self.class_names}")
        except Exception as e:
            self.is_ready = False
            self.load_error = str(e)
            print(f"[YOLOInferenceService] Exception loading model: {e}")

    def get_model_info(self) -> ModelInfoResponse:
        device_str = settings.MODEL_DEVICE
        if self.model is not None and hasattr(self.model, "device"):
            device_str = str(self.model.device)

        return ModelInfoResponse(
            model_name=settings.MODEL_NAME,
            model_version=settings.MODEL_VERSION,
            checkpoint_path=os.path.basename(self.checkpoint_path) if self.checkpoint_path else "unconfigured",
            framework="Ultralytics YOLO (PyTorch)",
            classes_count=len(self.class_names),
            classes=self.class_names,
            device=device_str,
            status="READY" if self.is_ready else "UNAVAILABLE",
        )

    def process_image(self, image_input) -> Tuple[Image.Image, int, int]:
        """Loads and verifies image dimensions without distortion."""
        max_bytes = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024
        
        if isinstance(image_input, Image.Image):
            img = image_input.convert("RGB")
        elif isinstance(image_input, bytes):
            if len(image_input) > max_bytes:
                raise ValueError(f"Image file size ({len(image_input)} bytes) exceeds max allowed {settings.MAX_IMAGE_SIZE_MB}MB.")
            img = Image.open(io.BytesIO(image_input)).convert("RGB")
        elif isinstance(image_input, str):
            if image_input.startswith("data:image"):
                header, base64_data = image_input.split(",", 1)
                img_bytes = base64.b64decode(base64_data)
                if len(img_bytes) > max_bytes:
                    raise ValueError(f"Image payload exceeds max allowed {settings.MAX_IMAGE_SIZE_MB}MB.")
                img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
            elif image_input.startswith("http://") or image_input.startswith("https://"):
                resp = requests.get(image_input, timeout=15)
                resp.raise_for_status()
                if len(resp.content) > max_bytes:
                    raise ValueError(f"Remote image exceeds max allowed {settings.MAX_IMAGE_SIZE_MB}MB.")
                img = Image.open(io.BytesIO(resp.content)).convert("RGB")
            elif os.path.exists(image_input):
                img = Image.open(image_input).convert("RGB")
            else:
                img_bytes = base64.b64decode(image_input)
                if len(img_bytes) > max_bytes:
                    raise ValueError(f"Image payload exceeds max allowed {settings.MAX_IMAGE_SIZE_MB}MB.")
                img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        else:
            raise ValueError(f"Unsupported image input type: {type(image_input)}")

        width, height = img.size
        if width <= 0 or height <= 0:
            raise ValueError("Invalid image dimensions detected.")
        return img, width, height

    def _sync_predict(self, img: Image.Image, conf: float) -> Tuple[List[DetectionItem], Optional[str], Optional[float], float]:
        """Synchronous inference runner called within thread pool."""
        t0 = time.perf_counter()
        results = self.model.predict(
            source=img,
            conf=conf,
            iou=settings.MODEL_IOU_THRESHOLD,
            imgsz=settings.MODEL_IMAGE_SIZE,
            verbose=False,
            device=settings.MODEL_DEVICE
        )
        t1 = time.perf_counter()
        inference_time_ms = round((t1 - t0) * 1000, 2)

        detections: List[DetectionItem] = []
        primary_defect: Optional[str] = None
        primary_confidence: Optional[float] = None

        if len(results) > 0 and results[0].boxes is not None:
            boxes = results[0].boxes
            for i in range(len(boxes)):
                cls_id = int(boxes.cls[i].item())
                cls_name = self.class_names.get(cls_id, f"class_{cls_id}")
                conf_score = round(float(boxes.conf[i].item()), 4)
                
                # Raw pixel coordinates in original un-normalized image space [x1, y1, x2, y2]
                xyxy = boxes.xyxy[i].tolist()
                bbox = [round(float(c), 2) for c in xyxy]

                detections.append(
                    DetectionItem(
                        class_id=cls_id,
                        class_name=cls_name,
                        confidence=conf_score,
                        bbox=bbox
                    )
                )

            if detections:
                # Primary defect derived strictly from highest confidence detection
                sorted_by_conf = sorted(detections, key=lambda d: d.confidence, reverse=True)
                primary_defect = sorted_by_conf[0].class_name
                primary_confidence = sorted_by_conf[0].confidence

        return detections, primary_defect, primary_confidence, inference_time_ms

    async def detect_async(
        self,
        image_input,
        confidence_threshold: Optional[float] = None
    ) -> DetectionResponse:
        """Asynchronous non-blocking inference wrapper with concurrency control."""
        if not self.is_ready or self.model is None:
            self.load_model()
            if not self.is_ready or self.model is None:
                raise RuntimeError(f"AI Model is unavailable: {self.load_error or 'Checkpoint failed to load.'}")

        conf = confidence_threshold if confidence_threshold is not None else settings.MODEL_CONFIDENCE_THRESHOLD
        img, width, height = self.process_image(image_input)

        async with self._semaphore:
            # Offload CPU/GPU intensive predict call to thread pool
            detections, primary_defect, primary_confidence, inference_time_ms = await asyncio.to_thread(
                self._sync_predict, img, conf
            )

        import uuid
        req_id = f"req_{uuid.uuid4().hex[:12]}"

        return DetectionResponse(
            request_id=req_id,
            model_name=settings.MODEL_NAME,
            model_version=settings.MODEL_VERSION,
            source="live",
            status="completed",
            image=ImageMeta(width=width, height=height),
            inference_time_ms=inference_time_ms,
            detections=detections,
            primary_defect=primary_defect,
            primary_confidence=primary_confidence,
        )

    def detect(self, image_input, confidence_threshold: Optional[float] = None) -> DetectionResponse:
        """Synchronous wrapper for scripts / unit tests."""
        if not self.is_ready or self.model is None:
            self.load_model()
            if not self.is_ready or self.model is None:
                raise RuntimeError(f"AI Model is unavailable: {self.load_error or 'Checkpoint failed to load.'}")

        conf = confidence_threshold if confidence_threshold is not None else settings.MODEL_CONFIDENCE_THRESHOLD
        img, width, height = self.process_image(image_input)
        detections, primary_defect, primary_confidence, inference_time_ms = self._sync_predict(img, conf)

        import uuid
        req_id = f"req_{uuid.uuid4().hex[:12]}"

        return DetectionResponse(
            request_id=req_id,
            model_name=settings.MODEL_NAME,
            model_version=settings.MODEL_VERSION,
            source="live",
            status="completed",
            image=ImageMeta(width=width, height=height),
            inference_time_ms=inference_time_ms,
            detections=detections,
            primary_defect=primary_defect,
            primary_confidence=primary_confidence,
        )

inference_service = YOLOInferenceService.get_instance()
