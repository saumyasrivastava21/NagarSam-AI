from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Query
from typing import Optional, Dict
from backend.app.schemas.ai import DetectionResponse, DetectionRequest, ModelInfoResponse
from backend.app.services.inference_service import inference_service

router = APIRouter(prefix="/ai", tags=["AI Road Defect Inference"])

@router.get("/model-info", response_model=ModelInfoResponse)
async def get_model_info():
    """Returns metadata about the active YOLO11 road-defect detection model."""
    try:
        return inference_service.get_model_info()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/classes")
async def get_classes() -> Dict[int, str]:
    """Returns the verified 5-class mapping directly from the loaded checkpoint."""
    return inference_service.class_names

@router.post("/detect", response_model=DetectionResponse)
async def detect_road_defects(
    file: Optional[UploadFile] = File(None),
    image_url: Optional[str] = Form(None),
    image_base64: Optional[str] = Form(None),
    confidence_threshold: Optional[float] = Form(0.25),
):
    """
    Runs YOLO11m road defect detection on an uploaded image file, base64 payload, or image URL.
    Returns exact class IDs, checkpoint-verified class names, bounding boxes in pixel coordinates, and latency.
    """
    try:
        image_input = None
        if file is not None:
            image_input = await file.read()
        elif image_base64 is not None and image_base64.strip():
            image_input = image_base64.strip()
        elif image_url is not None and image_url.strip():
            image_input = image_url.strip()
        else:
            raise HTTPException(
                status_code=400,
                detail="No image provided. Provide a file upload, image_base64, or image_url."
            )

        response = inference_service.detect(
            image_input=image_input,
            confidence_threshold=confidence_threshold
        )
        return response
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

@router.post("/detect-json", response_model=DetectionResponse)
async def detect_road_defects_json(request: DetectionRequest):
    """JSON payload variant for base64 or remote URL inference."""
    try:
        image_input = request.image_base64 or request.image_url
        if not image_input:
            raise HTTPException(
                status_code=400,
                detail="Must provide either image_base64 or image_url in JSON body."
            )
        response = inference_service.detect(
            image_input=image_input,
            confidence_threshold=request.confidence_threshold
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")
