from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from backend.app.db.session import get_db
from backend.app.services.geo_service import geo_service
from backend.app.db.models import Incident

router = APIRouter(prefix="/geo", tags=["Geospatial Intelligence"])

@router.get("/nearby")
def get_nearby_incidents(
    latitude: float = Query(..., description="Target Latitude in degrees"),
    longitude: float = Query(..., description="Target Longitude in degrees"),
    radius: float = Query(1000.0, description="Radius in meters"),
    status: Optional[str] = Query(None, description="Filter by status"),
    defect_class: Optional[str] = Query(None, description="Filter by defect class"),
    limit: int = Query(50, description="Max results"),
    db: Session = Depends(get_db)
):
    """Retrieves real persisted incidents within the given radius in meters."""
    return geo_service.find_nearby_incidents(
        db=db,
        latitude=latitude,
        longitude=longitude,
        radius_meters=radius,
        status=status,
        defect_class=defect_class,
        limit=limit
    )

@router.get("/duplicates")
def get_duplicate_candidates(
    latitude: float = Query(..., description="Latitude of candidate"),
    longitude: float = Query(..., description="Longitude of candidate"),
    defect_class: str = Query("pothole", description="Defect class"),
    incident_id: Optional[str] = Query(None, description="Exclude self incident ID"),
    threshold_meters: float = Query(35.0, description="Proximity threshold in meters"),
    db: Session = Depends(get_db)
):
    """Detects conservative duplicate candidate incidents for officer verification."""
    return geo_service.find_duplicate_candidates(
        db=db,
        latitude=latitude,
        longitude=longitude,
        defect_class=defect_class,
        current_incident_id=incident_id,
        distance_threshold_meters=threshold_meters
    )

@router.get("/clusters")
def get_incident_clusters(
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    priority_level: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Returns spatial grid clusters for scalable, lag-free map visualization."""
    return geo_service.get_map_clusters(
        db=db,
        status=status,
        severity=severity,
        priority_level=priority_level
    )

@router.get("/map-points")
def get_all_map_points(
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    priority_level: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Returns geographic coordinates and attributes for all matching incidents."""
    query = db.query(Incident)
    if status:
        query = query.filter(Incident.status == status)
    if severity:
        query = query.filter(Incident.severity == severity)
    if priority_level:
        query = query.filter(Incident.priority_level == priority_level)

    incidents = query.all()
    return [
        {
            "id": inc.id,
            "publicIncidentId": inc.public_incident_id,
            "title": inc.title,
            "latitude": inc.latitude,
            "longitude": inc.longitude,
            "address": inc.address,
            "severity": inc.severity,
            "priorityScore": inc.priority_score,
            "priorityLevel": inc.priority_level,
            "status": inc.status,
            "wardName": inc.ward_name,
            "departmentName": inc.department_name,
            "primaryDefect": (
                inc.detected_defects[0].get("class_name", "ROAD_DEFECT")
                if inc.detected_defects and isinstance(inc.detected_defects, list) and len(inc.detected_defects) > 0 and isinstance(inc.detected_defects[0], dict)
                else "ROAD_DEFECT"
            ),
            "createdAt": inc.created_at.isoformat() if inc.created_at else None
        }
        for inc in incidents
    ]
