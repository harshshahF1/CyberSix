"""Atomic business logic for issuing, returning and renewing items."""
from datetime import datetime, timedelta

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app import models as m
from app.core.clock import now
from app.core.config import settings
from app.services.audit import log
from app.services.inventory import recompute_counts

RETURN_CONDITIONS = {"usable", "damaged", "maintenance", "lost"}
ASSET_STATUS_ON_RETURN = {"usable": "available", "damaged": "damaged",
                          "maintenance": "maintenance", "lost": "lost"}


def _next_issue_number(db: Session, when: datetime) -> str:
    prefix = f"ISS-{when:%Y%m%d}-"
    count = db.scalar(select(func.count()).select_from(m.Issue)
                      .where(m.Issue.issue_number.like(prefix + "%"))) or 0
    return f"{prefix}{count + 1:04d}"


def refresh_overdue(db: Session) -> None:
    """Sync issue.status with due dates (active <-> overdue)."""
    n = now()
    for issue in db.scalars(select(m.Issue).where(m.Issue.status.in_(["active", "overdue"]))):
        wanted = "overdue" if issue.due_date < n else "active"
        if issue.status != wanted:
            issue.status = wanted
    db.commit()


# ---------------------------------------------------------------- issuing
def issue_item(db: Session, *, student_id: int, item_id: int, asset_id: int | None,
               quantity: int, purpose: str | None, issued_by: int,
               issue_id: int | None = None, issue_date: datetime | None = None) -> m.Issue:
    try:
        if quantity < 1:
            raise HTTPException(400, "Quantity must be at least 1")

        student = db.get(m.Student, student_id)
        if not student:
            raise HTTPException(404, "Student not found")
        if student.registration_status != "registered":
            raise HTTPException(409, "Student is not registered; items cannot be issued")

        item = db.scalar(select(m.InventoryItem).where(m.InventoryItem.id == item_id).with_for_update())
        if not item:
            raise HTTPException(404, "Inventory item not found")

        asset = None
        if item.tracking_type == "individual":
            if asset_id is None:
                raise HTTPException(400, "asset_id is required for individually tracked items")
            if quantity != 1:
                raise HTTPException(400, "Individually tracked assets are issued one at a time")
            asset = db.scalar(select(m.Asset).where(m.Asset.id == asset_id).with_for_update())
            if not asset or asset.item_id != item.id:
                raise HTTPException(404, "Asset not found for this item")
            if asset.status != "available" or asset.condition != "usable":
                raise HTTPException(409, f"Asset {asset.asset_tag} is not available "
                                         f"(status={asset.status}, condition={asset.condition})")
            asset.status = "issued"
            recompute_counts(db, item)
        else:
            if quantity > item.available_quantity:
                raise HTTPException(409, f"Insufficient stock: requested {quantity}, "
                                         f"available {item.available_quantity}")
            item.available_quantity -= quantity

        when = issue_date or now()
        if issue_id:
            issue = db.get(m.Issue, issue_id)
            if not issue or issue.student_id != student_id:
                raise HTTPException(404, "Issue not found for this student")
            if issue.status == "returned":
                raise HTTPException(409, "Cannot add items to a closed issue")
        else:
            issue = m.Issue(issue_number=_next_issue_number(db, when), student_id=student_id,
                            issue_date=when, due_date=when + timedelta(days=settings.LOAN_PERIOD_DAYS),
                            purpose=purpose, issued_by=issued_by, status="active")
            db.add(issue)
            db.flush()

        ii = m.IssueItem(issue_id=issue.id, item_id=item.id, asset_id=asset.id if asset else None,
                         quantity_issued=quantity, quantity_returned=0, status="issued")
        db.add(ii)
        db.add(m.StockTransaction(item_id=item.id, asset_id=asset.id if asset else None,
                                  transaction_type="issue", quantity_delta=-quantity,
                                  reason=f"Issued on {issue.issue_number}", performed_by=issued_by))
        db.flush()
        log(db, issued_by, "ISSUE_ITEM", "Issue", issue.id,
            {"issue_number": issue.issue_number, "item": item.item_code,
             "asset": asset.asset_tag if asset else None, "quantity": quantity,
             "due_date": issue.due_date})
        db.commit()
        return issue
    except Exception:
        db.rollback()
        raise


# ---------------------------------------------------------------- returns
def return_item(db: Session, *, issue_item_id: int, quantity_returned: int,
                condition: str, remarks: str | None, received_by: int) -> m.Return:
    try:
        if condition not in RETURN_CONDITIONS:
            raise HTTPException(400, f"condition must be one of {sorted(RETURN_CONDITIONS)}")
        ii = db.scalar(select(m.IssueItem).where(m.IssueItem.id == issue_item_id).with_for_update())
        if not ii:
            raise HTTPException(404, "Issue item not found")
        outstanding = ii.quantity_issued - ii.quantity_returned
        if quantity_returned < 1 or quantity_returned > outstanding:
            raise HTTPException(400, f"Return quantity must be between 1 and {outstanding}")

        item = db.get(m.InventoryItem, ii.item_id)
        if item.tracking_type == "individual":
            asset = db.get(m.Asset, ii.asset_id)
            asset.status = ASSET_STATUS_ON_RETURN[condition]
            asset.condition = "usable" if condition == "usable" else (
                "maintenance" if condition == "maintenance" else "damaged")
            recompute_counts(db, item)
        else:
            if condition == "usable":
                item.available_quantity += quantity_returned
            elif condition == "lost":
                item.total_quantity -= quantity_returned
            # damaged / maintenance stay in total but are NOT returned to available stock

        ret = m.Return(issue_item_id=ii.id, return_date=now(), quantity=quantity_returned,
                       condition_on_return=condition, received_by=received_by, remarks=remarks)
        db.add(ret)
        ii.quantity_returned += quantity_returned
        ii.status = "returned" if ii.quantity_returned == ii.quantity_issued else "partial"

        issue = db.get(m.Issue, ii.issue_id)
        db.flush()
        if all(i.status == "returned" for i in issue.items):
            issue.status = "returned"
        db.add(m.StockTransaction(
            item_id=item.id, asset_id=ii.asset_id, transaction_type=f"return_{condition}",
            quantity_delta=quantity_returned if condition == "usable" else 0,
            reason=remarks, performed_by=received_by))
        db.flush()
        log(db, received_by, "RETURN_ITEM", "IssueItem", ii.id,
            {"issue_number": issue.issue_number, "quantity": quantity_returned,
             "condition": condition, "remarks": remarks})
        db.commit()
        return ret
    except Exception:
        db.rollback()
        raise


# ---------------------------------------------------------------- renewals
def request_renewal(db: Session, *, issue_id: int, user: m.User) -> m.Renewal:
    try:
        issue = db.get(m.Issue, issue_id)
        if not issue:
            raise HTTPException(404, "Issue not found")
        if user.role == "student":
            student = db.scalar(select(m.Student).where(m.Student.user_id == user.id))
            if not student or student.id != issue.student_id:
                raise HTTPException(403, "You can only renew your own borrowings")
        if issue.status not in ("active", "overdue"):
            raise HTTPException(409, "Only open issues can be renewed")
        pending = db.scalar(select(m.Renewal).where(
            m.Renewal.issue_id == issue_id, m.Renewal.status == "pending"))
        if pending:
            raise HTTPException(409, "A renewal request is already pending for this issue")
        r = m.Renewal(issue_id=issue_id, requested_at=now(), status="pending",
                      previous_due_date=issue.due_date)  # due date is NOT changed here
        db.add(r)
        db.flush()
        log(db, user.id, "RENEWAL_REQUESTED", "Renewal", r.id,
            {"issue_number": issue.issue_number, "current_due_date": issue.due_date})
        db.commit()
        return r
    except Exception:
        db.rollback()
        raise


def decide_renewal(db: Session, *, renewal_id: int, approve: bool,
                   user: m.User, remarks: str | None) -> m.Renewal:
    try:
        r = db.scalar(select(m.Renewal).where(m.Renewal.id == renewal_id).with_for_update())
        if not r:
            raise HTTPException(404, "Renewal not found")
        if r.status != "pending":
            raise HTTPException(409, f"Renewal already {r.status}")
        issue = db.get(m.Issue, r.issue_id)
        r.decision_at = now()
        r.approved_by = user.id
        r.remarks = remarks
        if approve:
            r.previous_due_date = issue.due_date
            r.revised_due_date = issue.due_date + timedelta(days=settings.LOAN_PERIOD_DAYS)
            issue.due_date = r.revised_due_date
            issue.status = "overdue" if issue.due_date < now() else "active"
            r.status = "approved"
        else:
            r.status = "rejected"
        db.flush()
        log(db, user.id, "RENEWAL_APPROVED" if approve else "RENEWAL_REJECTED", "Renewal", r.id,
            {"issue_number": issue.issue_number, "previous_due_date": r.previous_due_date,
             "revised_due_date": r.revised_due_date, "remarks": remarks})
        db.commit()
        return r
    except Exception:
        db.rollback()
        raise
