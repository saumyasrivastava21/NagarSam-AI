# NagarSam AI — AI-Powered Road Infrastructure Intelligence

> **Report a road issue. NagarSam AI turns it into action.**  
> *AI-powered road infrastructure intelligence for smarter civic operations.*

---

## 🏛️ Executive Overview

**NagarSam AI** (derived from *Nagar* [City] + *Sam* [Collective Civic Action]) is a production-grade, AI-assisted civic infrastructure platform designed to bridge citizen road defect reporting with verifiable municipal road repair workflows.

The repository includes:
- `backend/`: Production FastAPI application, PostgreSQL/PostGIS persistence, Alembic migrations, Redis caching, dual-YOLO inference engine, Geospatial Intelligence, Deterministic Priority Engine, and JWT RBAC authentication.
- `frontend/`: React 18 + TypeScript 5 web application with dedicated Citizen, Officer, Field Worker, and Admin workspaces, Leaflet GIS mapping, real-time audio input, and TanStack Query state synchronization.
- `models/`: Dual-YOLO checkpoint models:
  - `pothole_best.pt` (Specialized Pothole Detector)
  - `nagrik OS initial.pt` (General Multi-Class Road Defect Detector)
- `docs/`: Architecture documentation and AWS deployment guides.

---

## 🛠️ Complete Technology Stack

| Domain | Technology |
| :--- | :--- |
| **Backend Framework** | FastAPI (Python 3.11/3.13), Pydantic v2, Uvicorn |
| **Database & ORM** | PostgreSQL 15+ with PostGIS, SQLAlchemy 2.0 (Async/Sync), Alembic Migrations |
| **AI / Computer Vision** | Ultralytics YOLO11, PyTorch, OpenCV, Dual Checkpoint Orchestration |
| **Caching & Job Queue** | Redis 7, Celery / Background Task Processing |
| **Authentication & Security**| JWT (Access/Refresh Tokens), Passlib (Bcrypt), Role-Based Access Control (RBAC) |
| **Storage Abstraction** | Local filesystem storage (Dev) & Amazon S3 Private Bucket with Presigned URLs (Prod) |
| **Frontend Framework** | React 18, TypeScript 5 (Strict Mode), Vite 6 |
| **GIS & Geospatial Mapping** | Leaflet / React-Leaflet, PostGIS ST_DWithin / ST_Contains |
| **State Management** | TanStack Query v5, Zustand v5 |
| **Testing** | Pytest (27 tests), Vitest (16 tests), React Testing Library |
| **Containerization** | Docker, Docker Compose (Multi-Service Stack) |

---

## 🔄 End-to-End Civic Lifecycle (Phases 3, 4 & 5)

```
Citizen
   ↓ (Upload road defect photo + GPS)
Dual-YOLO Inference Service
   ↓ (Pothole + Multi-Class Defect Detection)
Citizen Reviews AI Results & Submits
   ↓ (Persisted in PostgreSQL + Idempotency)
Incident Created & Spatial Analysis
   ↓ (Nearby Search, Duplicate Candidates, Ward Routing, Priority Engine)
Officer Reviews Incident
   ↓ (Confirm / Reject with Reason & Audit Logging)
Work Order Dispatched
   ↓ (Assigned to Field Worker)
Field Worker Accepts & Repairs Road
   ↓ (Starts repair, uploads After-Repair photo)
AI-Assisted Verification
   ↓ (Inference on repair photo confirms remediation)
Officer Approves Resolution
   ↓ (Signs off on verified repair)
Citizen Receives Notification
   ↓ (All records synchronized to RESOLVED)
```

---

## 🚀 Running Locally

### 1. Backend Setup

```bash
# Activate virtual environment
python -m venv .venv
source .venv/bin/activate  # Or on Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start FastAPI development server
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

App runs on `http://localhost:3000/` or `http://localhost:5173/`.

### 3. Docker Compose (Full Stack with PostGIS & Redis)

```bash
docker-compose up --build -d
```

Services:
- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000/api/v1`
- **API Documentation**: `http://localhost:8000/docs`
- **PostgreSQL / PostGIS**: `localhost:5432`
- **Redis**: `localhost:6379`

---

## 🧪 Testing & Quality Gates

### Backend Test Suite (Pytest)
```bash
pytest backend/tests/ -v
```
*Coverage includes Auth API, Reports API, Incident Triage, Work Orders, Verifications, Notifications, PostGIS Spatial queries, Deterministic Priority Engine, and the complete cross-role E2E workflow.*

### Frontend Test Suite (Vitest & TypeScript)
```bash
cd frontend
npm run typecheck
npm run test
npm run build
```

---

## 🛡️ Security & Roles (RBAC)

1. **CITIZEN**: Create reports, view own reports and notifications.
2. **OFFICER**: Review incidents, confirm/reject, assign work orders, review verification evidence, approve resolution.
3. **FIELD_WORKER**: View assigned work orders, accept jobs, upload after-repair photos, submit for verification.
4. **ADMIN**: Manage users, departments, wards, model registry, and audit logs.

---

## 📖 Deployment & Production Architecture

See [`docs/deployment_guide.md`](docs/deployment_guide.md) for full AWS infrastructure blueprints including RDS PostgreSQL + PostGIS, Private S3, Amazon ECR/ECS Fargate, and CloudFront.
