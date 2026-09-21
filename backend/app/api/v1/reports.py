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
    citizen_name: Optional[str] = Form("Citizen Reporter"),
    citizen_phone: Optional[str] = Form("+91 98765 43210"),
    issue_type: Optional[str] = Form("longitudinal crack"),
    primary_defect: Optional[str] = Form(None),
    description: str = Form(...),
    landmark: Optional[str] = Form(None),
    latitude: float = Form(...),
    longitude: float = Form(...),
    address: str = Form(...),
    ward_id: str = Form(...),
    ward_name: Optional[str] = Form(None),
    ai_detection_json: Optional[str] = Form(None),
    image_url: Optional[str] = Form(None),
):
    """
    Submits a new road defect report with photographic evidence.
    Persists image file to storage and saves record to persistent database.
    """
    try:
        saved_image_url = image_url

        # If a real image file is uploaded, persist to storage
        if file is not None:
            file_bytes = await file.read()
            if len(file_bytes) > 0:
                saved_image_url = await storage_service.save_image(file_bytes, filename=file.filename)

        if not saved_image_url:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Road report must include photographic evidence (file upload or image_url)."
            )

        # Parse AI detection payload if passed from review step
        ai_detection = None
        if ai_detection_json and ai_detection_json.strip():
            try:
                ai_detection = json.loads(ai_detection_json)
            except Exception:
                pass

        # If no AI detection was passed but an image exists, run real inference automatically
        if not ai_detection:
            try:
                if file is not None:
                    # Run inference on uploaded image
                    inf_resp = await inference_service.detect_async(file_bytes)
                    ai_detection = inf_resp.model_dump()
            except Exception as e:
                print(f"[Reports API] Automatic inference skipped: {e}")

        report_id = generate_report_id()
        req_data = CreateReportRequest(
            citizen_name=citizen_name,
            citizen_phone=citizen_phone,
            issue_type=issue_type or "longitudinal crack",
            primary_defect=primary_defect or issue_type,
            description=description,
            landmark=landmark,
            latitude=latitude,
            longitude=longitude,
            address=address,
            ward_id=ward_id,
            ward_name=ward_name,
            image_url=saved_image_url,
            ai_detection=ai_detection,
        )

        saved_report = create_report_in_db(
            report_id=report_id,
            citizen_id="USR-01",
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
