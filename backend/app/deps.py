from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models as m
from app.core.security import decode_token
from app.db.session import get_db

bearer = HTTPBearer(auto_error=False)


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> m.User:
    if creds is None:
        raise HTTPException(401, "Not authenticated")
    payload = decode_token(creds.credentials)
    if not payload:
        raise HTTPException(401, "Invalid or expired token")
    user = db.get(m.User, int(payload["sub"]))
    if not user:
        raise HTTPException(401, "User no longer exists")
    return user


def require_roles(*roles: str):
    def checker(user: m.User = Depends(get_current_user)) -> m.User:
        if user.role not in roles:
            raise HTTPException(403, "You do not have permission for this action")
        return user

    return checker


coordinator_only = require_roles("coordinator")
staff_or_coordinator = require_roles("coordinator", "staff")


def student_for_user(db: Session, user: m.User) -> m.Student:
    st = db.scalar(select(m.Student).where(m.Student.user_id == user.id))
    if not st:
        raise HTTPException(404, "No student profile for this user")
    return st
