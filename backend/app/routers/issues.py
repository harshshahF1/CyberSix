from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models as m
from app.db.session import get_db
from app.deps import get_current_user, staff_or_coordinator, student_for_user
from app.serializers import issue_out
from app.services import loans

router = APIRouter(prefix="/api/issues", tags=["issues"])


class IssueIn(BaseModel):
    student_id: int
    item_id: int
    asset_id: int | None = None
    quantity: int = 1
    purpose: str | None = None
    # optional extensions (contract-compatible): add to an existing issue / backdate
    issue_id: int | None = None
    issue_date: datetime | None = None


@router.get("")
def list_issues(status: str | None = None, student_id: int | None = None,
                db: Session = Depends(get_db), user: m.User = Depends(get_current_user)):
    loans.refresh_overdue(db)
    stmt = select(m.Issue)
    if user.role == "student":
        stmt = stmt.where(m.Issue.student_id == student_for_user(db, user).id)
    elif student_id:
        stmt = stmt.where(m.Issue.student_id == student_id)
    if status:
        stmt = stmt.where(m.Issue.status == status)
    return [issue_out(i) for i in db.scalars(stmt.order_by(m.Issue.id.desc()))]


@router.post("", status_code=201)
def create_issue(body: IssueIn, db: Session = Depends(get_db),
                 user: m.User = Depends(staff_or_coordinator)):
    issue = loans.issue_item(db, student_id=body.student_id, item_id=body.item_id,
                             asset_id=body.asset_id, quantity=body.quantity, purpose=body.purpose,
                             issued_by=user.id, issue_id=body.issue_id, issue_date=body.issue_date)
    return issue_out(issue)


@router.get("/{issue_id}/acknowledgement")
def acknowledgement(issue_id: int, db: Session = Depends(get_db),
                    user: m.User = Depends(get_current_user)):
    issue = db.get(m.Issue, issue_id)
    if not issue:
        raise HTTPException(404, "Issue not found")
    if user.role == "student" and issue.student_id != student_for_user(db, user).id:
        raise HTTPException(403, "Not allowed")
    issuer = db.get(m.User, issue.issued_by)
    data = issue_out(issue)
    data.update({
        "programme": issue.student.programme, "semester": issue.student.semester,
        "issued_by_name": issuer.name if issuer else None,
        "statement": "I acknowledge receipt of the above item(s) in working condition and agree "
                     "to return them on or before the due date.",
    })
    return data
