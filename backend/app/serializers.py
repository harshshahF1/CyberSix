"""Plain-dict serializers shared by routers (keeps response shapes consistent)."""
from app import models as m
from app.core.clock import now


def user_out(u: m.User) -> dict:
    return {"id": u.id, "name": u.name, "email": u.email, "role": u.role,
            "created_at": u.created_at}


def student_out(s: m.Student) -> dict:
    return {"id": s.id, "user_id": s.user_id, "name": s.user.name, "email": s.user.email,
            "enrolment_number": s.enrolment_number, "programme": s.programme,
            "semester": s.semester, "contact_details": s.contact_details,
            "registration_status": s.registration_status}


def item_out(i: m.InventoryItem) -> dict:
    return {"id": i.id, "item_code": i.item_code, "name": i.name, "category": i.category,
            "description": i.description, "make": i.make, "model": i.model,
            "tracking_type": i.tracking_type, "total_quantity": i.total_quantity,
            "available_quantity": i.available_quantity,
            "created_at": i.created_at, "updated_at": i.updated_at}


def asset_out(a: m.Asset) -> dict:
    loc = a.location
    return {"id": a.id, "asset_tag": a.asset_tag, "item_id": a.item_id, "item_name": a.item.name,
            "serial_number": a.serial_number, "location_id": a.location_id,
            "laboratory": loc.laboratory if loc else None,
            "condition": a.condition, "status": a.status,
            "created_at": a.created_at, "updated_at": a.updated_at}


def issue_out(i: m.Issue) -> dict:
    days_left = (i.due_date.date() - now().date()).days
    open_ = i.status in ("active", "overdue")
    return {
        "id": i.id, "issue_number": i.issue_number, "student_id": i.student_id,
        "student_name": i.student.user.name, "enrolment_number": i.student.enrolment_number,
        "issue_date": i.issue_date, "due_date": i.due_date, "purpose": i.purpose,
        "issued_by": i.issued_by, "status": i.status, "created_at": i.created_at,
        "days_remaining": days_left if open_ else None,
        "days_overdue": -days_left if open_ and days_left < 0 else 0,
        "items": [{
            "id": x.id, "item_id": x.item_id, "item_name": x.item.name,
            "item_code": x.item.item_code, "asset_id": x.asset_id,
            "asset_tag": x.asset.asset_tag if x.asset else None,
            "quantity_issued": x.quantity_issued, "quantity_returned": x.quantity_returned,
            "outstanding": x.quantity_issued - x.quantity_returned, "status": x.status,
        } for x in i.items],
    }


def renewal_out(r: m.Renewal) -> dict:
    return {"id": r.id, "issue_id": r.issue_id, "issue_number": r.issue.issue_number,
            "student_name": r.issue.student.user.name,
            "enrolment_number": r.issue.student.enrolment_number,
            "requested_at": r.requested_at, "status": r.status,
            "previous_due_date": r.previous_due_date, "revised_due_date": r.revised_due_date,
            "approved_by": r.approved_by, "decision_at": r.decision_at, "remarks": r.remarks}
