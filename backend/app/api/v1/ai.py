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
    """Readiness probe: verifies dual YOLO model checkpoints are loaded into memory and ready for inference."""
    if not inference_service.is_ready:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "NOT_READY",
                "reason": inference_service.load_error or "Model checkpoints are not loaded",
                "ready": False
            }
        )
    info = inference_service.get_model_info()
    return {
        "status": "READY",
        "models": {k: {"name": v.name, "version": v.version, "status": v.status} for k, v in info.models.items()},
        "classes_count": len(inference_service.general_class_names),
        "ready": True
    }

@router.get("/model-info", response_model=ModelInfoResponse)
async def get_model_info():
    """Returns detailed metadata about the active dual YOLO road-defect detection models."""
    try:
        return inference_service.get_model_info()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/classes")
async def get_classes() -> Dict[str, str]:
    """Returns the verified class mappings directly from the loaded checkpoints."""
    if not inference_service.is_ready:
        raise HTTPException(status_code=503, detail="Models are not ready. Class mapping unavailable.")
    return {str(k): v for k, v in inference_service.general_class_names.items()}

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
