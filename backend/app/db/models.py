import datetime
from typing import Optional, List
from sqlalchemy import (
    Column,
    String,
    Text,
    Float,
    Integer,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import relationship
from backend.app.db.session import Base

def utc_now():
    return datetime.datetime.now(datetime.timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(32), nullable=False, default="CITIZEN", index=True)  # CITIZEN, OFFICER, FIELD_WORKER, ADMIN
    phone = Column(String(32), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    reports = relationship("Report", back_populates="citizen", foreign_keys="Report.citizen_id")
    assigned_incidents = relationship("Incident", back_populates="assigned_officer", foreign_keys="Incident.assigned_officer_id")
    assigned_work_orders = relationship("WorkOrder", back_populates="assigned_worker", foreign_keys="WorkOrder.assigned_worker_id")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class Department(Base):
    __tablename__ = "departments"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    wards = relationship("Ward", back_populates="department")
    incidents = relationship("Incident", back_populates="department")
    work_orders = relationship("WorkOrder", back_populates="department")


class Ward(Base):
    __tablename__ = "wards"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(64), nullable=False, unique=True, index=True)
    department_id = Column(String(64), ForeignKey("departments.id"), nullable=True)
    boundary_geojson = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    department = relationship("Department", back_populates="wards")
    reports = relationship("Report", back_populates="ward")
    incidents = relationship("Incident", back_populates="ward")


class ImageAsset(Base):
    __tablename__ = "image_assets"

    id = Column(String(64), primary_key=True, index=True)
    storage_key = Column(String(512), nullable=False)
    original_filename = Column(String(255), nullable=False)
    content_type = Column(String(64), nullable=False, default="image/jpeg")
    file_size = Column(Integer, nullable=False, default=0)
    sha256 = Column(String(64), nullable=False, index=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    created_by = Column(String(64), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)


class InferenceResult(Base):
    __tablename__ = "inference_results"

    id = Column(String(64), primary_key=True, index=True)
    image_asset_id = Column(String(64), ForeignKey("image_assets.id"), nullable=True)
    request_id = Column(String(64), nullable=True)
    model_metadata_json = Column(Text, nullable=True)
    detection_json = Column(Text, nullable=False)
    primary_defect = Column(String(128), nullable=True)
    primary_confidence = Column(Float, nullable=True)
    model_status = Column(String(64), nullable=False, default="completed")
    inference_latency_ms = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)


class Report(Base):
    __tablename__ = "reports"

    id = Column(String(64), primary_key=True, index=True)  # e.g., NS-2026-00001
    citizen_id = Column(String(64), ForeignKey("users.id"), nullable=False, index=True)
    citizen_name = Column(String(255), nullable=False, default="Citizen Reporter")
    citizen_phone = Column(String(32), nullable=True)
    citizen_observation = Column(Text, nullable=True)
    description = Column(Text, nullable=False)
    landmark = Column(String(255), nullable=True)
    image_url = Column(String(512), nullable=False)
    image_asset_id = Column(String(64), ForeignKey("image_assets.id"), nullable=True)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    address = Column(String(512), nullable=False)
    ward_id = Column(String(64), ForeignKey("wards.id"), nullable=True, index=True)
    ward_name = Column(String(255), nullable=True)
    department_id = Column(String(64), ForeignKey("departments.id"), nullable=True)
    department_name = Column(String(255), nullable=True)
    issue_type = Column(String(128), nullable=False, default="pothole")
    primary_defect = Column(String(128), nullable=False, default="pothole")
    status = Column(String(32), nullable=False, default="SUBMITTED", index=True)
    severity = Column(String(32), nullable=False, default="MEDIUM")
    priority = Column(String(32), nullable=False, default="MEDIUM")
    inference_result_id = Column(String(64), ForeignKey("inference_results.id"), nullable=True)
    ai_detection_json = Column(Text, nullable=True)
    ai_priority_reasoning_json = Column(Text, nullable=True)
    submitted_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    citizen = relationship("User", back_populates="reports", foreign_keys=[citizen_id])
    ward = relationship("Ward", back_populates="reports")
    incident = relationship("Incident", back_populates="report", uselist=False)

    __table_args__ = (
        Index("ix_reports_lat_lon", "latitude", "longitude"),
        Index("ix_reports_status_created", "status", "submitted_at"),
    )


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(64), primary_key=True, index=True)  # e.g., INC-NS-2026-00001
    report_id = Column(String(64), ForeignKey("reports.id"), nullable=False, unique=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    detected_defects_json = Column(Text, nullable=True)
    severity = Column(String(32), nullable=False, default="MEDIUM", index=True)
    priority_score = Column(Float, nullable=False, default=50.0, index=True)
    priority_level = Column(String(32), nullable=False, default="MEDIUM", index=True)
    department_id = Column(String(64), ForeignKey("departments.id"), nullable=True, index=True)
    department_name = Column(String(255), nullable=True)
    ward_id = Column(String(64), ForeignKey("wards.id"), nullable=True, index=True)
    ward_name = Column(String(255), nullable=True)
    status = Column(String(32), nullable=False, default="OPEN", index=True)
    assigned_officer_id = Column(String(64), ForeignKey("users.id"), nullable=True)
    assigned_worker_id = Column(String(64), ForeignKey("users.id"), nullable=True)
    assigned_worker_name = Column(String(255), nullable=True)
    work_order_id = Column(String(64), nullable=True)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    address = Column(String(512), nullable=False)
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    report = relationship("Report", back_populates="incident")
    department = relationship("Department", back_populates="incidents")
    ward = relationship("Ward", back_populates="incidents")
    assigned_officer = relationship("User", back_populates="assigned_incidents", foreign_keys=[assigned_officer_id])
    work_orders = relationship("WorkOrder", back_populates="incident", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_incidents_lat_lon", "latitude", "longitude"),
        Index("ix_incidents_priority_status", "priority_score", "status"),
    )


class WorkOrder(Base):
    __tablename__ = "work_orders"

    id = Column(String(64), primary_key=True, index=True)  # e.g., WO-2026-00001
    incident_id = Column(String(64), ForeignKey("incidents.id"), nullable=False, index=True)
    report_id = Column(String(64), ForeignKey("reports.id"), nullable=True)
    title = Column(String(255), nullable=False)
    instructions = Column(Text, nullable=True)
    assigned_worker_id = Column(String(64), ForeignKey("users.id"), nullable=True, index=True)
    assigned_worker_name = Column(String(255), nullable=True)
    department_id = Column(String(64), ForeignKey("departments.id"), nullable=True)
    ward_id = Column(String(64), ForeignKey("wards.id"), nullable=True)
    priority = Column(String(32), nullable=False, default="MEDIUM")
    status = Column(String(32), nullable=False, default="CREATED", index=True)  # CREATED, ASSIGNED, ACCEPTED, IN_PROGRESS, COMPLETED, VERIFYING, RESOLVED, REOPENED, CANCELLED
    before_photo_url = Column(String(512), nullable=True)
    after_photo_url = Column(String(512), nullable=True)
    before_image_asset_id = Column(String(64), ForeignKey("image_assets.id"), nullable=True)
    after_image_asset_id = Column(String(64), ForeignKey("image_assets.id"), nullable=True)
    completion_notes = Column(Text, nullable=True)
    materials_used_json = Column(Text, nullable=True)
    labor_hours = Column(Float, nullable=True)
    due_at = Column(DateTime(timezone=True), nullable=True)
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(String(64), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    incident = relationship("Incident", back_populates="work_orders")
    department = relationship("Department", back_populates="work_orders")
    assigned_worker = relationship("User", back_populates="assigned_work_orders", foreign_keys=[assigned_worker_id])
    verification = relationship("Verification", back_populates="work_order", uselist=False, cascade="all, delete-orphan")


class Verification(Base):
    __tablename__ = "verifications"

    id = Column(String(64), primary_key=True, index=True)  # e.g., VER-00001
    work_order_id = Column(String(64), ForeignKey("work_orders.id"), nullable=False, unique=True, index=True)
    before_photo_url = Column(String(512), nullable=True)
    after_photo_url = Column(String(512), nullable=True)
    inference_result_id = Column(String(64), ForeignKey("inference_results.id"), nullable=True)
    ai_verification_score = Column(Float, nullable=True)
    ai_verification_result_json = Column(Text, nullable=True)
    officer_decision = Column(String(32), nullable=True, default="PENDING")  # PENDING, APPROVED, REJECTED
    officer_id = Column(String(64), ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String(32), nullable=False, default="PENDING", index=True)  # PENDING, APPROVED, REJECTED
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    work_order = relationship("WorkOrder", back_populates="verification")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False, index=True)
    type = Column(String(32), nullable=False, default="INFO")  # INFO, STATUS_UPDATE, ASSIGNMENT, VERIFICATION, ALERT
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    related_resource_type = Column(String(32), nullable=True)  # REPORT, INCIDENT, WORK_ORDER
    related_resource_id = Column(String(64), nullable=True)
    link_url = Column(String(512), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    user = relationship("User", back_populates="notifications")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(64), primary_key=True, index=True)
    actor_id = Column(String(64), ForeignKey("users.id"), nullable=True, index=True)
    actor_role = Column(String(32), nullable=True)
    actor_name = Column(String(255), nullable=True)
    action = Column(String(128), nullable=False, index=True)
    resource_type = Column(String(64), nullable=False, index=True)
    resource_id = Column(String(64), nullable=False, index=True)
    result = Column(String(32), nullable=False, default="SUCCESS")
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
