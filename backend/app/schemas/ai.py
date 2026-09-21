from pydantic import BaseModel, Field
from typing import List, Optional, Tuple, Dict, Any

class DetectionItem(BaseModel):
    class_id: int = Field(..., description="Class ID directly from model prediction")
    class_name: str = Field(..., description="Verified checkpoint class name")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score from model")
    bbox: List[float] = Field(..., description="Bounding box [x1, y1, x2, y2] in original image coordinates")
    model_source: Optional[str] = Field("general", description="Source model: 'pothole' or 'general'")

class ImageMeta(BaseModel):
    width: int
    height: int

class ModelExecutionStatus(BaseModel):
    name: str
    version: str
    status: str
    error: Optional[str] = None
    classes_count: Optional[int] = None

class DualModelMetadata(BaseModel):
    pothole: ModelExecutionStatus
    general: ModelExecutionStatus

class DetectionResponse(BaseModel):
    request_id: Optional[str] = None
    status: str = "completed"  # "completed", "partial", "failed"
    source: str = "live"
    image: ImageMeta
    inference_time_ms: float
    models: Optional[DualModelMetadata] = None
    detections: List[DetectionItem]
    primary_defect: Optional[str] = None
    primary_confidence: Optional[float] = None

class SingleModelInfo(BaseModel):
    name: str
    version: str
    checkpoint_path: str
    architecture: str
    classes_count: int
    classes: Dict[int, str]
    device: str
    status: str

class ModelInfoResponse(BaseModel):
    status: str
    device: str
    models: Dict[str, SingleModelInfo]

class DetectionRequest(BaseModel):
    image_base64: Optional[str] = None
    image_url: Optional[str] = None
    confidence_threshold: Optional[float] = None
