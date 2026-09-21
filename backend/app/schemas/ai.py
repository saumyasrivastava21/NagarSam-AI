from pydantic import BaseModel, Field
from typing import List, Optional, Tuple, Dict, Any

class DetectionItem(BaseModel):
    class_id: int = Field(..., description="Class ID directly from model prediction (0-4)")
    class_name: str = Field(..., description="Verified checkpoint class name")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score from model")
    bbox: List[float] = Field(..., description="Bounding box [x1, y1, x2, y2] in original image coordinates")

class ImageMeta(BaseModel):
    width: int
    height: int

class DetectionResponse(BaseModel):
    request_id: Optional[str] = None
    model_name: str
    model_version: str
    source: str = "live"
    status: str
    image: ImageMeta
    inference_time_ms: float
    detections: List[DetectionItem]
    primary_defect: Optional[str] = None
    primary_confidence: Optional[float] = None

class ModelInfoResponse(BaseModel):
    model_name: str
    model_version: str
    checkpoint_path: str
    framework: str
    classes_count: int
    classes: Dict[int, str]
    device: str
    status: str

class DetectionRequest(BaseModel):
    image_base64: Optional[str] = None
    image_url: Optional[str] = None
    confidence_threshold: Optional[float] = 0.25
