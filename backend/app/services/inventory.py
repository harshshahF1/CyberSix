from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app import models as m


def recompute_counts(db: Session, item: m.InventoryItem) -> None:
    """For individually tracked items, totals are derived from asset rows."""
    if item.tracking_type != "individual":
        return
    db.flush()
    base = select(func.count()).select_from(m.Asset).where(m.Asset.item_id == item.id)
    item.total_quantity = db.scalar(base.where(m.Asset.status != "retired")) or 0
    item.available_quantity = db.scalar(base.where(m.Asset.status == "available")) or 0
