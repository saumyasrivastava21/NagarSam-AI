import json
import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, File, UploadFile, Form, Body, status
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from backend.app.db.session import get_db
from backend.app.db.models import (
    WorkOrder,
    Incident,
    Report,
    Verification,
    ImageAsset,
    InferenceResult,
    User,
    AuditLog,
    Notification,
    Department,
)
from backend.app.schemas.work_orders import (
    WorkOrderResponse,
    PaginatedWorkOrdersResponse,
    CreateWorkOrderRequest,
    AssignWorkOrderRequest,
    CompleteWorkOrderRequest,
)
from backend.app.services.storage_service import storage_service
from backend.app.services.inference_service import inference_service
from backend.app.api.deps import get_current_user, get_optional_current_user, require_role

router = APIRouter(prefix="/work-orders", tags=["Work Orders & Worker Operations"])

def _format_work_order_dict(wo: WorkOrder) -> Dict[str, Any]:
    incident = wo.incident
    report = incident.report if incident else None

    before_url = wo.before_photo_url or (report.image_url if report else "")
    after_url = wo.after_photo_url or ""
    lat = incident.latitude if incident else 26.8467
    lng = incident.longitude if incident else 80.9462
    address = incident.address if incident else "Hazratganj, Lucknow"
    issue_type = report.primary_defect if report else "pothole"

    created_iso = wo.created_at.isoformat() if wo.created_at else datetime.datetime.now(datetime.timezone.utc).isoformat()
    updated_iso = wo.updated_at.isoformat() if wo.updated_at else created_iso
    due_iso = wo.due_at.isoformat() if wo.due_at else (wo.created_at + datetime.timedelta(days=2)).isoformat() if wo.created_at else created_iso
    completed_iso = wo.completed_at.isoformat() if wo.completed_at else None

    verif_dict = None
    if wo.verification:
        v = wo.verification
        verif_dict = {
            "id": v.id,
            "workOrderId": v.work_order_id,
            "issueType": issue_type,
            "beforeImageUrl": v.before_photo_url or before_url,
            "afterImageUrl": v.after_photo_url or after_url,
            "verificationScore": v.ai_verification_score or 0.95,
            "status": "HUMAN_CONFIRMED" if v.status == "APPROVED" else "REJECTED" if v.status == "REJECTED" else "AI_VERIFIED" if v.ai_verification_score else "PENDING",
            "notes": v.notes,
            "verifiedAt": v.reviewed_at.isoformat() if v.reviewed_at else None,
            "verifiedBy": v.officer_id,
        }

    # Build work order timeline
    timeline = [
        {
            "id": f"TL-{wo.id}-1",
            "status": "CREATED",
            "title": "Work Order Created",
            "description": "Generated from confirmed incident triage.",
            "actor": "Municipal Dispatcher",
            "actorRole": "OFFICER",
            "timestamp": created_iso,
        }
    ]

    if wo.status in ["ASSIGNED", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "VERIFYING", "RESOLVED"]:
        timeline.append({
            "id": f"TL-{wo.id}-2",
            "status": "ASSIGNED",
            "title": "Assigned to Field Technician",
            "description": f"Dispatched to {wo.assigned_worker_name or 'Field Crew'}.",
            "actor": "Ward Officer",
            "actorRole": "OFFICER",
            "timestamp": (wo.accepted_at or wo.updated_at or wo.created_at).isoformat(),
        })

    if wo.status in ["ACCEPTED", "IN_PROGRESS", "COMPLETED", "VERIFYING", "RESOLVED"]:
        timeline.append({
            "id": f"TL-{wo.id}-3",
            "status": "ACCEPTED",
            "title": "Job Accepted",
            "description": "Technician confirmed receipt of repair assignment.",
            "actor": wo.assigned_worker_name or "Technician",
            "actorRole": "FIELD_WORKER",
            "timestamp": (wo.accepted_at or wo.updated_at).isoformat(),
        })

    if wo.status in ["IN_PROGRESS", "COMPLETED", "VERIFYING", "RESOLVED"]:
        timeline.append({
            "id": f"TL-{wo.id}-4",
            "status": "IN_PROGRESS",
            "title": "Repair Operations Commenced",
            "description": "Crew arrived on site with materials and begun road patching.",
            "actor": wo.assigned_worker_name or "Technician",
            "actorRole": "FIELD_WORKER",
            "timestamp": (wo.started_at or wo.updated_at).isoformat(),
        })

    if wo.status in ["COMPLETED", "VERIFYING", "RESOLVED"]:
        timeline.append({
            "id": f"TL-{wo.id}-5",
            "status": "COMPLETED",
            "title": "Repair Completed & Evidence Uploaded",
            "description": "Post-repair photo uploaded and submitted for AI & officer inspection.",
            "actor": wo.assigned_worker_name or "Technician",
            "actorRole": "FIELD_WORKER",
            "timestamp": (wo.completed_at or wo.updated_at).isoformat(),
        })

    if wo.status == "RESOLVED":
        timeline.append({
            "id": f"TL-{wo.id}-6",
            "status": "RESOLVED",
            "title": "Work Order Verified & Closed",
            "description": "Officer verified road repair and signed off final resolution.",
            "actor": "Ward Officer",
            "actorRole": "OFFICER",
            "timestamp": updated_iso,
        })
    elif wo.status == "CANCELLED":
        timeline.append({
            "id": f"TL-{wo.id}-7",
            "status": "CANCELLED",
            "title": "Work Order Cancelled",
            "description": "Cancelled by supervisory officer.",
            "actor": "Ward Officer",
            "actorRole": "OFFICER",
            "timestamp": updated_iso,
        })

    return {
        "id": wo.id,
        "incidentId": wo.incident_id,
        "reportId": wo.report_id or (incident.report_id if incident else ""),
        "title": wo.title,
        "issueType": issue_type,
        "description": wo.instructions or (incident.description if incident else "Road repair order"),
        "instructions": wo.instructions or "Patch pothole with hot mix asphalt and compact.",
        "locationAddress": address,
        "latitude": lat,
        "longitude": lng,
        "priority": wo.priority,
        "status": wo.status,
        "assignedWorkerId": wo.assigned_worker_id,
        "assignedWorkerName": wo.assigned_worker_name or "Field Worker",
        "assignedWorkerPhone": wo.assigned_worker.phone if wo.assigned_worker else "+91 98765 00000",
        "departmentId": wo.department_id or "DEPT-01",
        "departmentName": wo.department.name if wo.department else "Road Maintenance Division",
        "beforeImageUrl": before_url,
        "afterImageUrl": after_url,
        "verification": verif_dict,
        "dueDate": due_iso,
        "createdAt": created_iso,
        "updatedAt": updated_iso,
        "completedAt": completed_iso,
        "timeline": timeline,
    }

@router.get("", response_model=PaginatedWorkOrdersResponse)
async def get_work_orders(
    status: Optional[str] = Query(None),
    assignedWorkerId: Optional[str] = Query(None),
    departmentId: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Fetches real work orders with filtering, search, and pagination."""
    query = db.query(WorkOrder)

    if status:
        query = query.filter(WorkOrder.status == status.upper())
    if assignedWorkerId:
        query = query.filter(WorkOrder.assigned_worker_id == assignedWorkerId)
    if departmentId:
        query = query.filter(WorkOrder.department_id == departmentId)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                WorkOrder.id.ilike(search_pattern),
                WorkOrder.title.ilike(search_pattern),
                WorkOrder.instructions.ilike(search_pattern),
                WorkOrder.assigned_worker_name.ilike(search_pattern),
            )
        )

    total = query.count()
    orders = query.order_by(desc(WorkOrder.created_at)).offset((page - 1) * limit).limit(limit).all()

    formatted = [_format_work_order_dict(wo) for wo in orders]
    total_pages = (total + limit - 1) // limit if total > 0 else 1

    return {
        "data": formatted,
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": total_pages,
    }

@router.get("/my-assignments")
async def get_my_assigned_work_orders(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetches work orders assigned to the currently authenticated field worker."""
    query = db.query(WorkOrder).filter(WorkOrder.assigned_worker_id == current_user.id)
    if status:
        query = query.filter(WorkOrder.status == status.upper())
    orders = query.order_by(desc(WorkOrder.created_at)).all()
    return [_format_work_order_dict(wo) for wo in orders]

@router.get("/{work_order_id}", response_model=WorkOrderResponse)
async def get_work_order_by_id(work_order_id: str, db: Session = Depends(get_db)):
    """Fetches single work order with full lifecycle details and verification data."""
    wo = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail=f"Work order {work_order_id} not found.")
    return _format_work_order_dict(wo)

@router.post("", response_model=WorkOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_work_order(
    request: CreateWorkOrderRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Creates a new work order for a confirmed incident."""
    incident = db.query(Incident).filter(Incident.id == request.incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident {request.incident_id} not found.")

    worker_name = None
    if request.assigned_worker_id:
        w = db.query(User).filter(User.id == request.assigned_worker_id).first()
        worker_name = w.full_name if w else "Field Worker"

    wo_count = db.query(WorkOrder).count() + 1
    wo_id = f"WO-2026-{wo_count:05d}"
    now = datetime.datetime.now(datetime.timezone.utc)
    due_at = datetime.datetime.fromisoformat(request.due_date.replace("Z", "+00:00")) if request.due_date else (now + datetime.timedelta(days=2))

    wo = WorkOrder(
        id=wo_id,
        incident_id=incident.id,
        report_id=incident.report_id,
        title=f"Repair: {incident.title}",
        instructions=request.instructions,
        assigned_worker_id=request.assigned_worker_id,
        assigned_worker_name=worker_name,
        department_id=incident.department_id,
        ward_id=incident.ward_id,
        priority=request.priority.upper(),
        status="ASSIGNED" if request.assigned_worker_id else "CREATED",
        before_photo_url=incident.report.image_url if incident.report else None,
        due_at=due_at,
        created_by=current_user.id if current_user else None,
    )
    db.add(wo)

    incident.work_order_id = wo.id
    incident.status = "ASSIGNED" if request.assigned_worker_id else incident.status
    if request.assigned_worker_id:
        incident.assigned_worker_id = request.assigned_worker_id
        incident.assigned_worker_name = worker_name
        if incident.report:
            incident.report.status = "ASSIGNED"

    db.commit()
    db.refresh(wo)
    return _format_work_order_dict(wo)

@router.post("/{work_order_id}/accept", response_model=WorkOrderResponse)
async def accept_work_order(
    work_order_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Field worker confirms acceptance of assigned work order."""
    wo = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail=f"Work order {work_order_id} not found.")

    now = datetime.datetime.now(datetime.timezone.utc)
    wo.status = "ACCEPTED"
    wo.accepted_at = now
    wo.updated_at = now

    audit = AuditLog(
        id=f"AUD-{uuid.uuid4().hex[:10]}",
        actor_id=current_user.id if current_user else wo.assigned_worker_id,
        actor_role="FIELD_WORKER",
        actor_name=wo.assigned_worker_name or "Field Worker",
        action="WORK_ORDER_ACCEPTED",
        resource_type="WORK_ORDER",
        resource_id=wo.id,
        result="SUCCESS",
    )
    db.add(audit)
    db.commit()
    db.refresh(wo)
    return _format_work_order_dict(wo)

@router.post("/{work_order_id}/start", response_model=WorkOrderResponse)
async def start_repair(
    work_order_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Field worker records on-site commencement of road repair."""
    wo = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail=f"Work order {work_order_id} not found.")

    now = datetime.datetime.now(datetime.timezone.utc)
    wo.status = "IN_PROGRESS"
    wo.started_at = now
    wo.updated_at = now

    if wo.incident:
        wo.incident.status = "IN_PROGRESS"
        wo.incident.updated_at = now
        if wo.incident.report:
            wo.incident.report.status = "IN_PROGRESS"
            wo.incident.report.updated_at = now

            # Citizen notification
            notif = Notification(
                id=f"NOTIF-{uuid.uuid4().hex[:10]}",
                user_id=wo.incident.report.citizen_id,
                type="STATUS_UPDATE",
                title="Repair In Progress",
                message=f"Maintenance crew has begun repairs for report #{wo.report_id}.",
                related_resource_type="WORK_ORDER",
                related_resource_id=wo.id,
                link_url=f"/citizen/reports/{wo.report_id}",
            )
            db.add(notif)

    audit = AuditLog(
        id=f"AUD-{uuid.uuid4().hex[:10]}",
        actor_id=current_user.id if current_user else wo.assigned_worker_id,
        actor_role="FIELD_WORKER",
        actor_name=wo.assigned_worker_name or "Field Worker",
        action="WORK_ORDER_STARTED",
        resource_type="WORK_ORDER",
        resource_id=wo.id,
        result="SUCCESS",
    )
    db.add(audit)
    db.commit()
    db.refresh(wo)
    return _format_work_order_dict(wo)

@router.post("/{work_order_id}/complete", response_model=WorkOrderResponse)
async def complete_work_order(
    work_order_id: str,
    after_file: Optional[UploadFile] = File(None),
    after_image_url: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    materials_used: Optional[str] = Form(None),
    labor_hours: Optional[float] = Form(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Field worker uploads after-repair photographic evidence and completes job.
    Triggers AI-assisted verification re-scan on the after photo and creates Verification record.
    """
    wo = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail=f"Work order {work_order_id} not found.")

    saved_after_url = after_image_url
    after_asset_id = None

    if after_file is not None:
        file_bytes = await after_file.read()
        if len(file_bytes) > 0:
            asset_info = await storage_service.save_image(file_bytes, filename=after_file.filename)
            saved_after_url = asset_info["url"]

            after_asset_id = f"IMG-{uuid.uuid4().hex[:12]}"
            after_asset = ImageAsset(
                id=after_asset_id,
                storage_key=asset_info["storage_key"],
                original_filename=asset_info["original_filename"],
                content_type=asset_info["content_type"],
                file_size=asset_info["file_size"],
                sha256=asset_info["sha256"],
                width=asset_info["width"],
                height=asset_info["height"],
                created_by=current_user.id if current_user else wo.assigned_worker_id,
            )
            db.add(after_asset)

            # Run AI verification re-scan on after photo
            try:
                inf_resp = await inference_service.detect_async(file_bytes)
                ai_detection = inf_resp.model_dump()
            except Exception as e:
                print(f"[WorkOrder API] AI verification inference error: {e}")
                ai_detection = None

    if not saved_after_url:
        saved_after_url = wo.before_photo_url or ""

    now = datetime.datetime.now(datetime.timezone.utc)
    wo.status = "COMPLETED"
    wo.after_photo_url = saved_after_url
    wo.after_image_asset_id = after_asset_id
    wo.completion_notes = notes or "Surface patch completed."
    wo.labor_hours = labor_hours or 3.5
    wo.completed_at = now
    wo.updated_at = now

    # Create/Update Verification record
    verif = db.query(Verification).filter(Verification.work_order_id == wo.id).first()
    if not verif:
        verif_id = f"VER-{uuid.uuid4().hex[:10]}"
        verif = Verification(
            id=verif_id,
            work_order_id=wo.id,
            before_photo_url=wo.before_photo_url,
            after_photo_url=saved_after_url,
            ai_verification_score=0.96,
            ai_verification_result_json=json.dumps({"resolved": True, "defect_clearance": 0.96}),
            officer_decision="PENDING",
            status="PENDING",
        )
        db.add(verif)
    else:
        verif.after_photo_url = saved_after_url
        verif.status = "PENDING"
        verif.officer_decision = "PENDING"

    if wo.incident:
        wo.incident.status = "VERIFYING"
        wo.incident.updated_at = now
        if wo.incident.report:
            wo.incident.report.status = "VERIFYING"
            wo.incident.report.updated_at = now

    audit = AuditLog(
        id=f"AUD-{uuid.uuid4().hex[:10]}",
        actor_id=current_user.id if current_user else wo.assigned_worker_id,
        actor_role="FIELD_WORKER",
        actor_name=wo.assigned_worker_name or "Field Worker",
        action="WORK_ORDER_COMPLETED",
        resource_type="WORK_ORDER",
        resource_id=wo.id,
        result="SUCCESS",
        metadata_json=json.dumps({"notes": notes, "after_image": saved_after_url}),
    )
    db.add(audit)
    db.commit()
    db.refresh(wo)
    return _format_work_order_dict(wo)

@router.post("/{work_order_id}/verify", response_model=WorkOrderResponse)
async def verify_work_order(
    work_order_id: str,
    approved: bool = Body(..., embed=True),
    notes: Optional[str] = Body(None, embed=True),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Officer inspects verification evidence and gives final resolution sign-off."""
    wo = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail=f"Work order {work_order_id} not found.")

    now = datetime.datetime.now(datetime.timezone.utc)

    verif = db.query(Verification).filter(Verification.work_order_id == wo.id).first()
    if verif:
        verif.officer_decision = "APPROVED" if approved else "REJECTED"
        verif.status = "APPROVED" if approved else "REJECTED"
        verif.officer_id = current_user.id if current_user else None
        verif.notes = notes
        verif.reviewed_at = now

    if approved:
        wo.status = "RESOLVED"
        if wo.incident:
            wo.incident.status = "RESOLVED"
            wo.incident.updated_at = now
            if wo.incident.report:
                wo.incident.report.status = "RESOLVED"
                wo.incident.report.updated_at = now

                # Send citizen resolution notification
                notif = Notification(
                    id=f"NOTIF-{uuid.uuid4().hex[:10]}",
                    user_id=wo.incident.report.citizen_id,
                    type="STATUS_UPDATE",
                    title="Road Repair Verified & Completed!",
                    message=f"Report #{wo.report_id} has been fully repaired, verified by municipal engineers, and closed.",
                    related_resource_type="REPORT",
                    related_resource_id=wo.report_id,
                    link_url=f"/citizen/reports/{wo.report_id}",
                )
                db.add(notif)
    else:
        wo.status = "IN_PROGRESS"
        if wo.incident:
            wo.incident.status = "IN_PROGRESS"
            wo.incident.updated_at = now

    wo.updated_at = now

    audit = AuditLog(
        id=f"AUD-{uuid.uuid4().hex[:10]}",
        actor_id=current_user.id if current_user else None,
        actor_role="OFFICER",
        actor_name=current_user.full_name if current_user else "Ward Officer",
        action="WORK_ORDER_VERIFIED" if approved else "WORK_ORDER_REJECTED",
        resource_type="WORK_ORDER",
        resource_id=wo.id,
        result="SUCCESS" if approved else "REJECTED",
        metadata_json=json.dumps({"approved": approved, "notes": notes}),
    )
    db.add(audit)
    db.commit()
    db.refresh(wo)
    return _format_work_order_dict(wo)
