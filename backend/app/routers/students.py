from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app import models as m
from app.core.security import hash_password
from app.db.session import get_db
from app.deps import coordinator_only, get_current_user, staff_or_coordinator
from app.serializers import student_out
from app.services.audit import log

router = APIRouter(prefix="/api/students", tags=["students"])


class StudentIn(BaseModel):
    name: str
    email: EmailStr
    password: str
    enrolment_number: str
    programme: str = "M.Sc. DFIS"
    semester: int = 1
    contact_details: str | None = None
    registration_status: str = "registered"


@router.get("")
def list_students(q: str | None = None, db: Session = Depends(get_db),
                  _: m.User = Depends(staff_or_coordinator)):
    stmt = select(m.Student).join(m.User)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(m.User.name.ilike(like), m.Student.enrolment_number.ilike(like)))
    return [student_out(s) for s in db.scalars(stmt.order_by(m.Student.id))]


@router.post("", status_code=201)
def create_student(body: StudentIn, db: Session = Depends(get_db),
                   user: m.User = Depends(coordinator_only)):
    if db.scalar(select(m.User).where(m.User.email == body.email.lower())):
        raise HTTPException(409, "Email already registered")
    if db.scalar(select(m.Student).where(m.Student.enrolment_number == body.enrolment_number)):
        raise HTTPException(409, "Enrolment number already registered")
    u = m.User(name=body.name, email=body.email.lower(), role="student",
               password_hash=hash_password(body.password))
    db.add(u)
    db.flush()
    s = m.Student(user_id=u.id, enrolment_number=body.enrolment_number, programme=body.programme,
                  semester=body.semester, contact_details=body.contact_details,
                  registration_status=body.registration_status)
    db.add(s)
    db.flush()
    log(db, user.id, "STUDENT_CREATED", "Student", s.id, {"enrolment_number": s.enrolment_number})
    db.commit()
    return student_out(s)


@router.get("/{student_id}")
def get_student(student_id: int, db: Session = Depends(get_db),
                user: m.User = Depends(get_current_user)):
    s = db.get(m.Student, student_id)
    if not s:
        raise HTTPException(404, "Student not found")
    if user.role == "student" and s.user_id != user.id:
        raise HTTPException(403, "Not allowed")
    return student_out(s)
