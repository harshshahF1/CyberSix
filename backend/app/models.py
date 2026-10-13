"""Database models. Column names follow the unified data contract exactly."""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.clock import now
from app.db.session import Base


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(200))
    role: Mapped[str] = mapped_column(String(20))  # coordinator | student | staff
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)


class Student(Base):
    __tablename__ = "students"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    enrolment_number: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    programme: Mapped[str] = mapped_column(String(120))
    semester: Mapped[int] = mapped_column(Integer)
    contact_details: Mapped[str | None] = mapped_column(String(200), nullable=True)
    registration_status: Mapped[str] = mapped_column(String(20), default="registered")
    user: Mapped[User] = relationship()


class Location(Base):
    __tablename__ = "locations"
    id: Mapped[int] = mapped_column(primary_key=True)
    department: Mapped[str] = mapped_column(String(120))
    laboratory: Mapped[str] = mapped_column(String(120))
    room: Mapped[str | None] = mapped_column(String(60), nullable=True)
    cupboard: Mapped[str | None] = mapped_column(String(60), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)


class InventoryItem(Base):
    __tablename__ = "inventory_items"
    id: Mapped[int] = mapped_column(primary_key=True)
    item_code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(150))
    category: Mapped[str] = mapped_column(String(80))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    make: Mapped[str | None] = mapped_column(String(80), nullable=True)
    model: Mapped[str | None] = mapped_column(String(80), nullable=True)
    tracking_type: Mapped[str] = mapped_column(String(20))  # individual | quantity
    total_quantity: Mapped[int] = mapped_column(Integer, default=0)
    available_quantity: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=now, onupdate=now)
    assets: Mapped[list["Asset"]] = relationship(back_populates="item")


class Asset(Base):
    __tablename__ = "assets"
    id: Mapped[int] = mapped_column(primary_key=True)
    asset_tag: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("inventory_items.id"))
    serial_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    location_id: Mapped[int | None] = mapped_column(ForeignKey("locations.id"), nullable=True)
    condition: Mapped[str] = mapped_column(String(20), default="usable")
    status: Mapped[str] = mapped_column(String(20), default="available")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=now, onupdate=now)
    item: Mapped[InventoryItem] = relationship(back_populates="assets")
    location: Mapped[Location | None] = relationship()


class Issue(Base):
    __tablename__ = "issues"
    id: Mapped[int] = mapped_column(primary_key=True)
    issue_number: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"))
    issue_date: Mapped[datetime] = mapped_column(DateTime)
    due_date: Mapped[datetime] = mapped_column(DateTime)
    purpose: Mapped[str | None] = mapped_column(Text, nullable=True)
    issued_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    status: Mapped[str] = mapped_column(String(20), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    student: Mapped[Student] = relationship()
    items: Mapped[list["IssueItem"]] = relationship(back_populates="issue")
    renewals: Mapped[list["Renewal"]] = relationship(back_populates="issue")


class IssueItem(Base):
    __tablename__ = "issue_items"
    id: Mapped[int] = mapped_column(primary_key=True)
    issue_id: Mapped[int] = mapped_column(ForeignKey("issues.id"))
    item_id: Mapped[int] = mapped_column(ForeignKey("inventory_items.id"))
    asset_id: Mapped[int | None] = mapped_column(ForeignKey("assets.id"), nullable=True)
    quantity_issued: Mapped[int] = mapped_column(Integer)
    quantity_returned: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(20), default="issued")  # issued|partial|returned
    issue: Mapped[Issue] = relationship(back_populates="items")
    item: Mapped[InventoryItem] = relationship()
    asset: Mapped[Asset | None] = relationship()
    returns: Mapped[list["Return"]] = relationship(back_populates="issue_item")


class Return(Base):
    __tablename__ = "returns"
    id: Mapped[int] = mapped_column(primary_key=True)
    issue_item_id: Mapped[int] = mapped_column(ForeignKey("issue_items.id"))
    return_date: Mapped[datetime] = mapped_column(DateTime, default=now)
    quantity: Mapped[int] = mapped_column(Integer)
    condition_on_return: Mapped[str] = mapped_column(String(20))
    received_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    issue_item: Mapped[IssueItem] = relationship(back_populates="returns")


class Renewal(Base):
    __tablename__ = "renewals"
    id: Mapped[int] = mapped_column(primary_key=True)
    issue_id: Mapped[int] = mapped_column(ForeignKey("issues.id"))
    requested_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    previous_due_date: Mapped[datetime] = mapped_column(DateTime)
    revised_due_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    approved_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    decision_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    issue: Mapped[Issue] = relationship(back_populates="renewals")


class StockTransaction(Base):
    __tablename__ = "stock_transactions"
    id: Mapped[int] = mapped_column(primary_key=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("inventory_items.id"))
    asset_id: Mapped[int | None] = mapped_column(ForeignKey("assets.id"), nullable=True)
    transaction_type: Mapped[str] = mapped_column(String(30))
    quantity_delta: Mapped[int] = mapped_column(Integer)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    performed_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    action: Mapped[str] = mapped_column(String(60))
    entity_type: Mapped[str] = mapped_column(String(60))
    entity_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=now)
