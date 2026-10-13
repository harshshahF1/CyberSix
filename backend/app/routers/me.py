from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models as m
from app.db.session import get_db
from app.deps import require_roles, student_for_user
from app.serializers import issue_out, renewal_out, student_out
from app.services import loans

router = APIRouter(prefix="/api/me", tags=["student-portal"])
student_only = require_roles("student")


@router.get("/profile")
def profile(db: Session = Depends(get_db), user: m.User = Depends(student_only)):
    return student_out(student_for_user(db, user))


@router.get("/borrowings")
def borrowings(db: Session = Depends(get_db), user: m.User = Depends(student_only)):
    loans.refresh_overdue(db)
    st = student_for_user(db, user)
    rows = db.scalars(select(m.Issue).where(m.Issue.student_id == st.id,
                                            m.Issue.status.in_(["active", "overdue"]))
                      .order_by(m.Issue.due_date))
    return [issue_out(i) for i in rows]


@router.get("/history")
def history(db: Session = Depends(get_db), user: m.User = Depends(student_only)):
    st = student_for_user(db, user)
    out = []
    for i in db.scalars(select(m.Issue).where(m.Issue.student_id == st.id).order_by(m.Issue.id.desc())):
        d = issue_out(i)
        d["returns"] = [{"issue_item_id": r.issue_item_id, "quantity": r.quantity,
                         "condition_on_return": r.condition_on_return, "return_date": r.return_date,
                         "remarks": r.remarks}
                        for ii in i.items for r in ii.returns]
        out.append(d)
    return out


@router.get("/renewals")
def my_renewals(db: Session = Depends(get_db), user: m.User = Depends(student_only)):
    st = student_for_user(db, user)
    rows = db.scalars(select(m.Renewal).join(m.Issue).where(m.Issue.student_id == st.id)
                      .order_by(m.Renewal.id.desc()))
    return [renewal_out(r) for r in rows]
