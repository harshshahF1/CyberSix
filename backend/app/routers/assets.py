from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models as m
from app.db.session import get_db
from app.deps import coordinator_only, staff_or_coordinator
from app.serializers import asset_out
from app.services.audit import log
from app.services.inventory import recompute_counts

router = APIRouter(tags=["assets"])

CONDITIONS = {"usable", "damaged", "maintenance"}
STATUSES = {"available", "issued", "damaged", "lost", "maintenance", "retired"}


class AssetIn(BaseModel):
    asset_tag: str
    item_id: int
    serial_number: str | None = None
    location_id: int | None = None
    condition: str = "usable"
    status: str = "available"


class AssetPatch(BaseModel):
    serial_number: str | None = None
    location_id: int | None = None
    condition: str | None = None
    status: str | None = None


class LocationIn(BaseModel):
    department: str
    laboratory: str
    room: str | None = None
    cupboard: str | None = None
    description: str | None = None


@router.get("/api/assets")
def list_assets(item_id: int | None = None, status: str | None = None, condition: str | None = None,
                laboratory: str | None = None, q: str | None = None,
                db: Session = Depends(get_db), _: m.User = Depends(staff_or_coordinator)):
    stmt = select(m.Asset).outerjoin(m.Location)
    if item_id:
        stmt = stmt.where(m.Asset.item_id == item_id)
    if status:
        stmt = stmt.where(m.Asset.status == status)
    if condition:
        stmt = stmt.where(m.Asset.condition == condition)
    if laboratory:
        stmt = stmt.where(m.Location.laboratory == laboratory)
    if q:
        stmt = stmt.where(m.Asset.asset_tag.ilike(f"%{q}%"))
    return [asset_out(a) for a in db.scalars(stmt.order_by(m.Asset.asset_tag))]


@router.post("/api/assets", status_code=201)
def create_asset(body: AssetIn, db: Session = Depends(get_db), user: m.User = Depends(coordinator_only)):
    if body.condition not in CONDITIONS or body.status not in STATUSES:
        raise HTTPException(400, "Invalid condition or status")
    if body.status == "issued":
        raise HTTPException(400, "Assets can only become 'issued' through the issue workflow")
    item = db.get(m.InventoryItem, body.item_id)
    if not item or item.tracking_type != "individual":
        raise HTTPException(400, "item_id must reference an individually tracked item")
    if db.scalar(select(m.Asset).where(m.Asset.asset_tag == body.asset_tag)):
        raise HTTPException(409, "asset_tag already exists")
    a = m.Asset(**body.model_dump())
    db.add(a)
    recompute_counts(db, item)
    log(db, user.id, "ASSET_CREATED", "Asset", None, {"asset_tag": body.asset_tag})
    db.commit()
    return asset_out(a)


@router.patch("/api/assets/{asset_id}")
def patch_asset(asset_id: int, body: AssetPatch, db: Session = Depends(get_db),
                user: m.User = Depends(coordinator_only)):
    a = db.get(m.Asset, asset_id)
    if not a:
        raise HTTPException(404, "Asset not found")
    data = body.model_dump(exclude_unset=True)
    if "condition" in data and data["condition"] not in CONDITIONS:
        raise HTTPException(400, "Invalid condition")
    if "status" in data:
        if data["status"] not in STATUSES:
            raise HTTPException(400, "Invalid status")
        if data["status"] == "issued" or a.status == "issued":
            raise HTTPException(409, "Issued status is managed by the issue/return workflow")
    for k, v in data.items():
        setattr(a, k, v)
    recompute_counts(db, a.item)
    log(db, user.id, "ASSET_UPDATED", "Asset", a.id, data)
    db.commit()
    return asset_out(a)


@router.get("/api/locations")
def list_locations(db: Session = Depends(get_db), _: m.User = Depends(staff_or_coordinator)):
    return [{"id": l.id, "department": l.department, "laboratory": l.laboratory, "room": l.room,
             "cupboard": l.cupboard, "description": l.description}
            for l in db.scalars(select(m.Location))]


@router.post("/api/locations", status_code=201)
def create_location(body: LocationIn, db: Session = Depends(get_db),
                    user: m.User = Depends(coordinator_only)):
    loc = m.Location(**body.model_dump())
    db.add(loc)
    db.flush()
    log(db, user.id, "LOCATION_CREATED", "Location", loc.id, body.model_dump())
    db.commit()
    return {"id": loc.id, **body.model_dump()}
