# InventoryTrack — Department Inventory & Student Item Issue Management

This repository combines the supplied React/Vite frontend and FastAPI backend.
Docker and Render are not used.

## Project layout

- `frontend/` — React + TypeScript + Vite UI
- `backend/` — FastAPI API, SQLAlchemy models, Alembic migration, seed script, tests
- `frontend/src/services/apiClient.ts` — reusable authenticated API client
- `backend/.env.example` — backend configuration template

## Important integration note

The supplied frontend is a working **demo/localStorage UI**. The supplied FastAPI
backend is a separate persistent API. They are now in one repository and the API
client/configuration are included, but the existing UI screens still use the
frontend's local `InventoryStore`; they have **not** all been rewritten to call
the API. Do not treat frontend demo data as shared database data. A full live
integration requires migrating each screen's read/write calls to asynchronous API
requests and mapping the UI's camelCase types to the API's snake_case schemas.

## Run locally (Windows)

### 1. Start the backend

Install Python 3.11+ from python.org. Open PowerShell:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
alembic upgrade head
python -m scripts.seed
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

API docs: http://127.0.0.1:8000/docs
Health check: http://127.0.0.1:8000/api/health

### 2. Start the frontend

Open a second PowerShell window:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Open the local URL printed by Vite (usually http://localhost:3000).

### Demo credentials for the backend API

- Coordinator: `coordinator@inventorytrack.edu` / `Coord@123`
- Student: `student1@inventorytrack.edu` / `Student@123`

These credentials are for the backend API's seeded demo accounts. The current
frontend demo login remains a UI role selector and does not authenticate against
the backend yet.

## Free hosting without Docker or Render

### Frontend: GitHub Pages

GitHub Pages can host the built static frontend for free. Push this project to a
GitHub repository named `InventoryTrack`, enable Pages via **Settings → Pages →
GitHub Actions**, and add the workflow below at
`.github/workflows/deploy-pages.yml`. It builds only the frontend.

GitHub Pages **cannot run the FastAPI/Python backend or host its database**.
For a fully online app, the backend needs a separate Python-capable host and a
reachable database. If you want to keep everything free, check the provider's
current free-tier limits before deploying; availability and sleep/storage limits
change. Do not put secrets in the frontend or GitHub Pages environment.

To test the UI without hosting an API, use the frontend's demo/localStorage mode.
Data saved in that mode is local to the browser and is not shared between users.

## Tests

```powershell
cd backend
python -m pytest
```

## Security before real use

Change `SECRET_KEY`, configure `CORS_ORIGINS` to the exact frontend origin, use
a production database with backups, and do not use demo credentials for real
student or inventory records.
"# CyberSix" 
