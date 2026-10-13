from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401  (register tables)
from app.core.config import settings
from app.db.session import Base, engine
from app.routers import assets, auth, dashboard, inventory, issues, me, renewals, reports, returns, students


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)  # dev convenience; use Alembic migrations in production
    yield


app = FastAPI(title="InventoryTrack API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (auth, students, inventory, assets, issues, returns, renewals, dashboard, reports, me):
    app.include_router(r.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
