import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.db.session import get_db
from backend.app.db.models import Notification, User
from backend.app.schemas.notifications import NotificationResponse, PaginatedNotificationsResponse
from backend.app.api.deps import get_current_user, get_optional_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

def _format_notif_dict(n: Notification) -> Dict[str, Any]:
    return {
        "id": n.id,
        "userId": n.user_id,
        "type": n.type,
        "title": n.title,
        "message": n.message,
        "relatedResourceType": n.related_resource_type,
        "relatedResourceId": n.related_resource_id,
        "linkUrl": n.link_url,
        "read": n.is_read,
        "isRead": n.is_read,
        "readAt": n.read_at.isoformat() if n.read_at else None,
        "createdAt": n.created_at.isoformat() if n.created_at else "",
    }

@router.get("", response_model=List[NotificationResponse])
async def list_notifications(
    userId: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Fetches user notifications sorted newest first."""
    effective_user_id = userId or (current_user.id if current_user else "USR-CITIZEN-DEFAULT")
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == effective_user_id)
        .order_by(desc(Notification.created_at))
        .all()
    )
    return [_format_notif_dict(n) for n in notifications]

@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_read(notification_id: str, db: Session = Depends(get_db)):
    """Marks an individual notification as read."""
    n = db.query(Notification).filter(Notification.id == notification_id).first()
    if not n:
        raise HTTPException(status_code=404, detail=f"Notification {notification_id} not found.")

    n.is_read = True
    n.read_at = datetime.datetime.now(datetime.timezone.utc)
    db.commit()
    db.refresh(n)
    return _format_notif_dict(n)

@router.post("/mark-all-read")
async def mark_all_read(
    userId: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Marks all notifications for user as read."""
    effective_user_id = userId or (current_user.id if current_user else "USR-CITIZEN-DEFAULT")
    now = datetime.datetime.now(datetime.timezone.utc)
    db.query(Notification).filter(Notification.user_id == effective_user_id, Notification.is_read == False).update(
        {"is_read": True, "read_at": now}
    )
    db.commit()
    return {"status": "SUCCESS", "message": "All notifications marked as read."}
