# NagarSam AI — System Architecture (Phases 3, 4 & 5)

## Overview
NagarSam AI is an enterprise civic infrastructure platform designed to detect, verify, prioritize, and manage road defect lifecycles through computer vision, geospatial intelligence, and role-based workflows.

---

## 1. End-to-End System Workflow

```
[ Citizen ] ──────────► [ Report Submission & Photo Upload ]
                               │
                               ▼
                    [ Dual YOLO11 Inference Engine ]
                    (Pothole Model + General RDD Model)
                               │
                               ▼
                   [ Database Persistence (PostgreSQL / SQLite) ]
                   [ PostGIS Geospatial & Duplicate Candidate Engine ]
                               │
                               ▼
[ Officer ] ◄───────── [ Incident Triage & Priority Queue ]
   │
   ├─► [ Reject with Reason ]
   │
   └─► [ Confirm & Create Work Order ]
                               │
                               ▼
[ Field Worker ] ◄──── [ Accept Job & Start Repair ]
   │
   └─► [ Complete Repair & Upload After-Photo ]
                               │
                               ▼
                    [ AI-Assisted Verification Inference ]
                               │
                               ▼
[ Officer ] ──────────► [ Verification Review & Final Resolution ]
                               │
                               ▼
[ Citizen ] ◄───────── [ Real-time Notification & Synced Status ]
```

---

## 2. Logical Components

### A. FastAPI Application API
- **Authentication & RBAC**: JWT Access & Refresh Token rotation, bcrypt password hashing, roles (`CITIZEN`, `OFFICER`, `FIELD_WORKER`, `ADMIN`).
- **Reports Management**: Real photo uploads, validated bounding boxes, report timeline.
- **Incident Triage**: Officer incident confirmation/rejection, priority recalculation.
- **Work Orders**: Assignment to workers, repair lifecycle states (`CREATED` -> `ASSIGNED` -> `ACCEPTED` -> `IN_PROGRESS` -> `COMPLETED` -> `VERIFYING` -> `RESOLVED`).
- **Verification Engine**: Before/After image association, AI defect re-scan, officer sign-off.
- **Geospatial & Priority Services**: PostGIS spatial queries, nearby search, duplicate candidate detection, transparent deterministic priority scoring.
- **Audit Logs & Notifications**: Actor-stamped lifecycle events and user alerts.

### B. Dual-YOLO Inference Engine
- **Model A**: `pothole_best.pt` — Specialized Pothole detector (>0.40 confidence threshold).
- **Model B**: `nagrik OS initial.pt` — General Road Defect detector (Longitudinal Crack, Transverse Crack, Alligator Crack, Other Corruption, Pothole).
- **Routing**: Mandatory pothole class routing to Model A with Model B general detection.

### C. Data Persistence Layer
- **PostgreSQL + PostGIS**: Production database with spatial indexing on incident coordinates and ward boundaries.
- **SQLAlchemy 2.0 & Alembic**: Transaction-safe ORM models and schema migrations.
- **Storage Service**: Local storage for development, AWS S3 with signed URLs for production.

---

## 3. Database Entity Relationship Diagram

```
+---------------+        1:N        +---------------+
|     User      | ────────────────► |    Report     |
+---------------+                   +---------------+
| id (PK)       |                          │ 1:1
| email (Unique)|                          ▼
| password_hash |                   +---------------+
| role (RBAC)   | ◄──────────────── |   Incident    |
+---------------+    Assigned       +---------------+
        │            Officer        | id (PK)       |
        │                           | priority_score|
        │ 1:N                       | status        |
        ▼                           +---------------+
+---------------+                          │ 1:N
| Notification  |                          ▼
+---------------+                   +---------------+
| id (PK)       |                   |   WorkOrder   |
| user_id (FK)  |                   +---------------+
| message       |                   | id (PK)       |
+---------------+                   | assigned_worker
                                    | status        |
                                    +---------------+
                                           │ 1:1
                                           ▼
                                    +---------------+
                                    | Verification  |
                                    +---------------+
                                    | id (PK)       |
                                    | before_image  |
                                    | after_image   |
                                    | ai_verif_score|
                                    | officer_status|
                                    +---------------+
```
