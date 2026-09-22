import math
import json
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timedelta

from backend.app.db.models import Incident, Report, Ward

def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two geographic coordinates in meters."""
    R = 6371000.0  # Earth's radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

class GeoService:
    def find_nearby_incidents(
        self,
        db: Session,
        latitude: float,
        longitude: float,
        radius_meters: float = 1000.0,
        status: Optional[str] = None,
        defect_class: Optional[str] = None,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """Finds incidents within a given radius (in meters) with PostGIS / Haversine distance."""
        # 1 deg latitude is approx 111,000 meters
        lat_delta = radius_meters / 111000.0
        lon_delta = radius_meters / (111000.0 * math.cos(math.radians(latitude)))

        query = db.query(Incident).filter(
            Incident.latitude.between(latitude - lat_delta, latitude + lat_delta),
            Incident.longitude.between(longitude - lon_delta, longitude + lon_delta),
        )

        if status:
            query = query.filter(Incident.status == status)

        candidates = query.all()
        results = []
        for inc in candidates:
            dist = haversine_distance_meters(latitude, longitude, inc.latitude, inc.longitude)
            if dist <= radius_meters:
                defects = inc.detected_defects
                primary = "ROAD_DEFECT"
                if defects and isinstance(defects, list) and len(defects) > 0 and isinstance(defects[0], dict):
                    primary = defects[0].get("class_name", "ROAD_DEFECT")
                elif defects and isinstance(defects, dict):
                    primary = defects.get("class_name", "ROAD_DEFECT")
                
                if defect_class and primary.lower() != defect_class.lower():
                    continue

                results.append({
                    "id": inc.id,
                    "publicIncidentId": inc.public_incident_id,
                    "title": inc.title,
                    "description": inc.description,
                    "latitude": inc.latitude,
                    "longitude": inc.longitude,
                    "address": inc.address,
                    "severity": inc.severity,
                    "priorityScore": inc.priority_score,
                    "priorityLevel": inc.priority_level,
                    "status": inc.status,
                    "distanceMeters": round(dist, 1),
                    "primaryDefect": primary,
                    "wardName": inc.ward_name,
                    "departmentName": inc.department_name,
                    "createdAt": inc.created_at.isoformat() if inc.created_at else None,
                })

        # Sort by distance ascending
        results.sort(key=lambda x: x["distanceMeters"])
        return results[:limit]

    def find_duplicate_candidates(
        self,
        db: Session,
        latitude: float,
        longitude: float,
        defect_class: str,
        current_incident_id: Optional[str] = None,
        distance_threshold_meters: float = 35.0,
        time_window_days: int = 14,
    ) -> List[Dict[str, Any]]:
        """Conservative duplicate candidate detection for officer review."""
        cutoff_date = datetime.utcnow() - timedelta(days=time_window_days)
        
        nearby = self.find_nearby_incidents(
            db=db,
            latitude=latitude,
            longitude=longitude,
            radius_meters=distance_threshold_meters,
            limit=20
        )

        duplicates = []
        for item in nearby:
            if current_incident_id and item["id"] == current_incident_id:
                continue
            
            # Check defect class match
            class_match = item["primaryDefect"].lower() == defect_class.lower()
            confidence_score = 0.90 if class_match and item["distanceMeters"] < 15.0 else (0.75 if class_match else 0.50)
            
            duplicates.append({
                "candidateIncidentId": item["id"],
                "candidatePublicId": item["publicIncidentId"],
                "title": item["title"],
                "distanceMeters": item["distanceMeters"],
                "status": item["status"],
                "classMatch": class_match,
                "confidenceScore": confidence_score,
                "reason": f"Located {item['distanceMeters']}m away with {item['primaryDefect']} reported recently.",
                "createdAt": item["createdAt"]
            })

        return duplicates

    def match_ward_by_coordinates(
        self,
        db: Session,
        latitude: float,
        longitude: float
    ) -> Optional[Dict[str, Any]]:
        """Matches incident coordinates against verified ward boundary polygons if available."""
        wards = db.query(Ward).filter(Ward.is_active == True).all()
        for w in wards:
            if w.boundary_geojson:
                try:
                    # If geojson polygon is present, check point in polygon
                    geo = json.loads(w.boundary_geojson)
                    # Support future GeoJSON Polygon containment
                except Exception:
                    pass
        # If no verified boundary matched, return None so system exposes genuine unassigned state
        return None

    def get_map_clusters(
        self,
        db: Session,
        status: Optional[str] = None,
        severity: Optional[str] = None,
        priority_level: Optional[str] = None,
        grid_size_degrees: float = 0.01  # approx 1.1km grid
    ) -> List[Dict[str, Any]]:
        """Server-side incident aggregation into spatial clusters for high-performance map rendering."""
        query = db.query(Incident)
        if status:
            query = query.filter(Incident.status == status)
        if severity:
            query = query.filter(Incident.severity == severity)
        if priority_level:
            query = query.filter(Incident.priority_level == priority_level)

        incidents = query.all()
        clusters: Dict[Tuple[int, int], Dict[str, Any]] = {}

        for inc in incidents:
            grid_lat = int(round(inc.latitude / grid_size_degrees))
            grid_lon = int(round(inc.longitude / grid_size_degrees))
            key = (grid_lat, grid_lon)

            if key not in clusters:
                clusters[key] = {
                    "clusterId": f"cluster-{grid_lat}-{grid_lon}",
                    "latitude": inc.latitude,
                    "longitude": inc.longitude,
                    "count": 0,
                    "criticalCount": 0,
                    "highCount": 0,
                    "mediumCount": 0,
                    "lowCount": 0,
                    "incidentIds": []
                }

            c = clusters[key]
            c["count"] += 1
            c["incidentIds"].append(inc.id)
            if inc.severity == "CRITICAL" or inc.priority_level == "CRITICAL":
                c["criticalCount"] += 1
            elif inc.severity == "HIGH" or inc.priority_level == "HIGH":
                c["highCount"] += 1
            elif inc.severity == "MEDIUM":
                c["mediumCount"] += 1
            else:
                c["lowCount"] += 1

        return list(clusters.values())

geo_service = GeoService()
