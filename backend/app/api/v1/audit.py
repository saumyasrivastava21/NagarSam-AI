import json
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.db.session import get_db
from backend.app.db.models import AuditLog, User
from backend.app.schemas.audit import AuditLogResponse, PaginatedAuditLogsResponse
from backend.app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])

def _format_audit_dict(log: AuditLog) -> Dict[str, Any]:
    meta = None
    if log.metadata_json:
        try:
            meta = json.loads(log.metadata_json)
        except Exception:
            pass
    return {
        "id": log.id,
        "actorId": log.actor_id,
        "actorRole": log.actor_role,
        "actorName": log.actor_name,
        "action": log.action,
        "resourceType": log.resource_type,
        "resourceId": log.resource_id,
        "result": log.result,
        "metadata": meta,
        "createdAt": log.created_at.isoformat() if log.created_at else "",
    }

@router.get("", response_model=PaginatedAuditLogsResponse)
async def list_audit_logs(
    actorId: Optional[str] = Query(None),
    resourceType: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    result: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "OFFICER")),
):
    """Fetches system audit logs with filtering and pagination (Admin/Officer only)."""
    query = db.query(AuditLog)

    if actorId:
        query = query.filter(AuditLog.actor_id == actorId)
    if resourceType:
        query = query.filter(AuditLog.resource_type == resourceType.upper())
    if action:
        query = query.filter(AuditLog.action == action.upper())
    if result:
        query = query.filter(AuditLog.result == result.upper())

    total = query.count()
    logs = query.order_by(desc(AuditLog.created_at)).offset((page - 1) * limit).limit(limit).all()

    formatted = [_format_audit_dict(log) for log in logs]
    total_pages = (total + limit - 1) // limit if total > 0 else 1

    return {
        "data": formatted,
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": total_pages,
    }
