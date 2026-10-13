from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models as m
from app.core.security import create_access_token, verify_password
from app.db.session import get_db
from app.deps import get_current_user
from app.serializers import user_out
from app.services.audit import log

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginIn(BaseModel):
    email: str
    password: str


@router.post("/login")
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = db.scalar(select(m.User).where(m.User.email == body.email.lower().strip()))
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password")
    log(db, user.id, "LOGIN", "User", user.id)
    db.commit()
    return {"access_token": create_access_token(user.id, user.role),
            "token_type": "bearer", "user": user_out(user)}


@router.post("/logout")
def logout(user: m.User = Depends(get_current_user), db: Session = Depends(get_db)):
    log(db, user.id, "LOGOUT", "User", user.id)
    db.commit()
    return {"message": "Logged out"}


@router.get("/me")
def me(user: m.User = Depends(get_current_user)):
    return user_out(user)
