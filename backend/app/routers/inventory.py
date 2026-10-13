from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app import models as m
from app.db.session import get_db
from app.deps import coordinator_only, staff_or_coordinator
from app.serializers import asset_out, item_out
from app.services.audit import log

router = APIRouter(prefix="/api/inventory", tags=["inventory"])


class ItemIn(BaseModel):
    item_code: str
    name: str
    category: str
    description: str | None = None
    make: str | None = None
    model: str | None = None
    tracking_type: str  # individual | quantity
    total_quantity: int = 0


@router.get("")
def list_items(q: str | None = None, category: str | None = None,
               tracking_type: str | None = None, db: Session = Depends(get_db),
               _: m.User = Depends(staff_or_coordinator)):
    stmt = select(m.InventoryItem)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(m.InventoryItem.name.ilike(like), m.InventoryItem.item_code.ilike(like)))
    if category:
        stmt = stmt.where(m.InventoryItem.category == category)
    if tracking_type:
        stmt = stmt.where(m.InventoryItem.tracking_type == tracking_type)
    return [item_out(i) for i in db.scalars(stmt.order_by(m.InventoryItem.name))]


@router.post("", status_code=201)
def create_item(body: ItemIn, db: Session = Depends(get_db), user: m.User = Depends(coordinator_only)):
    if body.tracking_type not in ("individual", "quantity"):
        raise HTTPException(400, "tracking_type must be 'individual' or 'quantity'")
    if body.total_quantity < 0:
        raise HTTPException(400, "total_quantity cannot be negative")
    if db.scalar(select(m.InventoryItem).where(m.InventoryItem.item_code == body.item_code)):
        raise HTTPException(409, "item_code already exists")
    qty = body.total_quantity if body.tracking_type == "quantity" else 0  # assets drive individual counts
    item = m.InventoryItem(**body.model_dump(exclude={"total_quantity"}),
                           total_quantity=qty, available_quantity=qty)
    db.add(item)
    db.flush()
    log(db, user.id, "ITEM_CREATED", "InventoryItem", item.id, {"item_code": item.item_code})
    db.commit()
    return item_out(item)


@router.get("/{item_id}/availability")
def availability(item_id: int, db: Session = Depends(get_db), _: m.User = Depends(staff_or_coordinator)):
    item = db.get(m.InventoryItem, item_id)
    if not item:
        raise HTTPException(404, "Item not found")
    available_assets = []
    if item.tracking_type == "individual":
        rows = db.scalars(select(m.Asset).where(m.Asset.item_id == item.id,
                                                m.Asset.status == "available",
                                                m.Asset.condition == "usable").order_by(m.Asset.asset_tag))
        available_assets = [asset_out(a) for a in rows]
    return {"item_id": item.id, "item_code": item.item_code, "name": item.name,
            "tracking_type": item.tracking_type, "total_quantity": item.total_quantity,
            "available_quantity": item.available_quantity, "available_assets": available_assets}
