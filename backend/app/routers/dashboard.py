from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app import models as m
from app.db.session import get_db
from app.deps import staff_or_coordinator
from app.serializers import issue_out
from app.services import loans

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
def summary(db: Session = Depends(get_db), _: m.User = Depends(staff_or_coordinator)):
    loans.refresh_overdue(db)
    total = db.scalar(select(func.coalesce(func.sum(m.InventoryItem.total_quantity), 0)))
    available = db.scalar(select(func.coalesce(func.sum(m.InventoryItem.available_quantity), 0)))
    issued = db.scalar(
        select(func.coalesce(func.sum(m.IssueItem.quantity_issued - m.IssueItem.quantity_returned), 0))
        .join(m.Issue).where(m.Issue.status.in_(["active", "overdue"])))
    overdue = db.scalar(select(func.count()).select_from(m.Issue).where(m.Issue.status == "overdue"))
    damaged = db.scalar(select(func.count()).select_from(m.Asset)
                        .where(m.Asset.status.in_(["damaged", "maintenance", "lost"])))
    pending = db.scalar(select(func.count()).select_from(m.Renewal).where(m.Renewal.status == "pending"))
    return {"total_inventory": int(total), "available": int(available), "issued": int(issued),
            "overdue": int(overdue), "damaged": int(damaged), "pending_renewals": int(pending)}


@router.get("/overdue")
def overdue(upcoming_days: int = 3, db: Session = Depends(get_db),
            _: m.User = Depends(staff_or_coordinator)):
    loans.refresh_overdue(db)
    rows = [issue_out(i) for i in db.scalars(
        select(m.Issue).where(m.Issue.status.in_(["active", "overdue"])).order_by(m.Issue.due_date))]
    return {"overdue": [r for r in rows if r["status"] == "overdue"],
            "upcoming_due": [r for r in rows if r["status"] == "active"
                             and r["days_remaining"] is not None and r["days_remaining"] <= upcoming_days]}
