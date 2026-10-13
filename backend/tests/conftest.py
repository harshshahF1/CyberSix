import os
from datetime import datetime

os.environ["DATABASE_URL"] = "sqlite:///./test_inventorytrack.db"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.core import clock  # noqa: E402
from app.db.session import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from scripts.seed import seed  # noqa: E402


@pytest.fixture()
def client():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as s:
        seed(s)
    clock.set_now(datetime(2026, 10, 1, 10, 0, 0))
    with TestClient(app) as c:
        yield c
    clock.reset_clock()


def login(client, email, password):
    r = client.post("/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.fixture()
def coord(client):
    return login(client, "coordinator@inventorytrack.edu", "Coord@123")


@pytest.fixture()
def student(client):
    return login(client, "student1@inventorytrack.edu", "Student@123")
