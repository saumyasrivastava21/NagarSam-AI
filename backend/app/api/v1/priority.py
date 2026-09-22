from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

from backend.app.db.session import get_db
from backend.app.db.models import Incident, Report, AuditLog, User
from backend.app.services.priority_engine import priority_engine, PriorityCalculationResult, PriorityFactor
from backend.app.services.geo_service import geo_service
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/priority", tags=["Priority Engine"])

class CalculatePriorityRequest(BaseModel):
    severity: str = "MEDIUM"
    defect_class: str = "pothole"
    landmark: Optional[str] = None
    address: Optional[str] = None
    duplicate_count: int = 0
    incident_age_days: float = 0.0

@router.post("/calculate", response_model=PriorityCalculationResult)
def calculate_priority_score(body: CalculatePriorityRequest):
    """Calculates deterministic explainable civic priority score according to priority-v1 rules."""
    return priority_engine.calculate_priority(
        severity=body.severity,
        defect_class=body.defect_class,
        landmark=body.landmark,
        address=body.address,
        duplicate_count=body.duplicate_count,
        incident_age_days=body.incident_age_days
    )

@router.post("/recalculate/{incident_id}")
def recalculate_incident_priority(
    incident_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Recalculates and updates persisted priority score for an incident based on latest geospatial & time factors."""
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")

    rep = db.query(Report).filter(Report.id == inc.report_id).first()
    primary_defect = inc.detected_defects[0].get("class_name", "pothole") if inc.detected_defects else "pothole"

    # Compute duplicate density
    duplicates = geo_service.find_duplicate_candidates(
        db=db,
        latitude=inc.latitude,
        longitude=inc.longitude,
        defect_class=primary_defect,
        current_incident_id=inc.id
    )

    age_days = (datetime.utcnow() - inc.created_at).total_seconds() / 86400.0 if inc.created_at else 0.0

    result = priority_engine.calculate_priority(
        severity=inc.severity,
        defect_class=primary_defect,
        landmark=rep.landmark if rep else None,
        address=inc.address,
        duplicate_count=len(duplicates),
        incident_age_days=age_days
    )

    inc.priority_score = result.priority_score
    inc.priority_level = result.priority_level
    inc.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(inc)

    return {
        "incident_id": inc.id,
        "priority_score": inc.priority_score,
        "priority_level": inc.priority_level,
        "factors": result.factors,
        "rules_version": result.rules_version
    }
