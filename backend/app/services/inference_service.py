import os
import time
import io
import base64
from typing import List, Dict, Tuple, Optional
from PIL import Image
import numpy as np
import requests
from ultralytics import YOLO

from backend.app.config import settings
from backend.app.schemas.ai import DetectionItem, DetectionResponse, ImageMeta, ModelInfoResponse

class YOLOInferenceService:
    _instance: Optional["YOLOInferenceService"] = None

    def __init__(self):
        self.checkpoint_path = settings.CHECKPOINT_PATH
        self.model: Optional[YOLO] = None
        self.class_names: Dict[int, str] = {}
        self.load_model()

    @classmethod
    def get_instance(cls) -> "YOLOInferenceService":
        if cls._instance is None:
            cls._instance = YOLOInferenceService()
        return cls._instance

    def load_model(self):
        if not os.path.exists(self.checkpoint_path):
            raise FileNotFoundError(
                f"Checkpoint not found at: {self.checkpoint_path}. Ensure models/nagrik OS initial.pt exists."
            )
        
        print(f"[YOLOInferenceService] Loading YOLO model from {self.checkpoint_path}...")
        self.model = YOLO(self.checkpoint_path)
        
        # Extract class mapping directly from model checkpoint
        names = self.model.names
        self.class_names = {int(k): str(v) for k, v in names.items()}
        print(f"[YOLOInferenceService] Loaded {len(self.class_names)} classes: {self.class_names}")

    def get_model_info(self) -> ModelInfoResponse:
        return ModelInfoResponse(
            model_name=settings.MODEL_NAME,
            model_version=settings.MODEL_VERSION,
            checkpoint_path=os.path.abspath(self.checkpoint_path),
            framework="Ultralytics YOLO (PyTorch)",
            classes_count=len(self.class_names),
            classes=self.class_names,
            device=str(getattr(self.model, "device", "cpu")),
            status="PRODUCTION_CANDIDATE" if self.model is not None else "UNINITIALIZED",
        )

    def process_image(self, image_input) -> Tuple[Image.Image, int, int]:
        """Loads and verifies image dimensions without distortion."""
        if isinstance(image_input, Image.Image):
            img = image_input.convert("RGB")
        elif isinstance(image_input, bytes):
            img = Image.open(io.BytesIO(image_input)).convert("RGB")
        elif isinstance(image_input, str):
            if image_input.startswith("data:image"):
                # Base64 string
                header, base64_data = image_input.split(",", 1)
                img_bytes = base64.b64decode(base64_data)
                img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
            elif image_input.startswith("http://") or image_input.startswith("https://"):
                # URL
                resp = requests.get(image_input, timeout=10)
                resp.raise_for_status()
                img = Image.open(io.BytesIO(resp.content)).convert("RGB")
            elif os.path.exists(image_input):
                img = Image.open(image_input).convert("RGB")
            else:
                # Try raw base64
                img_bytes = base64.b64decode(image_input)
                img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        else:
            raise ValueError(f"Unsupported image input type: {type(image_input)}")

        width, height = img.size
        return img, width, height

    def detect(
        self,
        image_input,
        confidence_threshold: Optional[float] = None
    ) -> DetectionResponse:
        if self.model is None:
            self.load_model()

        conf = confidence_threshold if confidence_threshold is not None else settings.DEFAULT_CONFIDENCE
        img, width, height = self.process_image(image_input)

        # Run inference and measure latency accurately
        t0 = time.perf_counter()
        results = self.model.predict(
            source=img,
            conf=conf,
            imgsz=640,
            verbose=False,
            device=settings.DEVICE
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
                # Use model's verified embedded class name
                cls_name = self.class_names.get(cls_id, f"class_{cls_id}")
                conf_score = round(float(boxes.conf[i].item()), 4)
                
                # Bounding box in original image coordinates [x1, y1, x2, y2]
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

            # Sort by highest confidence for primary detection descriptor
            if detections:
                sorted_by_conf = sorted(detections, key=lambda d: d.confidence, reverse=True)
                primary_defect = sorted_by_conf[0].class_name
                primary_confidence = sorted_by_conf[0].confidence

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
