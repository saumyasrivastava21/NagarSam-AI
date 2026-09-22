import pytest
import json
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.db.session import get_db, SessionLocal
from backend.app.db.models import User, UserRole, Report, Incident, WorkOrder, Verification, Notification, Department, Ward
from backend.app.services.auth_service import auth_service
from datetime import datetime

client = TestClient(app)

@pytest.fixture
def db_session():
    session = SessionLocal()
    yield session
    session.close()

def test_departments_and_wards_api(db_session):
    # Ensure test department exists
    dept = db_session.query(Department).filter(Department.name == "Public Works").first()
    if not dept:
        dept = Department(name="Public Works", description="Infrastructure & Roads", is_active=True)
        db_session.add(dept)
        db_session.commit()
        db_session.refresh(dept)
        
    res = client.get("/api/v1/departments")
    assert res.status_code == 200
    data = res.json()
    assert any(d["name"] == "Public Works" for d in data)

def test_notifications_workflow(db_session):
    # Create test user
    user = db_session.query(User).filter(User.email == "notif_user@nagarsam.gov").first()
    if not user:
        user = User(
            email="notif_user@nagarsam.gov",
            password_hash="fakehash",
            full_name="Notification Test Citizen",
            role=UserRole.CITIZEN,
            is_active=True
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
    # Add notification
    notif = Notification(
        user_id=user.id,
        type="REPORT_SUBMITTED",
        title="Test Submission",
        message="Your report was submitted successfully",
        created_at=datetime.utcnow()
    )
    db_session.add(notif)
    db_session.commit()
    db_session.refresh(notif)
    
    token = auth_service.create_access_token(user_id=user.id, email=user.email, role=user.role)
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get notifications
    res = client.get("/api/v1/notifications", headers=headers)
    assert res.status_code == 200
    items = res.json()
    assert len(items) >= 1
    
    # Mark as read
    res = client.patch(f"/api/v1/notifications/{notif.id}/read", headers=headers)
    assert res.status_code == 200
    assert res.json()["isRead"] == True

def test_verification_review_lifecycle(db_session):
    # Setup officer and worker
    officer = db_session.query(User).filter(User.email == "officer_verif@nagarsam.gov").first()
    if not officer:
        officer = User(
            email="officer_verif@nagarsam.gov",
            password_hash="fakehash",
            full_name="Verification Officer",
            role=UserRole.OFFICER,
            is_active=True
        )
        db_session.add(officer)
        db_session.commit()
        db_session.refresh(officer)
        
    # Setup report, incident, work order, verification
    rep = db_session.query(Report).filter(Report.id == "REP-TEST-VERIF-1").first()
    if not rep:
        rep = Report(
            id="REP-TEST-VERIF-1",
            citizen_id=officer.id,
            citizen_observation="Verif pothole",
            description="Severe road hazard",
            image_url="/storage/test.jpg",
            latitude=26.8467,
            longitude=80.9462,
            address="Lucknow Central Road",
            status="VERIFYING"
        )
        db_session.add(rep)
        db_session.commit()
        db_session.refresh(rep)
    
    inc = db_session.query(Incident).filter(Incident.id == "INC-TEST-VERIF-1").first()
    if not inc:
        inc = Incident(
            id="INC-TEST-VERIF-1",
            report_id=rep.id,
            title="Road Defect Incident",
            description="Pothole verification needed",
            severity="HIGH",
            priority_score=85.0,
            priority_level="HIGH",
            status="VERIFYING",
            latitude=26.8467,
            longitude=80.9462,
            address="Lucknow Central Road",
            detected_defects_json=json.dumps([{"class_name": "Pothole", "confidence": 0.92}])
        )
        db_session.add(inc)
        db_session.commit()
        db_session.refresh(inc)
    
    wo = db_session.query(WorkOrder).filter(WorkOrder.id == "WO-TEST-VERIF-1").first()
    if not wo:
        wo = WorkOrder(
            id="WO-TEST-VERIF-1",
            incident_id=inc.id,
            title="Repair and fill pothole",
            status="VERIFYING",
            created_by=officer.id
        )
        db_session.add(wo)
        db_session.commit()
        db_session.refresh(wo)
    
    verif = db_session.query(Verification).filter(Verification.work_order_id == wo.id).first()
    if not verif:
        verif = Verification(
            work_order_id=wo.id,
            status="PENDING",
            ai_verification_result_json=json.dumps({"status": "NO_DEFECTS_DETECTED"})
        )
        db_session.add(verif)
        db_session.commit()
        db_session.refresh(verif)
    
    officer_token = auth_service.create_access_token(user_id=officer.id, email=officer.email, role=officer.role)
    headers = {"Authorization": f"Bearer {officer_token}"}
    
    # Officer approves resolution
    res = client.post(
        f"/api/v1/verifications/{verif.id}/review",
        json={"decision": "APPROVE", "notes": "Quality check passed"},
        headers=headers
    )
    assert res.status_code == 200
    
    # Check persistence
    db_session.refresh(verif)
    db_session.refresh(wo)
    db_session.refresh(inc)
    db_session.refresh(rep)
    
    assert verif.status == "APPROVED"
    assert wo.status == "RESOLVED"
    assert inc.status == "RESOLVED"
    assert rep.status == "RESOLVED"

def test_system_health_and_models(db_session):
    res = client.get("/api/v1/system/health")
    assert res.status_code == 200
    services = res.json()
    assert len(services) >= 3
    
    res = client.get("/api/v1/models")
    assert res.status_code == 200
    models = res.json()
    assert len(models) == 2
