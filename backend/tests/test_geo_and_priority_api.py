import pytest
import json
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.db.session import SessionLocal
from backend.app.db.models import User, UserRole, Report, Incident
from backend.app.services.auth_service import auth_service
from backend.app.services.priority_engine import priority_engine

client = TestClient(app)

@pytest.fixture
def db_session():
    session = SessionLocal()
    yield session
    session.close()

def test_deterministic_priority_engine():
    # Test low severity crack with no sensitive landmark
    res_low = priority_engine.calculate_priority(
        severity="LOW",
        defect_class="crack",
        landmark="Residential lane",
        address="Sector A",
        duplicate_count=0,
        incident_age_days=0.0
    )
    assert res_low.rules_version == "priority-v1"
    assert res_low.priority_score == 25.0
    assert res_low.priority_level == "LOW"

    # Test high severity pothole near metro station with duplicates and SLA aging
    res_crit = priority_engine.calculate_priority(
        severity="HIGH",
        defect_class="pothole",
        landmark="Near Hazratganj Metro Station and Hospital",
        address="MG Road",
        duplicate_count=3,
        incident_age_days=4.5
    )
    assert res_crit.priority_score >= 80.0
    assert res_crit.priority_level == "CRITICAL"
    factor_names = [f.name for f in res_crit.factors]
    assert "SEVERITY_BASE" in factor_names
    assert "DEFECT_CLASS_HAZARD" in factor_names
    assert "SENSITIVE_ZONE_PROXIMITY" in factor_names
    assert "CITIZEN_IMPACT_DENSITY" in factor_names
    assert "SLA_AGING_DECAY" in factor_names

def test_geo_nearby_and_duplicate_candidates(db_session):
    # Setup test incidents at known coordinates
    # Location 1: Hazratganj Lucknow (26.8467, 80.9462)
    # Location 2: 20 meters away (26.8468, 80.9463)
    # Location 3: 5 km away in Gomti Nagar (26.8500, 80.9950)

    user = db_session.query(User).filter(User.email == "geo_test@nagarsam.gov").first()
    if not user:
        user = User(
            email="geo_test@nagarsam.gov",
            password_hash="fakehash",
            full_name="Geo Tester",
            role=UserRole.OFFICER,
            is_active=True
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

    rep1 = db_session.query(Report).filter(Report.id == "REP-GEO-1").first()
    if not rep1:
        rep1 = Report(
            id="REP-GEO-1",
            citizen_id=user.id,
            description="Pothole 1",
            image_url="/storage/test1.jpg",
            latitude=26.8467,
            longitude=80.9462,
            address="Hazratganj Main",
            status="OPEN"
        )
        db_session.add(rep1)
        db_session.commit()
        db_session.refresh(rep1)

    inc1 = db_session.query(Incident).filter(Incident.id == "INC-GEO-1").first()
    if not inc1:
        inc1 = Incident(
            id="INC-GEO-1",
            report_id=rep1.id,
            title="Pothole at Hazratganj",
            description="Major pothole",
            severity="HIGH",
            priority_score=75.0,
            priority_level="HIGH",
            status="OPEN",
            latitude=26.8467,
            longitude=80.9462,
            address="Hazratganj Main",
            detected_defects_json=json.dumps([{"class_name": "Pothole", "confidence": 0.95}])
        )
        db_session.add(inc1)
        db_session.commit()

    # Nearby candidate 2 (20m away)
    rep2 = db_session.query(Report).filter(Report.id == "REP-GEO-2").first()
    if not rep2:
        rep2 = Report(
            id="REP-GEO-2",
            citizen_id=user.id,
            description="Pothole 2",
            image_url="/storage/test2.jpg",
            latitude=26.8468,
            longitude=80.9463,
            address="Hazratganj Crossing",
            status="OPEN"
        )
        db_session.add(rep2)
        db_session.commit()
        db_session.refresh(rep2)

    inc2 = db_session.query(Incident).filter(Incident.id == "INC-GEO-2").first()
    if not inc2:
        inc2 = Incident(
            id="INC-GEO-2",
            report_id=rep2.id,
            title="Pothole near Crossing",
            description="Nearby pothole",
            severity="MEDIUM",
            priority_score=60.0,
            priority_level="MEDIUM",
            status="OPEN",
            latitude=26.8468,
            longitude=80.9463,
            address="Hazratganj Crossing",
            detected_defects_json=json.dumps([{"class_name": "Pothole", "confidence": 0.90}])
        )
        db_session.add(inc2)
        db_session.commit()

    # Query nearby incidents within 500m
    res = client.get("/api/v1/geo/nearby?latitude=26.8467&longitude=80.9462&radius=500")
    assert res.status_code == 200
    items = res.json()
    assert len(items) >= 2
    assert items[0]["distanceMeters"] <= items[1]["distanceMeters"]

    # Query duplicate candidates for inc1
    dup_res = client.get(f"/api/v1/geo/duplicates?latitude=26.8467&longitude=80.9462&defect_class=Pothole&incident_id={inc1.id}&threshold_meters=50")
    assert dup_res.status_code == 200
    dups = dup_res.json()
    assert len(dups) >= 1
    assert any(d["candidateIncidentId"] == inc2.id for d in dups)
    assert any(d["classMatch"] == True for d in dups)

def test_map_clusters_and_points_api(db_session):
    res_clusters = client.get("/api/v1/geo/clusters")
    assert res_clusters.status_code == 200
    clusters = res_clusters.json()
    assert isinstance(clusters, list)
    assert len(clusters) >= 1
    assert "count" in clusters[0]
    assert "latitude" in clusters[0]

    res_points = client.get("/api/v1/geo/map-points")
    assert res_points.status_code == 200
    points = res_points.json()
    assert isinstance(points, list)
    assert len(points) >= 1
    assert "publicIncidentId" in points[0]
