"""001_initial_schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-09-22 13:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial_schema'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=32), nullable=False, server_default='CITIZEN'),
        sa.Column('phone', sa.String(length=32), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_users_id', 'users', ['id'])
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.create_index('ix_users_role', 'users', ['role'])

    # 2. Departments table
    op.create_table(
        'departments',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('name', sa.String(length=255), nullable=False, unique=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_departments_id', 'departments', ['id'])

    # 3. Wards table
    op.create_table(
        'wards',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('code', sa.String(length=64), nullable=False, unique=True),
        sa.Column('department_id', sa.String(length=64), sa.ForeignKey('departments.id'), nullable=True),
        sa.Column('boundary_geojson', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_wards_id', 'wards', ['id'])
    op.create_index('ix_wards_code', 'wards', ['code'], unique=True)

    # 4. ImageAssets table
    op.create_table(
        'image_assets',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('storage_key', sa.String(length=512), nullable=False),
        sa.Column('original_filename', sa.String(length=255), nullable=False),
        sa.Column('content_type', sa.String(length=64), nullable=False, server_default='image/jpeg'),
        sa.Column('file_size', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('sha256', sa.String(length=64), nullable=False),
        sa.Column('width', sa.Integer(), nullable=True),
        sa.Column('height', sa.Integer(), nullable=True),
        sa.Column('created_by', sa.String(length=64), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_image_assets_id', 'image_assets', ['id'])
    op.create_index('ix_image_assets_sha256', 'image_assets', ['sha256'])

    # 5. InferenceResults table
    op.create_table(
        'inference_results',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('image_asset_id', sa.String(length=64), sa.ForeignKey('image_assets.id'), nullable=True),
        sa.Column('request_id', sa.String(length=64), nullable=True),
        sa.Column('model_metadata_json', sa.Text(), nullable=True),
        sa.Column('detection_json', sa.Text(), nullable=False),
        sa.Column('primary_defect', sa.String(length=128), nullable=True),
        sa.Column('primary_confidence', sa.Float(), nullable=True),
        sa.Column('model_status', sa.String(length=64), nullable=False, server_default='completed'),
        sa.Column('inference_latency_ms', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_inference_results_id', 'inference_results', ['id'])

    # 6. Reports table
    op.create_table(
        'reports',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('citizen_id', sa.String(length=64), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('citizen_name', sa.String(length=255), nullable=False, server_default='Citizen Reporter'),
        sa.Column('citizen_phone', sa.String(length=32), nullable=True),
        sa.Column('citizen_observation', sa.Text(), nullable=True),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('landmark', sa.String(length=255), nullable=True),
        sa.Column('image_url', sa.String(length=512), nullable=False),
        sa.Column('image_asset_id', sa.String(length=64), sa.ForeignKey('image_assets.id'), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('address', sa.String(length=512), nullable=False),
        sa.Column('ward_id', sa.String(length=64), sa.ForeignKey('wards.id'), nullable=True),
        sa.Column('ward_name', sa.String(length=255), nullable=True),
        sa.Column('department_id', sa.String(length=64), sa.ForeignKey('departments.id'), nullable=True),
        sa.Column('department_name', sa.String(length=255), nullable=True),
        sa.Column('issue_type', sa.String(length=128), nullable=False, server_default='pothole'),
        sa.Column('primary_defect', sa.String(length=128), nullable=False, server_default='pothole'),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='SUBMITTED'),
        sa.Column('severity', sa.String(length=32), nullable=False, server_default='MEDIUM'),
        sa.Column('priority', sa.String(length=32), nullable=False, server_default='MEDIUM'),
        sa.Column('inference_result_id', sa.String(length=64), sa.ForeignKey('inference_results.id'), nullable=True),
        sa.Column('ai_detection_json', sa.Text(), nullable=True),
        sa.Column('ai_priority_reasoning_json', sa.Text(), nullable=True),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_reports_id', 'reports', ['id'])
    op.create_index('ix_reports_citizen_id', 'reports', ['citizen_id'])
    op.create_index('ix_reports_latitude', 'reports', ['latitude'])
    op.create_index('ix_reports_longitude', 'reports', ['longitude'])
    op.create_index('ix_reports_lat_lon', 'reports', ['latitude', 'longitude'])
    op.create_index('ix_reports_ward_id', 'reports', ['ward_id'])
    op.create_index('ix_reports_status', 'reports', ['status'])
    op.create_index('ix_reports_status_created', 'reports', ['status', 'submitted_at'])

    # 7. Incidents table
    op.create_table(
        'incidents',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('report_id', sa.String(length=64), sa.ForeignKey('reports.id'), nullable=False, unique=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('detected_defects_json', sa.Text(), nullable=True),
        sa.Column('severity', sa.String(length=32), nullable=False, server_default='MEDIUM'),
        sa.Column('priority_score', sa.Float(), nullable=False, server_default='50.0'),
        sa.Column('priority_level', sa.String(length=32), nullable=False, server_default='MEDIUM'),
        sa.Column('department_id', sa.String(length=64), sa.ForeignKey('departments.id'), nullable=True),
        sa.Column('department_name', sa.String(length=255), nullable=True),
        sa.Column('ward_id', sa.String(length=64), sa.ForeignKey('wards.id'), nullable=True),
        sa.Column('ward_name', sa.String(length=255), nullable=True),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='OPEN'),
        sa.Column('assigned_officer_id', sa.String(length=64), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('assigned_worker_id', sa.String(length=64), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('assigned_worker_name', sa.String(length=255), nullable=True),
        sa.Column('work_order_id', sa.String(length=64), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('address', sa.String(length=512), nullable=False),
        sa.Column('rejection_reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_incidents_id', 'incidents', ['id'])
    op.create_index('ix_incidents_report_id', 'incidents', ['report_id'], unique=True)
    op.create_index('ix_incidents_latitude', 'incidents', ['latitude'])
    op.create_index('ix_incidents_longitude', 'incidents', ['longitude'])
    op.create_index('ix_incidents_lat_lon', 'incidents', ['latitude', 'longitude'])
    op.create_index('ix_incidents_status', 'incidents', ['status'])
    op.create_index('ix_incidents_severity', 'incidents', ['severity'])
    op.create_index('ix_incidents_priority_score', 'incidents', ['priority_score'])
    op.create_index('ix_incidents_priority_level', 'incidents', ['priority_level'])
    op.create_index('ix_incidents_department_id', 'incidents', ['department_id'])
    op.create_index('ix_incidents_ward_id', 'incidents', ['ward_id'])
    op.create_index('ix_incidents_priority_status', 'incidents', ['priority_score', 'status'])

    # 8. Work Orders table
    op.create_table(
        'work_orders',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('incident_id', sa.String(length=64), sa.ForeignKey('incidents.id'), nullable=False),
        sa.Column('report_id', sa.String(length=64), sa.ForeignKey('reports.id'), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('instructions', sa.Text(), nullable=True),
        sa.Column('assigned_worker_id', sa.String(length=64), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('assigned_worker_name', sa.String(length=255), nullable=True),
        sa.Column('department_id', sa.String(length=64), sa.ForeignKey('departments.id'), nullable=True),
        sa.Column('ward_id', sa.String(length=64), sa.ForeignKey('wards.id'), nullable=True),
        sa.Column('priority', sa.String(length=32), nullable=False, server_default='MEDIUM'),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='CREATED'),
        sa.Column('before_photo_url', sa.String(length=512), nullable=True),
        sa.Column('after_photo_url', sa.String(length=512), nullable=True),
        sa.Column('before_image_asset_id', sa.String(length=64), sa.ForeignKey('image_assets.id'), nullable=True),
        sa.Column('after_image_asset_id', sa.String(length=64), sa.ForeignKey('image_assets.id'), nullable=True),
        sa.Column('completion_notes', sa.Text(), nullable=True),
        sa.Column('materials_used_json', sa.Text(), nullable=True),
        sa.Column('labor_hours', sa.Float(), nullable=True),
        sa.Column('due_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('accepted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by', sa.String(length=64), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_work_orders_id', 'work_orders', ['id'])
    op.create_index('ix_work_orders_incident_id', 'work_orders', ['incident_id'])
    op.create_index('ix_work_orders_assigned_worker_id', 'work_orders', ['assigned_worker_id'])
    op.create_index('ix_work_orders_status', 'work_orders', ['status'])

    # 9. Verifications table
    op.create_table(
        'verifications',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('work_order_id', sa.String(length=64), sa.ForeignKey('work_orders.id'), nullable=False, unique=True),
        sa.Column('before_photo_url', sa.String(length=512), nullable=True),
        sa.Column('after_photo_url', sa.String(length=512), nullable=True),
        sa.Column('inference_result_id', sa.String(length=64), sa.ForeignKey('inference_results.id'), nullable=True),
        sa.Column('ai_verification_score', sa.Float(), nullable=True),
        sa.Column('ai_verification_result_json', sa.Text(), nullable=True),
        sa.Column('officer_decision', sa.String(length=32), nullable=True, server_default='PENDING'),
        sa.Column('officer_id', sa.String(length=64), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='PENDING'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_verifications_id', 'verifications', ['id'])
    op.create_index('ix_verifications_work_order_id', 'verifications', ['work_order_id'], unique=True)
    op.create_index('ix_verifications_status', 'verifications', ['status'])

    # 10. Notifications table
    op.create_table(
        'notifications',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('user_id', sa.String(length=64), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('type', sa.String(length=32), nullable=False, server_default='INFO'),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('related_resource_type', sa.String(length=32), nullable=True),
        sa.Column('related_resource_id', sa.String(length=64), nullable=True),
        sa.Column('link_url', sa.String(length=512), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_notifications_id', 'notifications', ['id'])
    op.create_index('ix_notifications_user_id', 'notifications', ['user_id'])
    op.create_index('ix_notifications_is_read', 'notifications', ['is_read'])

    # 11. Audit Logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('actor_id', sa.String(length=64), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('actor_role', sa.String(length=32), nullable=True),
        sa.Column('actor_name', sa.String(length=255), nullable=True),
        sa.Column('action', sa.String(length=128), nullable=False),
        sa.Column('resource_type', sa.String(length=64), nullable=False),
        sa.Column('resource_id', sa.String(length=64), nullable=False),
        sa.Column('result', sa.String(length=32), nullable=False, server_default='SUCCESS'),
        sa.Column('metadata_json', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_audit_logs_id', 'audit_logs', ['id'])
    op.create_index('ix_audit_logs_actor_id', 'audit_logs', ['actor_id'])
    op.create_index('ix_audit_logs_action', 'audit_logs', ['action'])
    op.create_index('ix_audit_logs_resource_type', 'audit_logs', ['resource_type'])
    op.create_index('ix_audit_logs_resource_id', 'audit_logs', ['resource_id'])

def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('notifications')
    op.drop_table('verifications')
    op.drop_table('work_orders')
    op.drop_table('incidents')
    op.drop_table('reports')
    op.drop_table('inference_results')
    op.drop_table('image_assets')
    op.drop_table('wards')
    op.drop_table('departments')
    op.drop_table('users')
