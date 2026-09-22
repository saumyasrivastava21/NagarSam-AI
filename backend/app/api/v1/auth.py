import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.db.models import User, AuditLog
from backend.app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    RefreshTokenRequest,
    TokenResponse,
    UserResponse,
)
from backend.app.services.auth_service import auth_service
from backend.app.api.deps import get_current_user
from backend.app.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(request: UserRegisterRequest, db: Session = Depends(get_db)):
    """Registers a new user (Citizen, Officer, Field Worker, Admin) and returns JWT tokens."""
    normalized_email = request.email.lower().strip()
    existing_user = db.query(User).filter(User.email == normalized_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"User with email '{normalized_email}' already exists."
        )

    user_id = f"USR-{uuid.uuid4().hex[:10]}"
    password_hash = auth_service.hash_password(request.password)

    new_user = User(
        id=user_id,
        full_name=request.full_name.strip(),
        email=normalized_email,
        password_hash=password_hash,
        role=request.role.value,
        phone=request.phone,
        is_active=True,
    )
    db.add(new_user)

    # Add audit log
    audit = AuditLog(
        id=f"AUD-{uuid.uuid4().hex[:10]}",
        actor_id=user_id,
        actor_role=new_user.role,
        actor_name=new_user.full_name,
        action="USER_REGISTERED",
        resource_type="USER",
        resource_id=user_id,
        result="SUCCESS",
    )
    db.add(audit)
    db.commit()
    db.refresh(new_user)

    access_token = auth_service.create_access_token(new_user.id, new_user.email, new_user.role)
    refresh_token = auth_service.create_refresh_token(new_user.id, new_user.email, new_user.role)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": new_user,
    }

@router.post("/login", response_model=TokenResponse)
async def login(request: UserLoginRequest, db: Session = Depends(get_db)):
    """Authenticates credentials and issues signed JWT access and refresh tokens."""
    normalized_email = request.email.lower().strip()
    user = db.query(User).filter(User.email == normalized_email).first()
    if not user or not auth_service.verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated. Contact administrator.",
        )

    # Log successful login
    audit = AuditLog(
        id=f"AUD-{uuid.uuid4().hex[:10]}",
        actor_id=user.id,
        actor_role=user.role,
        actor_name=user.full_name,
        action="USER_LOGIN",
        resource_type="USER",
        resource_id=user.id,
        result="SUCCESS",
    )
    db.add(audit)
    db.commit()

    access_token = auth_service.create_access_token(user.id, user.email, user.role)
    refresh_token = auth_service.create_refresh_token(user.id, user.email, user.role)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": user,
    }

@router.post("/refresh", response_model=TokenResponse)
async def refresh_tokens(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Rotates refresh token and issues a new access token."""
    try:
        payload = auth_service.decode_token(request.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Provided token is not a refresh token."
            )
        user_id = payload.get("sub")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token."
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not active.")

    access_token = auth_service.create_access_token(user.id, user.email, user.role)
    new_refresh_token = auth_service.create_refresh_token(user.id, user.email, user.role)

    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "expires_in": settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": user,
    }

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Logs out user and records audit log."""
    audit = AuditLog(
        id=f"AUD-{uuid.uuid4().hex[:10]}",
        actor_id=current_user.id,
        actor_role=current_user.role,
        actor_name=current_user.full_name,
        action="USER_LOGOUT",
        resource_type="USER",
        resource_id=current_user.id,
        result="SUCCESS",
    )
    db.add(audit)
    db.commit()
    return {"status": "SUCCESS", "message": "Successfully logged out."}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Returns the authenticated user's profile and permissions."""
    return current_user
