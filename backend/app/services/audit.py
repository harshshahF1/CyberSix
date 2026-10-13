import json

from sqlalchemy.orm import Session

from app import models as m
from app.core.clock import now


def log(db: Session, user_id: int | None, action: str, entity_type: str,
        entity_id: int | None, details: dict | str | None = None) -> None:
    if isinstance(details, dict):
        details = json.dumps(details, default=str)
    db.add(m.AuditLog(user_id=user_id, action=action, entity_type=entity_type,
                      entity_id=entity_id, details=details, timestamp=now()))
