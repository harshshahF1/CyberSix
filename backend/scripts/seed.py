"""Seed M.Sc. DFIS Semester I demo data.  Run:  python -m scripts.seed"""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models as m
from app.core.security import hash_password
from app.db.session import Base, SessionLocal, engine
from app.services.inventory import recompute_counts


def seed(db: Session) -> None:
    if db.scalar(select(m.User).where(m.User.email == "coordinator@inventorytrack.edu")):
        return
    db.add(m.User(name="Lab Coordinator", email="coordinator@inventorytrack.edu",
                  password_hash=hash_password("Coord@123"), role="coordinator"))
    u = m.User(name="Demo Student", email="student1@inventorytrack.edu",
               password_hash=hash_password("Student@123"), role="student")
    db.add(u)
    db.flush()
    db.add(m.Student(user_id=u.id, enrolment_number="DFIS2026001", programme="M.Sc. DFIS",
                     semester=1, contact_details="+91-9000000001", registration_status="registered"))
    loc = m.Location(department="Digital Forensics & Information Security",
                     laboratory="DFIS Lab 1", room="Room 101", cupboard="Cupboard A",
                     description="Semester I hardware cupboard")
    db.add(loc)
    db.flush()

    boards = m.InventoryItem(item_code="DEVBOARD", name="Development Board", category="Electronics",
                             description="Microcontroller development board", make="Generic",
                             model="DB-v1", tracking_type="individual")
    cables = m.InventoryItem(item_code="USBCABLE", name="USB Cable", category="Accessories",
                             description="USB Type-A to Micro-B", make="Generic", model="UC-1",
                             tracking_type="quantity", total_quantity=20, available_quantity=20)
    db.add_all([boards, cables])
    db.flush()
    for n in range(1, 11):
        db.add(m.Asset(asset_tag=f"DB-{n:02d}", item_id=boards.id, serial_number=f"SN-DB-{n:04d}",
                       location_id=loc.id, condition="usable", status="available"))
    recompute_counts(db, boards)
    db.commit()


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as s:
        seed(s)
    print("Seed complete.\n coordinator@inventorytrack.edu / Coord@123\n"
          " student1@inventorytrack.edu / Student@123 (DFIS2026001)")
