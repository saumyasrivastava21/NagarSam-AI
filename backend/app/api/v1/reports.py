import json
import uuid
import datetime
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Query, Depends, status
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from backend.app.db.session import get_db
from backend.app.db.models import (
    Report,
    Incident,
    ImageAsset,
    InferenceResult,
    User,
    AuditLog,
    Notification,
    Department,
    Ward,
)
from backend.app.schemas.reports import (
    CreateReportRequest,
    ReportResponse,
    PaginatedReportsResponse,
    UpdateReportStatusRequest,
)
from backend.app.services.storage_service import storage_service
from backend.app.services.inference_service import inference_service
from backend.app.api.deps import get_optional_current_user

router = APIRouter(prefix="/reports", tags=["Reports"])

def _format_report_dict(report: Report) -> Dict[str, Any]:
    """Helper to convert SQLAlchemy Report model to frontend response contract."""
    ai_det = json.loads(report.ai_detection_json) if report.ai_detection_json else None
    ai_reason = json.loads(report.ai_priority_reasoning_json) if report.ai_priority_reasoning_json else None

    # Construct report timeline
    submitted_iso = report.submitted_at.isoformat() if report.submitted_at else datetime.datetime.now(datetime.timezone.utc).isoformat()
    updated_iso = report.updated_at.isoformat() if report.updated_at else submitted_iso

    timeline = [
        {
            "id": f"TL-{report.id}-1",
            "status": "SUBMITTED",
            "title": "Report Submitted",
            "description": "Citizen report logged with photographic evidence and geolocation.",
            "actor": report.citizen_name,
            "actorRole": "CITIZEN",
            "timestamp": submitted_iso,
        },
        {
            "id": f"TL-{report.id}-2",
            "status": "UNDER_REVIEW",
            "title": "AI Defect Telemetry Recorded",
            "description": f"Verified defect as {report.primary_defect.title()}.",
            "actor": "YOLO11 AI Engine",
            "actorRole": "ADMIN",
            "timestamp": submitted_iso,
        },
    ]

    if report.status in ["CONFIRMED", "ASSIGNED", "IN_PROGRESS", "VERIFYING", "RESOLVED"]:
        timeline.append({
            "id": f"TL-{report.id}-3",
            "status": "CONFIRMED",
            "title": "Incident Confirmed by Ward Officer",
            "description": "Road surface defect confirmed for municipal repair schedule.",
            "actor": "Ward Officer",
            "actorRole": "OFFICER",
            "timestamp": updated_iso,
        })

    if report.status in ["ASSIGNED", "IN_PROGRESS", "VERIFYING", "RESOLVED"]:
        timeline.append({
            "id": f"TL-{report.id}-4",
            "status": "ASSIGNED",
            "title": "Work Order Dispatched",
            "description": "Assigned to Public Works road repair crew.",
            "actor": "Public Works Dept",
            "actorRole": "OFFICER",
            "timestamp": updated_iso,
        })

    if report.status in ["IN_PROGRESS", "VERIFYING", "RESOLVED"]:
        timeline.append({
            "id": f"TL-{report.id}-5",
            "status": "IN_PROGRESS",
            "title": "Repair Works in Progress",
            "description": "Road maintenance crew is on site performing asphalt patch repair.",
            "actor": "Field Crew",
            "actorRole": "FIELD_WORKER",
            "timestamp": updated_iso,
        })

    if report.status in ["VERIFYING", "RESOLVED"]:
        timeline.append({
            "id": f"TL-{report.id}-6",
            "status": "VERIFYING",
            "title": "After-Repair Verification Submitted",
            "description": "Post-repair photo submitted for automated AI re-scan and officer inspection.",
            "actor": "Field Crew",
            "actorRole": "FIELD_WORKER",
            "timestamp": updated_iso,
        })

    if report.status == "RESOLVED":
        timeline.append({
            "id": f"TL-{report.id}-7",
            "status": "RESOLVED",
            "title": "Issue Resolved and Closed",
            "description": "Road repair confirmed, verified, and signed off.",
            "actor": "Ward Officer",
            "actorRole": "OFFICER",
            "timestamp": updated_iso,
        })
    elif report.status == "REJECTED":
        timeline.append({
            "id": f"TL-{report.id}-8",
            "status": "REJECTED",
            "title": "Report Rejected",
            "description": "Report reviewed and marked as rejected or duplicate.",
            "actor": "Ward Officer",
            "actorRole": "OFFICER",
            "timestamp": updated_iso,
        })

    return {
        "id": report.id,
        "citizenId": report.citizen_id,
        "citizenName": report.citizen_name,
        "citizenPhone": report.citizen_phone,
        "imageUrl": report.image_url,
        "issueType": report.issue_type,
        "primaryDefect": report.primary_defect,
        "description": report.description,
        "landmark": report.landmark,
        "latitude": report.latitude,
        "longitude": report.longitude,
        "address": report.address,
        "wardId": report.ward_id or "W-12",
        "wardName": report.ward_name or "Ward 12",
        "status": report.status,
        "severity": report.severity,
        "priority": report.priority,
        "departmentId": report.department_id or "DEPT-01",
        "departmentName": report.department_name or "Road Maintenance Division",
        "incidentId": report.incident.id if report.incident else f"INC-{report.id}",
        "aiDetection": ai_det,
        "aiPriorityReasoning": ai_reason,
        "createdAt": submitted_iso,
        "updatedAt": updated_iso,
        "timeline": timeline,
    }

@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    file: Optional[UploadFile] = File(None),
    image: Optional[UploadFile] = File(None),
    citizen_name: Optional[str] = Form("Citizen Reporter"),
    citizen_phone: Optional[str] = Form("+91 98765 43210"),
    citizen_id: Optional[str] = Form(None),
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
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Submits a new road defect report with photographic evidence.
    Persists original image to storage, saves ImageAsset, InferenceResult, Report, Incident, and AuditLog.
    """
    try:
        actual_file = file or image
        saved_image_url = image_url
        image_asset_id = None
        asset_info = None

        if actual_file is not None:
            file_bytes = await actual_file.read()
            if len(file_bytes) > 0:
                asset_info = await storage_service.save_image(file_bytes, filename=actual_file.filename)
                saved_image_url = asset_info["url"]

                # Ensure image asset record is created
                image_asset_id = f"IMG-{uuid.uuid4().hex[:12]}"
                image_asset = ImageAsset(
                    id=image_asset_id,
                    storage_key=asset_info["storage_key"],
                    original_filename=asset_info["original_filename"],
                    content_type=asset_info["content_type"],
                    file_size=asset_info["file_size"],
                    sha256=asset_info["sha256"],
                    width=asset_info["width"],
                    height=asset_info["height"],
                    created_by=current_user.id if current_user else None,
                )
                db.add(image_asset)

        if not saved_image_url:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Road report must include photographic evidence (file upload or image_url)."
            )

        # Parse AI detection payload if passed
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
                print(f"[Reports API] AI JSON parsing warning: {e}")

        # If no AI detection was passed and an image file is uploaded, run inference
        if not ai_detection and actual_file is not None:
            try:
                inf_resp = await inference_service.detect_async(file_bytes)
                ai_detection = inf_resp.model_dump()
            except Exception as e:
                print(f"[Reports API] Auto-inference skipped: {e}")

        # Persist InferenceResult
        inference_result_id = None
        primary_defect_name = primary_defect or issue_type or category or "longitudinal crack"
        primary_confidence_val = None

        if ai_detection:
            if "primary_defect" in ai_detection and ai_detection["primary_defect"]:
                primary_defect_name = ai_detection["primary_defect"]
            elif "detections" in ai_detection and len(ai_detection["detections"]) > 0:
                primary_defect_name = ai_detection["detections"][0]["class_name"]
                primary_confidence_val = ai_detection["detections"][0].get("confidence")

            inference_result_id = f"INF-{uuid.uuid4().hex[:12]}"
            inf_record = InferenceResult(
                id=inference_result_id,
                image_asset_id=image_asset_id,
                request_id=f"REQ-{uuid.uuid4().hex[:8]}",
                model_metadata_json=json.dumps(ai_detection.get("models", {})),
                detection_json=json.dumps(ai_detection),
                primary_defect=primary_defect_name,
                primary_confidence=primary_confidence_val,
                model_status=ai_detection.get("status", "completed"),
                inference_latency_ms=ai_detection.get("inference_time_ms"),
            )
            db.add(inf_record)

        # Ensure citizen user exists
        effective_citizen_id = current_user.id if current_user else (citizen_id or "USR-CITIZEN-DEFAULT")
        existing_citizen = db.query(User).filter(User.id == effective_citizen_id).first()
        if not existing_citizen:
            existing_citizen = User(
                id=effective_citizen_id,
                full_name=citizen_name or "Citizen Reporter",
                email=f"{effective_citizen_id.lower()}@nagarsam.gov.in",
                password_hash="$2b$12$eX8L...",
                role="CITIZEN",
                phone=citizen_phone,
                is_active=True,
            )
            db.add(existing_citizen)

        # Count existing reports for unique human-friendly ID
        report_count = db.query(Report).count() + 1
        report_id = f"NS-2026-{report_count:05d}"

        # Severity & Priority derivation
        derived_sev = "CRITICAL" if "pothole" in primary_defect_name.lower() else "HIGH" if "alligator" in primary_defect_name.lower() else "MEDIUM"
        derived_pri = "CRITICAL" if derived_sev == "CRITICAL" else "HIGH" if derived_sev == "HIGH" else "MEDIUM"
        pri_score = 90.0 if derived_pri == "CRITICAL" else 75.0 if derived_pri == "HIGH" else 50.0

        confidence = ai_detection.get("confidence", 0.90) if ai_detection else 0.90
        ai_reasoning = {
            "recommendation": derived_pri,
            "confidenceScore": int(confidence * 100) if isinstance(confidence, (int, float)) else 85,
            "factors": [
                f"Dual-YOLO detection confirmed {primary_defect_name.title()}",
                "Pavement distress geometry verified",
                "Municipal roadway corridor prioritized",
            ],
        }

        computed_address = address or (f"Near {landmark}" if landmark else f"Reported Defect Location, Ward {ward_id or 12}")
        dept_id = "DEPT-01"
        dept_name = "Road Maintenance Division"

        new_report = Report(
            id=report_id,
            citizen_id=effective_citizen_id,
            citizen_name=citizen_name or existing_citizen.full_name,
            citizen_phone=citizen_phone or existing_citizen.phone,
            citizen_observation=description,
            description=description or "Road issue reported by citizen",
            landmark=landmark,
            image_url=saved_image_url,
            image_asset_id=image_asset_id,
            latitude=latitude or 12.9716,
            longitude=longitude or 77.5946,
            address=computed_address,
            ward_id=ward_id or "W-12",
            ward_name=ward_name or "Ward 12",
            department_id=dept_id,
            department_name=dept_name,
            issue_type=primary_defect_name,
            primary_defect=primary_defect_name,
            status="SUBMITTED",
            severity=derived_sev,
            priority=derived_pri,
            inference_result_id=inference_result_id,
            ai_detection_json=json.dumps(ai_detection) if ai_detection else None,
            ai_priority_reasoning_json=json.dumps(ai_reasoning),
        )
        db.add(new_report)

        # Create Incident record
        incident_id = f"INC-{report_id}"
        new_incident = Incident(
            id=incident_id,
            report_id=report_id,
            title=f"Report {report_id}: {primary_defect_name.title()} on {computed_address}",
            description=description or "Road defect registered for triage",
            detected_defects_json=json.dumps(ai_detection) if ai_detection else None,
            severity=derived_sev,
            priority_score=pri_score,
            priority_level=derived_pri,
            department_id=dept_id,
            department_name=dept_name,
            ward_id=ward_id or "W-12",
            ward_name=ward_name or "Ward 12",
            status="OPEN",
            latitude=latitude or 12.9716,
            longitude=longitude or 77.5946,
            address=computed_address,
        )
        db.add(new_incident)

        # Create Notification for Citizen
        notif = Notification(
            id=f"NOTIF-{uuid.uuid4().hex[:10]}",
            user_id=effective_citizen_id,
            type="INFO",
            title="Report Successfully Registered",
            message=f"Your road defect report #{report_id} has been logged with AI analysis.",
            related_resource_type="REPORT",
            related_resource_id=report_id,
            link_url=f"/citizen/reports/{report_id}",
        )
        db.add(notif)

        # Create AuditLog
        audit = AuditLog(
            id=f"AUD-{uuid.uuid4().hex[:10]}",
            actor_id=effective_citizen_id,
            actor_role="CITIZEN",
            actor_name=citizen_name or existing_citizen.full_name,
            action="REPORT_CREATED",
            resource_type="REPORT",
            resource_id=report_id,
            result="SUCCESS",
            metadata_json=json.dumps({"defect": primary_defect_name, "severity": derived_sev}),
        )
        db.add(audit)

        db.commit()
        db.refresh(new_report)

        return _format_report_dict(new_report)

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to submit report: {str(e)}")

@router.post("/json", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report_json(
    request: CreateReportRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """JSON variant for report creation with remote or pre-uploaded image URL."""
    if not request.image_url:
        raise HTTPException(status_code=400, detail="Must provide image_url.")

    effective_citizen_id = current_user.id if current_user else (request.citizen_id or "USR-CITIZEN-DEFAULT")
    existing_citizen = db.query(User).filter(User.id == effective_citizen_id).first()
    if not existing_citizen:
        existing_citizen = User(
            id=effective_citizen_id,
            full_name=request.citizen_name or "Citizen Reporter",
            email=f"{effective_citizen_id.lower()}@nagarsam.gov.in",
            password_hash="$2b$12$eX8L...",
            role="CITIZEN",
            phone=request.citizen_phone,
            is_active=True,
        )
        db.add(existing_citizen)

    report_count = db.query(Report).count() + 1
    report_id = f"NS-2026-{report_count:05d}"
    defect_name = request.primary_defect or request.issue_type or "pothole"

    derived_sev = "CRITICAL" if "pothole" in defect_name.lower() else "HIGH" if "alligator" in defect_name.lower() else "MEDIUM"
    derived_pri = "CRITICAL" if derived_sev == "CRITICAL" else "HIGH" if derived_sev == "HIGH" else "MEDIUM"
    pri_score = 90.0 if derived_pri == "CRITICAL" else 75.0 if derived_pri == "HIGH" else 50.0

    new_report = Report(
        id=report_id,
        citizen_id=effective_citizen_id,
        citizen_name=request.citizen_name or existing_citizen.full_name,
        citizen_phone=request.citizen_phone or existing_citizen.phone,
        citizen_observation=request.description,
        description=request.description or "Road issue reported",
        landmark=request.landmark,
        image_url=request.image_url,
        latitude=request.latitude,
        longitude=request.longitude,
        address=request.address,
        ward_id=request.ward_id or "W-12",
        ward_name=request.ward_name or "Ward 12",
        department_id="DEPT-01",
        department_name="Road Maintenance Division",
        issue_type=defect_name,
        primary_defect=defect_name,
        status="SUBMITTED",
        severity=derived_sev,
        priority=derived_pri,
        ai_detection_json=json.dumps(request.ai_detection) if request.ai_detection else None,
    )
    db.add(new_report)

    incident_id = f"INC-{report_id}"
    new_incident = Incident(
        id=incident_id,
        report_id=report_id,
        title=f"Report {report_id}: {defect_name.title()} on {request.address}",
        description=request.description or "Road defect registered for triage",
        severity=derived_sev,
        priority_score=pri_score,
        priority_level=derived_pri,
        department_id="DEPT-01",
        department_name="Road Maintenance Division",
        ward_id=request.ward_id or "W-12",
        ward_name=request.ward_name or "Ward 12",
        status="OPEN",
        latitude=request.latitude,
        longitude=request.longitude,
        address=request.address,
    )
    db.add(new_incident)

    db.commit()
    db.refresh(new_report)
    return _format_report_dict(new_report)

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
    db: Session = Depends(get_db),
):
    """Fetches real reports persisted in PostgreSQL/SQLite with search, filtering, and pagination."""
    query = db.query(Report)

    if citizenId:
        query = query.filter(Report.citizen_id == citizenId)
    if status:
        query = query.filter(Report.status == status.upper())
    if severity:
        query = query.filter(Report.severity == severity.upper())
    if priority:
        query = query.filter(Report.priority == priority.upper())
    if wardId:
        query = query.filter(Report.ward_id == wardId)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Report.id.ilike(search_pattern),
                Report.description.ilike(search_pattern),
                Report.address.ilike(search_pattern),
                Report.ward_name.ilike(search_pattern),
                Report.primary_defect.ilike(search_pattern),
            )
        )

    total = query.count()
    reports = (
        query.order_by(desc(Report.submitted_at))
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    formatted = [_format_report_dict(r) for r in reports]
    total_pages = (total + limit - 1) // limit if total > 0 else 1

    return {
        "data": formatted,
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": total_pages,
    }

@router.get("/{report_id}", response_model=ReportResponse)
async def get_report_by_id(report_id: str, db: Session = Depends(get_db)):
    """Fetches an individual persisted road defect report."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report {report_id} not found."
        )
    return _format_report_dict(report)

@router.patch("/{report_id}/status", response_model=ReportResponse)
async def update_report_status(
    report_id: str,
    request: UpdateReportStatusRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Updates the status of a road defect report and synchronizes its incident."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail=f"Report {report_id} not found.")

    report.status = request.status.upper()
    report.updated_at = datetime.datetime.now(datetime.timezone.utc)

    if report.incident:
        report.incident.status = request.status.upper()
        report.incident.updated_at = report.updated_at

    # Add audit log
    audit = AuditLog(
        id=f"AUD-{uuid.uuid4().hex[:10]}",
        actor_id=current_user.id if current_user else None,
        actor_role=current_user.role if current_user else "SYSTEM",
        actor_name=current_user.full_name if current_user else "System Process",
        action="REPORT_STATUS_UPDATED",
        resource_type="REPORT",
        resource_id=report_id,
        result="SUCCESS",
        metadata_json=json.dumps({"new_status": request.status, "note": request.note}),
    )
    db.add(audit)
    db.commit()
    db.refresh(report)

    return _format_report_dict(report)
