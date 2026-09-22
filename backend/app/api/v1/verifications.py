from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import json
from pydantic import BaseModel

from backend.app.db.session import get_db
from backend.app.db.models import (
    Verification, WorkOrder, Incident, Report, Notification, AuditLog, User, UserRole, ImageAsset
)
from backend.app.api.deps import get_current_user, require_roles
from backend.app.schemas.verifications import VerificationResponse

router = APIRouter()

class VerificationReviewRequest(BaseModel):
    decision: str  # "APPROVE" or "REJECT"
    notes: Optional[str] = None

@router.get("/verifications")
def list_verifications(
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.OFFICER, UserRole.ADMIN, UserRole.FIELD_WORKER))
):
    query = db.query(Verification)
    if status:
        query = query.filter(Verification.status == status)
    
    total = query.count()
    items = query.order_by(Verification.created_at.desc()).offset(offset).limit(limit).all()
    
    result = []
    for v in items:
        wo = db.query(WorkOrder).filter(WorkOrder.id == v.work_order_id).first()
        inc = db.query(Incident).filter(Incident.id == wo.incident_id).first() if wo else None
        
        before_img = db.query(ImageAsset).filter(ImageAsset.id == v.before_image_asset_id).first() if v.before_image_asset_id else None
        after_img = db.query(ImageAsset).filter(ImageAsset.id == v.after_image_asset_id).first() if v.after_image_asset_id else None
        
        result.append({
            "id": v.id,
            "workOrderId": v.work_order_id,
            "issueType": inc.detected_defects[0].get("class_name", "ROAD_DEFECT") if inc and inc.detected_defects else "ROAD_DEFECT",
            "beforeImageUrl": f"/api/v1/storage/{before_img.storage_key}" if before_img else "",
            "afterImageUrl": f"/api/v1/storage/{after_img.storage_key}" if after_img else "",
            "verificationScore": 0.95 if v.status in ["APPROVED", "RESOLVED"] else (0.85 if v.status == "PENDING" else 0.4),
            "status": v.status,
            "officerDecision": v.officer_decision,
            "notes": v.notes,
            "verifiedAt": v.reviewed_at.isoformat() if v.reviewed_at else None,
            "verifiedBy": v.officer_id,
            "createdAt": v.created_at.isoformat() if v.created_at else None
        })
    
    return {"data": result, "total": total}

@router.get("/verifications/{verification_id}")
def get_verification(
    verification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    v = db.query(Verification).filter(Verification.id == verification_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Verification record not found")
        
    wo = db.query(WorkOrder).filter(WorkOrder.id == v.work_order_id).first()
    inc = db.query(Incident).filter(Incident.id == wo.incident_id).first() if wo else None
    
    before_img = db.query(ImageAsset).filter(ImageAsset.id == v.before_image_asset_id).first() if v.before_image_asset_id else None
    after_img = db.query(ImageAsset).filter(ImageAsset.id == v.after_image_asset_id).first() if v.after_image_asset_id else None
    
    return {
        "id": v.id,
        "workOrderId": v.work_order_id,
        "issueType": inc.detected_defects[0].get("class_name", "ROAD_DEFECT") if inc and inc.detected_defects else "ROAD_DEFECT",
        "beforeImageUrl": f"/api/v1/storage/{before_img.storage_key}" if before_img else "",
        "afterImageUrl": f"/api/v1/storage/{after_img.storage_key}" if after_img else "",
        "verificationScore": 0.95 if v.status in ["APPROVED", "RESOLVED"] else 0.85,
        "status": v.status,
        "officerDecision": v.officer_decision,
        "notes": v.notes,
        "aiVerificationResult": v.ai_verification_result,
        "verifiedAt": v.reviewed_at.isoformat() if v.reviewed_at else None,
        "verifiedBy": v.officer_id,
        "createdAt": v.created_at.isoformat() if v.created_at else None
    }

@router.post("/verifications/{verification_id}/review")
def review_verification(
    verification_id: str,
    body: VerificationReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.OFFICER, UserRole.ADMIN))
):
    v = db.query(Verification).filter(Verification.id == verification_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Verification record not found")
        
    wo = db.query(WorkOrder).filter(WorkOrder.id == v.work_order_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Associated Work Order not found")
        
    inc = db.query(Incident).filter(Incident.id == wo.incident_id).first()
    rep = db.query(Report).filter(Report.id == inc.report_id).first() if inc else None
    
    decision = body.decision.upper()
    now = datetime.utcnow()
    
    if decision == "APPROVE":
        v.status = "APPROVED"
        v.officer_decision = "APPROVE"
        v.officer_id = current_user.id
        v.notes = body.notes
        v.reviewed_at = now
        
        wo.status = "RESOLVED"
        wo.completed_at = now
        
        if inc:
            inc.status = "RESOLVED"
            inc.updated_at = now
            
        if rep:
            rep.status = "RESOLVED"
            rep.updated_at = now
            
            # Notify citizen
            citizen_notif = Notification(
                user_id=rep.citizen_id,
                type="REPORT_RESOLVED",
                title="Repair Verified & Incident Resolved",
                message=f"Your reported road defect at {rep.citizen_observation or 'reported location'} has been repaired and officially verified.",
                related_resource_type="REPORT",
                related_resource_id=rep.id,
                created_at=now
            )
            db.add(citizen_notif)
            
    elif decision == "REJECT":
        v.status = "REJECTED"
        v.officer_decision = "REJECT"
        v.officer_id = current_user.id
        v.notes = body.notes
        v.reviewed_at = now
        
        wo.status = "IN_PROGRESS"  # Reopened for worker rework
        
        if inc:
            inc.status = "IN_PROGRESS"
            inc.updated_at = now
            
        if rep:
            rep.status = "IN_PROGRESS"
            rep.updated_at = now
            
        if wo.assigned_worker_id:
            worker_notif = Notification(
                user_id=wo.assigned_worker_id,
                type="WORK_ORDER_REJECTED",
                title="Repair Verification Rejected",
                message=f"Work Order #{wo.public_work_order_id} requires rework: {body.notes or 'Verification did not meet resolution standards.'}",
                related_resource_type="WORK_ORDER",
                related_resource_id=wo.id,
                created_at=now
            )
            db.add(worker_notif)
    else:
        raise HTTPException(status_code=400, detail="Decision must be 'APPROVE' or 'REJECT'")
        
    audit = AuditLog(
        actor_id=current_user.id,
        action="REVIEW_VERIFICATION",
        resource_type="VERIFICATION",
        resource_id=v.id,
        result="SUCCESS",
        metadata_json=json.dumps({
            "decision": decision,
            "work_order_id": wo.id,
            "incident_id": inc.id if inc else None,
            "notes": body.notes
        }),
        created_at=now
    )
    db.add(audit)
    db.commit()
    db.refresh(v)
    
    return {
        "status": "success",
        "message": f"Verification decision '{decision}' recorded successfully",
        "verification_status": v.status,
        "work_order_status": wo.status
    }
