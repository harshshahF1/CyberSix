from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app import models as m
from app.db.session import get_db
from app.deps import staff_or_coordinator
from app.services import loans

router = APIRouter(prefix="/api/returns", tags=["returns"])


class ReturnIn(BaseModel):
    issue_item_id: int
    quantity_returned: int
    condition: str  # usable | damaged | maintenance | lost
    remarks: str | None = None


@router.post("", status_code=201)
def create_return(body: ReturnIn, db: Session = Depends(get_db),
                  user: m.User = Depends(staff_or_coordinator)):
    r = loans.return_item(db, issue_item_id=body.issue_item_id,
                          quantity_returned=body.quantity_returned, condition=body.condition,
                          remarks=body.remarks, received_by=user.id)
    ii = db.get(m.IssueItem, r.issue_item_id)
    return {"id": r.id, "issue_item_id": r.issue_item_id, "quantity": r.quantity,
            "condition_on_return": r.condition_on_return, "return_date": r.return_date,
            "remarks": r.remarks, "quantity_issued": ii.quantity_issued,
            "quantity_returned_total": ii.quantity_returned,
            "outstanding": ii.quantity_issued - ii.quantity_returned,
            "issue_item_status": ii.status}
