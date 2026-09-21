from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Query, status
from fastapi.responses import JSONResponse
from typing import Optional, Dict
from backend.app.schemas.ai import DetectionResponse, DetectionRequest, ModelInfoResponse
from backend.app.services.inference_service import inference_service

router = APIRouter(prefix="/ai", tags=["AI Road Defect Inference"])

@router.get("/health")
async def get_health():
    """Liveness probe: verifies the API process is alive and responsive."""
    return {
        "status": "UP",
        "service": "NagarSam AI Inference Engine",
        "ready": inference_service.is_ready,
    }

@router.get("/ready")
async def get_readiness():
    """Readiness probe: verifies the YOLO11 model checkpoint is loaded into memory and ready for inference."""
    if not inference_service.is_ready:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "NOT_READY",
                "reason": inference_service.load_error or "Model checkpoint is not loaded",
                "ready": False
            }
        )
    return {
        "status": "READY",
        "model_version": inference_service.get_model_info().model_version,
        "classes_count": len(inference_service.class_names),
        "ready": True
    }

@router.get("/model-info", response_model=ModelInfoResponse)
async def get_model_info():
    """Returns detailed metadata about the active YOLO11 road-defect detection model."""
    try:
        return inference_service.get_model_info()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/classes")
async def get_classes() -> Dict[int, str]:
    """Returns the verified 5-class mapping directly from the loaded checkpoint."""
    if not inference_service.is_ready:
        raise HTTPException(status_code=503, detail="Model is not ready. Class mapping unavailable.")
    return inference_service.class_names

@router.post("/detect", response_model=DetectionResponse)
async def detect_road_defects(
    file: Optional[UploadFile] = File(None),
    image_url: Optional[str] = Form(None),
    image_base64: Optional[str] = Form(None),
    confidence_threshold: Optional[float] = Form(None),
):
    """
    Runs YOLO11m road defect detection on an uploaded image file, base64 payload, or image URL.
    Returns exact class IDs, checkpoint-verified class names, bounding boxes in pixel coordinates, and latency.
    """
    try:
        image_input = None
        if file is not None:
            image_input = await file.read()
            if not image_input or len(image_input) == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Uploaded file is empty."
                )
        elif image_base64 is not None and image_base64.strip():
            image_input = image_base64.strip()
        elif image_url is not None and image_url.strip():
            image_input = image_url.strip()
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No image provided. Provide a file upload, image_base64, or image_url."
            )

        response = await inference_service.detect_async(
            image_input=image_input,
            confidence_threshold=confidence_threshold
        )
        return response
    except HTTPException:
        raise
    except (ValueError, OSError) as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid image format: {str(ve)}")
    except RuntimeError as re:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(re))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Inference error: {str(e)}")

@router.post("/detect-json", response_model=DetectionResponse)
async def detect_road_defects_json(request: DetectionRequest):
    """JSON payload variant for base64 or remote URL inference."""
    try:
        image_input = request.image_base64 or request.image_url
        if not image_input:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Must provide either image_base64 or image_url in JSON body."
            )
        response = await inference_service.detect_async(
            image_input=image_input,
            confidence_threshold=request.confidence_threshold
        )
        return response
    except HTTPException:
        raise
    except (ValueError, OSError) as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid image format: {str(ve)}")
    except RuntimeError as re:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(re))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Inference error: {str(e)}")
