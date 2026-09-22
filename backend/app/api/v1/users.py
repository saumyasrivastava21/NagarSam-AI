from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.db.models import User
from backend.app.schemas.auth import UserResponse
from backend.app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("", response_model=List[UserResponse])
async def list_users(
    role: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "OFFICER")),
):
    """Lists users filtered by role or active status (Officer/Admin only)."""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role.upper())
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    return query.order_by(User.created_at.desc()).all()

@router.get("/workers", response_model=List[UserResponse])
async def list_field_workers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "OFFICER")),
):
    """Fetches active field workers available for work order assignment."""
    workers = db.query(User).filter(User.role == "FIELD_WORKER", User.is_active == True).all()
    return workers
