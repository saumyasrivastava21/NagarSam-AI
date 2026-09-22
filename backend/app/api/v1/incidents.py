import json
import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from backend.app.db.session import get_db
from backend.app.db.models import (
    Incident,
    Report,
    WorkOrder,
    User,
    AuditLog,
    Notification,
    Department,
    Ward,
)
from backend.app.schemas.incidents import (
    IncidentResponse,
    PaginatedIncidentsResponse,
    IncidentConfirmRequest,
    IncidentRejectRequest,
    IncidentPriorityUpdateRequest,
    IncidentDepartmentAssignRequest,
    IncidentAssignWorkerRequest,
)
from backend.app.api.deps import get_current_user, get_optional_current_user, require_role

router = APIRouter(prefix="/incidents", tags=["Incidents & Triage"])

def _format_incident_dict(incident: Incident) -> Dict[str, Any]:
    """Formats SQLAlchemy Incident model into API response contract."""
    ai_det = None
    ai_factors = []
    if incident.report and incident.report.ai_detection_json:
        try:
            ai_det = json.loads(incident.report.ai_detection_json)
        except Exception:
            pass

    if incident.report and incident.report.ai_priority_reasoning_json:
        try:
            reasoning = json.loads(incident.report.ai_priority_reasoning_json)
            ai_factors = reasoning.get("factors", [])
        except Exception:
            pass

    if not ai_factors:
        ai_factors = [
            f"Defect classified as {incident.report.primary_defect if incident.report else 'Road Defect'}",
            f"Municipal roadway safety priority ({incident.priority_level})",
            f"Ward corridor density analysis applied",
        ]

    created_iso = incident.created_at.isoformat() if incident.created_at else datetime.datetime.now(datetime.timezone.utc).isoformat()
    updated_iso = incident.updated_at.isoformat() if incident.updated_at else created_iso

    image_url = incident.report.image_url if incident.report else ""
    primary_defect = incident.report.primary_defect if incident.report else "pothole"
    issue_type = incident.report.issue_type if incident.report else primary_defect

    timeline = [
        {
            "id": f"TL-{incident.id}-1",
            "status": "OPEN",
            "title": "Incident Logged",
            "description": f"Incident registered from report {incident.report_id}",
            "actor": incident.report.citizen_name if incident.report else "Citizen",
            "actorRole": "CITIZEN",
            "timestamp": created_iso,
        }
    ]

    if incident.status in ["CONFIRMED", "ASSIGNED", "IN_PROGRESS", "VERIFYING", "RESOLVED"]:
        timeline.append({
            "id": f"TL-{incident.id}-2",
            "status": "CONFIRMED",
            "title": "Incident Confirmed by Officer",
            "description": "Reviewed and validated for municipal repair queue.",
            "actor": incident.assigned_officer.full_name if incident.assigned_officer else "Ward Officer",
            "actorRole": "OFFICER",
            "timestamp": updated_iso,
        })

    if incident.status in ["ASSIGNED", "IN_PROGRESS", "VERIFYING", "RESOLVED"]:
        timeline.append({
            "id": f"TL-{incident.id}-3",
            "status": "ASSIGNED",
            "title": "Work Order Assigned",
            "description": f"Dispatched to field technician {incident.assigned_worker_name or ''}.",
            "actor": "Municipal Dispatcher",
            "actorRole": "OFFICER",
            "timestamp": updated_iso,
        })

    if incident.status in ["IN_PROGRESS", "VERIFYING", "RESOLVED"]:
        timeline.append({
            "id": f"TL-{incident.id}-4",
            "status": "IN_PROGRESS",
            "title": "Repair in Progress",
            "description": "Field worker on site executing road repair.",
            "actor": incident.assigned_worker_name or "Field Worker",
            "actorRole": "FIELD_WORKER",
            "timestamp": updated_iso,
        })

    if incident.status in ["VERIFYING", "RESOLVED"]:
        timeline.append({
            "id": f"TL-{incident.id}-5",
            "status": "VERIFYING",
            "title": "Verification Inspection",
            "description": "After-repair photo analyzed by YOLO AI and pending officer sign-off.",
            "actor": "AI Verification Engine",
            "actorRole": "ADMIN",
            "timestamp": updated_iso,
        })

    if incident.status == "RESOLVED":
        timeline.append({
            "id": f"TL-{incident.id}-6",
            "status": "RESOLVED",
            "title": "Incident Resolved",
            "description": "Officer verified repair completion and closed incident.",
            "actor": "Ward Officer",
            "actorRole": "OFFICER",
            "timestamp": updated_iso,
        })
    elif incident.status == "REJECTED":
        timeline.append({
            "id": f"TL-{incident.id}-7",
            "status": "REJECTED",
            "title": "Incident Rejected",
            "description": incident.rejection_reason or "Incident rejected by triage officer.",
            "actor": incident.assigned_officer.full_name if incident.assigned_officer else "Ward Officer",
            "actorRole": "OFFICER",
            "timestamp": updated_iso,
        })

    return {
        "id": incident.id,
        "reportId": incident.report_id,
        "title": incident.title,
        "issueType": issue_type,
        "primaryDefect": primary_defect,
        "description": incident.description,
        "imageUrl": image_url,
        "latitude": incident.latitude,
        "longitude": incident.longitude,
        "address": incident.address,
        "wardId": incident.ward_id or "WARD-01",
        "wardName": incident.ward_name or "Ward 1",
        "departmentId": incident.department_id or "DEPT-01",
        "departmentName": incident.department_name or "Road Maintenance Division",
        "status": incident.status,
        "severity": incident.severity,
        "priority": incident.priority_level,
        "priorityScore": incident.priority_score,
        "aiDetection": ai_det,
        "aiFactors": ai_factors,
        "assignedOfficerId": incident.assigned_officer_id,
        "assignedWorkerId": incident.assigned_worker_id,
        "assignedWorkerName": incident.assigned_worker_name,
        "workOrderId": incident.work_order_id,
        "rejectionReason": incident.rejection_reason,
        "createdAt": created_iso,
        "updatedAt": updated_iso,
        "timeline": timeline,
    }

@router.get("", response_model=PaginatedIncidentsResponse)
async def get_incidents(
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    wardId: Optional[str] = Query(None),
    departmentId: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sortByPriority: Optional[bool] = Query(False),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Fetches real incidents with filtering, search, and pagination."""
    query = db.query(Incident)

    if status:
        query = query.filter(Incident.status == status.upper())
    if severity:
        query = query.filter(Incident.severity == severity.upper())
    if priority:
        query = query.filter(Incident.priority_level == priority.upper())
    if wardId:
        query = query.filter(Incident.ward_id == wardId)
    if departmentId:
        query = query.filter(Incident.department_id == departmentId)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Incident.id.ilike(search_pattern),
                Incident.title.ilike(search_pattern),
                Incident.description.ilike(search_pattern),
                Incident.address.ilike(search_pattern),
                Incident.ward_name.ilike(search_pattern),
            )
        )

    total = query.count()

    if sortByPriority:
        query = query.order_by(desc(Incident.priority_score), desc(Incident.created_at))
    else:
        query = query.order_by(desc(Incident.created_at))

    incidents = query.offset((page - 1) * limit).limit(limit).all()
    formatted = [_format_incident_dict(inc) for inc in incidents]
    total_pages = (total + limit - 1) // limit if total > 0 else 1

    return {
        "data": formatted,
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": total_pages,
    }

@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident_by_id(incident_id: str, db: Session = Depends(get_db)):
    """Fetches full details for a single incident."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found.")
    return _format_incident_dict(incident)

@router.post("/{incident_id}/confirm", response_model=IncidentResponse)
async def confirm_incident(
    incident_id: str,
    request: Optional[IncidentConfirmRequest] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Officer confirms incident validity and moves it to CONFIRMED state."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found.")

    incident.status = "CONFIRMED"
    incident.assigned_officer_id = current_user.id if current_user else incident.assigned_officer_id
    incident.updated_at = datetime.datetime.now(datetime.timezone.utc)

    if incident.report:
        incident.report.status = "CONFIRMED"
        incident.report.updated_at = incident.updated_at

        # Send notification to citizen
        notif = Notification(
            id=f"NOTIF-{uuid.uuid4().hex[:10]}",
            user_id=incident.report.citizen_id,
            type="STATUS_UPDATE",
            title="Incident Confirmed for Repair",
            message=f"Your report #{incident.report_id} has been confirmed by municipal officers.",
            related_resource_type="INCIDENT",
            related_resource_id=incident.id,
            link_url=f"/citizen/reports/{incident.report_id}",
        )
        db.add(notif)

    # Log audit
    audit = AuditLog(
        id=f"AUD-{uuid.uuid4().hex[:10]}",
        actor_id=current_user.id if current_user else None,
        actor_role=current_user.role if current_user else "OFFICER",
        actor_name=current_user.full_name if current_user else "Ward Officer",
        action="INCIDENT_CONFIRMED",
        resource_type="INCIDENT",
        resource_id=incident.id,
        result="SUCCESS",
        metadata_json=json.dumps({"note": request.note if request else None}),
    )
    db.add(audit)
    db.commit()
    db.refresh(incident)

    return _format_incident_dict(incident)

@router.post("/{incident_id}/reject", response_model=IncidentResponse)
async def reject_incident(
    incident_id: str,
    request: IncidentRejectRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Officer rejects incident with a mandatory explanation reason."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found.")

    incident.status = "REJECTED"
    incident.rejection_reason = request.reason
    incident.assigned_officer_id = current_user.id if current_user else incident.assigned_officer_id
    incident.updated_at = datetime.datetime.now(datetime.timezone.utc)

    if incident.report:
        incident.report.status = "REJECTED"
        incident.report.updated_at = incident.updated_at

        # Send notification to citizen
        notif = Notification(
            id=f"NOTIF-{uuid.uuid4().hex[:10]}",
            user_id=incident.report.citizen_id,
            type="ALERT",
            title="Report Status Update: Rejected",
            message=f"Report #{incident.report_id} was reviewed: {request.reason}",
            related_resource_type="INCIDENT",
            related_resource_id=incident.id,
            link_url=f"/citizen/reports/{incident.report_id}",
        )
        db.add(notif)

    # Log audit
    audit = AuditLog(
        id=f"AUD-{uuid.uuid4().hex[:10]}",
        actor_id=current_user.id if current_user else None,
        actor_role=current_user.role if current_user else "OFFICER",
        actor_name=current_user.full_name if current_user else "Ward Officer",
        action="INCIDENT_REJECTED",
        resource_type="INCIDENT",
        resource_id=incident.id,
        result="SUCCESS",
        metadata_json=json.dumps({"reason": request.reason}),
    )
    db.add(audit)
    db.commit()
    db.refresh(incident)

    return _format_incident_dict(incident)

@router.patch("/{incident_id}/priority", response_model=IncidentResponse)
async def update_incident_priority(
    incident_id: str,
    request: IncidentPriorityUpdateRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Updates incident priority level and score."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found.")

    pri_upper = request.priority.upper()
    incident.priority_level = pri_upper
    incident.priority_score = 90.0 if pri_upper == "CRITICAL" else 75.0 if pri_upper == "HIGH" else 50.0 if pri_upper == "MEDIUM" else 25.0
    incident.updated_at = datetime.datetime.now(datetime.timezone.utc)

    if incident.report:
        incident.report.priority = pri_upper
        incident.report.updated_at = incident.updated_at

    audit = AuditLog(
        id=f"AUD-{uuid.uuid4().hex[:10]}",
        actor_id=current_user.id if current_user else None,
        actor_role=current_user.role if current_user else "OFFICER",
        actor_name=current_user.full_name if current_user else "Ward Officer",
        action="INCIDENT_PRIORITY_UPDATED",
        resource_type="INCIDENT",
        resource_id=incident.id,
        result="SUCCESS",
        metadata_json=json.dumps({"priority": pri_upper, "note": request.note}),
    )
    db.add(audit)
    db.commit()
    db.refresh(incident)

    return _format_incident_dict(incident)

@router.patch("/{incident_id}/department", response_model=IncidentResponse)
async def assign_incident_department(
    incident_id: str,
    request: IncidentDepartmentAssignRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Reassigns incident to a different municipal department."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found.")

    dept = db.query(Department).filter(Department.id == request.department_id).first()
    dept_name = dept.name if dept else "Road Maintenance Division"

    incident.department_id = request.department_id
    incident.department_name = dept_name
    incident.updated_at = datetime.datetime.now(datetime.timezone.utc)

    if incident.report:
        incident.report.department_id = request.department_id
        incident.report.department_name = dept_name
        incident.report.updated_at = incident.updated_at

    audit = AuditLog(
        id=f"AUD-{uuid.uuid4().hex[:10]}",
        actor_id=current_user.id if current_user else None,
        actor_role=current_user.role if current_user else "OFFICER",
        actor_name=current_user.full_name if current_user else "Ward Officer",
        action="INCIDENT_DEPARTMENT_REASSIGNED",
        resource_type="INCIDENT",
        resource_id=incident.id,
        result="SUCCESS",
        metadata_json=json.dumps({"department_id": request.department_id, "note": request.note}),
    )
    db.add(audit)
    db.commit()
    db.refresh(incident)

    return _format_incident_dict(incident)

@router.post("/{incident_id}/assign", response_model=IncidentResponse)
async def assign_incident_to_worker(
    incident_id: str,
    request: IncidentAssignWorkerRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Assigns incident to a field worker and creates/updates corresponding Work Order."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found.")

    worker = db.query(User).filter(User.id == request.worker_id).first()
    worker_name = worker.full_name if worker else "Field Worker Ramesh"

    now = datetime.datetime.now(datetime.timezone.utc)
    due_date = now + datetime.timedelta(hours=request.due_in_hours or 48)

    # Check if a work order already exists for this incident
    work_order = db.query(WorkOrder).filter(WorkOrder.incident_id == incident.id).first()
    if not work_order:
        wo_count = db.query(WorkOrder).count() + 1
        wo_id = f"WO-2026-{wo_count:05d}"
        work_order = WorkOrder(
            id=wo_id,
            incident_id=incident.id,
            report_id=incident.report_id,
            title=f"Repair: {incident.title}",
            instructions=request.instructions or "Execute surface repair using hot-mix asphalt and compaction.",
            assigned_worker_id=request.worker_id,
            assigned_worker_name=worker_name,
            department_id=incident.department_id,
            ward_id=incident.ward_id,
            priority=incident.priority_level,
            status="ASSIGNED",
            before_photo_url=incident.report.image_url if incident.report else None,
            due_at=due_date,
            created_by=current_user.id if current_user else None,
        )
        db.add(work_order)
    else:
        work_order.assigned_worker_id = request.worker_id
        work_order.assigned_worker_name = worker_name
        work_order.instructions = request.instructions or work_order.instructions
        work_order.status = "ASSIGNED"
        work_order.due_at = due_date
        work_order.updated_at = now

    incident.status = "ASSIGNED"
    incident.assigned_worker_id = request.worker_id
    incident.assigned_worker_name = worker_name
    incident.work_order_id = work_order.id
    incident.updated_at = now

    if incident.report:
        incident.report.status = "ASSIGNED"
        incident.report.updated_at = now

        # Send notification to Citizen
        notif_citizen = Notification(
            id=f"NOTIF-{uuid.uuid4().hex[:10]}",
            user_id=incident.report.citizen_id,
            type="ASSIGNMENT",
            title="Work Order Dispatched",
            message=f"Field technician {worker_name} has been assigned to repair report #{incident.report_id}.",
            related_resource_type="WORK_ORDER",
            related_resource_id=work_order.id,
            link_url=f"/citizen/reports/{incident.report_id}",
        )
        db.add(notif_citizen)

    # Send notification to Worker
    notif_worker = Notification(
        id=f"NOTIF-{uuid.uuid4().hex[:10]}",
        user_id=request.worker_id,
        type="ASSIGNMENT",
        title="New Repair Job Assigned",
        message=f"You have been assigned job #{work_order.id} on {incident.address}.",
        related_resource_type="WORK_ORDER",
        related_resource_id=work_order.id,
        link_url=f"/worker/jobs/{work_order.id}",
    )
    db.add(notif_worker)

    # Log audit
    audit = AuditLog(
        id=f"AUD-{uuid.uuid4().hex[:10]}",
        actor_id=current_user.id if current_user else None,
        actor_role=current_user.role if current_user else "OFFICER",
        actor_name=current_user.full_name if current_user else "Ward Officer",
        action="WORK_ORDER_ASSIGNED",
        resource_type="INCIDENT",
        resource_id=incident.id,
        result="SUCCESS",
        metadata_json=json.dumps({"worker_id": request.worker_id, "work_order_id": work_order.id}),
    )
    db.add(audit)
    db.commit()
    db.refresh(incident)

    return _format_incident_dict(incident)
