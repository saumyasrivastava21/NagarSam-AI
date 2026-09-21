import json
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Query, status
from fastapi.responses import JSONResponse
from typing import Optional, List, Dict, Any

from backend.app.schemas.reports import (
    CreateReportRequest,
    ReportResponse,
    PaginatedReportsResponse,
    UpdateReportStatusRequest,
)
from backend.app.db.reports_repo import (
    generate_report_id,
    create_report_in_db,
    get_report_from_db,
    list_reports_from_db,
    update_report_status_in_db,
)
from backend.app.services.storage_service import storage_service
from backend.app.services.inference_service import inference_service

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    file: Optional[UploadFile] = File(None),
    image: Optional[UploadFile] = File(None),
    citizen_name: Optional[str] = Form("Citizen Reporter"),
    citizen_phone: Optional[str] = Form("+91 98765 43210"),
    citizen_id: Optional[str] = Form("USR-01"),
    title: Optional[str] = Form(None),
    issue_type: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    primary_defect: Optional[str] = Form(None),
    severity: Optional[str] = Form("medium"),
    priority: Optional[str] = Form("medium"),
    description: Optional[str] = Form("Road surface issue reported by citizen"),
    landmark: Optional[str] = Form(None),
    latitude: Optional[float] = Form(12.9716),
    longitude: Optional[float] = Form(77.5946),
    address: Optional[str] = Form(None),
    ward_id: Optional[str] = Form("W-12"),
    ward_name: Optional[str] = Form("Ward 12"),
    ai_status: Optional[str] = Form(None),
    ai_detection_json: Optional[str] = Form(None),
    ai_detections: Optional[str] = Form(None),
    ai_metadata: Optional[str] = Form(None),
    image_url: Optional[str] = Form(None),
):
    """
    Submits a new road defect report with photographic evidence.
    Persists image file to storage and saves record to persistent database.
    """
    try:
        saved_image_url = image_url
        actual_file = file or image

        # If a real image file is uploaded, persist to storage
        if actual_file is not None:
            file_bytes = await actual_file.read()
            if len(file_bytes) > 0:
                saved_image_url = await storage_service.save_image(file_bytes, filename=actual_file.filename)

        if not saved_image_url:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Road report must include photographic evidence (file upload or image_url)."
            )

        # Parse AI detection payload if passed from review step
        ai_detection = None
        raw_json = ai_detection_json or ai_detections
        if raw_json and raw_json.strip():
            try:
                parsed_det = json.loads(raw_json)
                parsed_meta = json.loads(ai_metadata) if ai_metadata else {}
                if isinstance(parsed_det, list):
                    ai_detection = {
                        "status": ai_status or "completed",
                        "source": "live",
                        "models": parsed_meta.get("models", {
                            "pothole": {"version": "pothole-v1", "status": "completed"},
                            "general": {"version": "road-defect-v1", "status": "completed"}
                        }),
                        "inference_time_ms": parsed_meta.get("inference_time_ms", 120),
                        "detections": parsed_det,
                        "primary_defect": parsed_det[0]["class_name"] if parsed_det else None,
                        "primary_confidence": parsed_det[0]["confidence"] if parsed_det else None,
                    }
                elif isinstance(parsed_det, dict):
                    ai_detection = parsed_det
            except Exception as e:
                print(f"[Reports API] JSON parsing error: {e}")

        # If no AI detection was passed but an image exists, run real inference automatically
        if not ai_detection:
            try:
                if actual_file is not None:
                    inf_resp = await inference_service.detect_async(file_bytes)
                    ai_detection = inf_resp.model_dump()
            except Exception as e:
                print(f"[Reports API] Automatic inference skipped: {e}")

        report_id = generate_report_id()
        defect_name = primary_defect or issue_type or category or "longitudinal crack"
        computed_address = address or (f"Near {landmark}" if landmark else "Reported Location, Ward 12")

        req_data = CreateReportRequest(
            citizen_name=citizen_name or "Citizen Reporter",
            citizen_phone=citizen_phone or "+91 98765 43210",
            issue_type=defect_name,
            primary_defect=defect_name,
            description=description or "Road issue reported",
            landmark=landmark,
            latitude=latitude or 12.9716,
            longitude=longitude or 77.5946,
            address=computed_address,
            ward_id=ward_id or "W-12",
            ward_name=ward_name or "Ward 12",
            image_url=saved_image_url,
            ai_detection=ai_detection,
        )

        saved_report = create_report_in_db(
            report_id=report_id,
            citizen_id=citizen_id or "USR-01",
            data=req_data,
            image_url=saved_image_url,
            ai_detection=ai_detection,
        )

        return saved_report

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit report: {str(e)}")

@router.post("/json", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report_json(request: CreateReportRequest):
    """JSON payload variant for report submission."""
    try:
        if not request.image_url:
            raise HTTPException(status_code=400, detail="Must provide image_url.")

        report_id = generate_report_id()
        saved_report = create_report_in_db(
            report_id=report_id,
            citizen_id="USR-01",
            data=request,
            image_url=request.image_url,
            ai_detection=request.ai_detection,
        )
        return saved_report
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit report: {str(e)}")

@router.get("", response_model=PaginatedReportsResponse)
async def get_reports(
    citizenId: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    wardId: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """Fetches real persisted reports with filtering, searching, and pagination."""
    try:
        reports, total = list_reports_from_db(
            citizen_id=citizenId,
            status=status,
            severity=severity,
            priority=priority,
            ward_id=wardId,
            search=search,
            page=page,
            limit=limit,
        )
        total_pages = (total + limit - 1) // limit if total > 0 else 1

        return {
            "data": reports,
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": total_pages,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing reports: {str(e)}")

@router.get("/{report_id}", response_model=ReportResponse)
async def get_report_by_id(report_id: str):
    """Fetches an individual persisted road defect report."""
    report = get_report_from_db(report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report {report_id} not found."
        )
    return report

@router.patch("/{report_id}/status", response_model=ReportResponse)
async def update_report_status(report_id: str, request: UpdateReportStatusRequest):
    """Updates the status of a road defect report."""
    updated = update_report_status_in_db(report_id, request.status, request.note)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Report {report_id} not found.")
    return updated
