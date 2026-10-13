from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models as m
from app.db.session import get_db
from app.deps import coordinator_only, get_current_user, student_for_user
from app.serializers import renewal_out
from app.services import loans

router = APIRouter(prefix="/api/renewals", tags=["renewals"])


class RenewalIn(BaseModel):
    issue_id: int


class DecisionIn(BaseModel):
    remarks: str | None = None


@router.post("", status_code=201)
def create_renewal(body: RenewalIn, db: Session = Depends(get_db),
                   user: m.User = Depends(get_current_user)):
    return renewal_out(loans.request_renewal(db, issue_id=body.issue_id, user=user))


@router.get("")
def list_renewals(status: str | None = None, db: Session = Depends(get_db),
                  user: m.User = Depends(get_current_user)):
    stmt = select(m.Renewal).join(m.Issue)
    if user.role == "student":
        stmt = stmt.where(m.Issue.student_id == student_for_user(db, user).id)
    if status:
        stmt = stmt.where(m.Renewal.status == status)
    return [renewal_out(r) for r in db.scalars(stmt.order_by(m.Renewal.id.desc()))]


@router.post("/{renewal_id}/approve")
def approve(renewal_id: int, body: DecisionIn | None = None, db: Session = Depends(get_db),
            user: m.User = Depends(coordinator_only)):
    r = loans.decide_renewal(db, renewal_id=renewal_id, approve=True, user=user,
                             remarks=body.remarks if body else None)
    return renewal_out(r)


@router.post("/{renewal_id}/reject")
def reject(renewal_id: int, body: DecisionIn | None = None, db: Session = Depends(get_db),
           user: m.User = Depends(coordinator_only)):
    r = loans.decide_renewal(db, renewal_id=renewal_id, approve=False, user=user,
                             remarks=body.remarks if body else None)
    return renewal_out(r)
