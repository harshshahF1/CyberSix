import csv
import io

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models as m
from app.core.clock import now
from app.db.session import get_db
from app.deps import coordinator_only, staff_or_coordinator
from app.serializers import item_out
from app.services import loans
from app.services.audit import log

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/inventory")
def inventory_report(db: Session = Depends(get_db), _: m.User = Depends(staff_or_coordinator)):
    rows = []
    for i in db.scalars(select(m.InventoryItem).order_by(m.InventoryItem.name)):
        d = item_out(i)
        d["issued_quantity"] = d["total_quantity"] - d["available_quantity"]
        rows.append(d)
    return rows


def _csv(headers, rows) -> StreamingResponse:
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(headers)
    w.writerows(rows)
    name = f"inventorytrack_{now():%Y%m%d_%H%M}.csv"
    return StreamingResponse(iter([buf.getvalue()]), media_type="text/csv",
                             headers={"Content-Disposition": f'attachment; filename="{name}"'})


@router.get("/export")
def export(report: str = "inventory", db: Session = Depends(get_db),
           user: m.User = Depends(coordinator_only)):
    loans.refresh_overdue(db)
    if report == "inventory":
        resp = _csv(["item_code", "name", "category", "tracking_type", "total", "available"],
                    [[i.item_code, i.name, i.category, i.tracking_type, i.total_quantity,
                      i.available_quantity] for i in db.scalars(select(m.InventoryItem))])
    elif report == "issues":
        rows = []
        for it in db.scalars(select(m.IssueItem).join(m.Issue).order_by(m.Issue.id)):
            iss = it.issue
            rows.append([iss.issue_number, iss.student.enrolment_number, iss.student.user.name,
                         it.item.name, it.asset.asset_tag if it.asset else "", it.quantity_issued,
                         it.quantity_returned, iss.issue_date, iss.due_date, iss.status])
        resp = _csv(["issue_number", "enrolment", "student", "item", "asset_tag", "issued",
                     "returned", "issue_date", "due_date", "status"], rows)
    elif report == "audit":
        resp = _csv(["id", "timestamp", "user_id", "action", "entity_type", "entity_id", "details"],
                    [[a.id, a.timestamp, a.user_id, a.action, a.entity_type, a.entity_id, a.details]
                     for a in db.scalars(select(m.AuditLog).order_by(m.AuditLog.id))])
    else:
        raise HTTPException(400, "report must be one of: inventory, issues, audit")
    log(db, user.id, "REPORT_EXPORTED", "Report", None, {"report": report})
    db.commit()
    return resp


@router.get("/audit")
def audit_log(limit: int = 200, db: Session = Depends(get_db), _: m.User = Depends(coordinator_only)):
    rows = db.scalars(select(m.AuditLog).order_by(m.AuditLog.id.desc()).limit(limit))
    return [{"id": a.id, "timestamp": a.timestamp, "user_id": a.user_id, "action": a.action,
             "entity_type": a.entity_type, "entity_id": a.entity_id, "details": a.details}
            for a in rows]
