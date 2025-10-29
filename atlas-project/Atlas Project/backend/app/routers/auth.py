from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.deps import get_current_user, get_db
from app import schemas
from app.models import User

router = APIRouter(prefix="/auth", tags=["auth"])


def _issue_tokens(user: User) -> schemas.TokenPair:
    return schemas.TokenPair(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/register", response_model=schemas.AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: schemas.UserCreate, db: Session = Depends(get_db)) -> schemas.AuthResponse:
    email = payload.email.lower()
    existing = db.scalar(select(User).where(User.email == email))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account already exists for this email",
        )
    user = User(email=email, password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return schemas.AuthResponse(user=user, tokens=_issue_tokens(user))


@router.post("/login", response_model=schemas.AuthResponse)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)) -> schemas.AuthResponse:
    email = payload.email.lower()
    user = db.scalar(select(User).where(User.email == email))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return schemas.AuthResponse(user=user, tokens=_issue_tokens(user))


@router.post("/refresh", response_model=schemas.TokenPair)
def refresh(payload: schemas.TokenRefreshRequest, db: Session = Depends(get_db)) -> schemas.TokenPair:
    decoded = decode_token(payload.refresh_token, expected_type="refresh")
    user_id = decoded.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    user = db.get(User, int(user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return _issue_tokens(user)


@router.get("/me", response_model=schemas.UserRead)
def me(current_user: Annotated[User, Depends(get_current_user)]) -> schemas.UserRead:
    return current_user
