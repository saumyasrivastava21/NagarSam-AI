import os
import sqlite3
import json
from typing import Optional, List, Dict, Any
from backend.app.config import settings

DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")
DB_PATH = os.path.join(DB_DIR, "nagarsam.db")

def get_db_connection() -> sqlite3.Connection:
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=10.0)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes SQLite schema for real report, incident, work order, and notification persistence."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Reports table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id TEXT PRIMARY KEY,
            citizen_id TEXT NOT NULL,
            citizen_name TEXT NOT NULL,
            citizen_phone TEXT,
            image_url TEXT NOT NULL,
            issue_type TEXT NOT NULL,
            primary_defect TEXT NOT NULL,
            description TEXT NOT NULL,
            landmark TEXT,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            address TEXT NOT NULL,
            ward_id TEXT NOT NULL,
            ward_name TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'SUBMITTED',
            severity TEXT NOT NULL DEFAULT 'MEDIUM',
            priority TEXT NOT NULL DEFAULT 'MEDIUM',
            department_id TEXT,
            department_name TEXT,
            incident_id TEXT,
            ai_detection_json TEXT,
            ai_priority_reasoning_json TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)

    # Incidents table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS incidents (
            id TEXT PRIMARY KEY,
            report_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            ward_id TEXT NOT NULL,
            ward_name TEXT NOT NULL,
            department_id TEXT NOT NULL,
            department_name TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'OPEN',
            severity TEXT NOT NULL DEFAULT 'MEDIUM',
            priority TEXT NOT NULL DEFAULT 'MEDIUM',
            assigned_worker_id TEXT,
            assigned_worker_name TEXT,
            work_order_id TEXT,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            address TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(report_id) REFERENCES reports(id)
        )
    """)

    # Work orders table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS work_orders (
            id TEXT PRIMARY KEY,
            incident_id TEXT NOT NULL,
            report_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            ward_id TEXT NOT NULL,
            assigned_worker_id TEXT,
            assigned_worker_name TEXT,
            status TEXT NOT NULL DEFAULT 'PENDING',
            priority TEXT NOT NULL DEFAULT 'MEDIUM',
            before_photo_url TEXT,
            after_photo_url TEXT,
            completion_notes TEXT,
            materials_used_json TEXT,
            labor_hours REAL,
            verification_score REAL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(incident_id) REFERENCES incidents(id)
        )
    """)

    # Notifications table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT NOT NULL DEFAULT 'INFO',
            is_read INTEGER NOT NULL DEFAULT 0,
            link_url TEXT,
            created_at TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()
    print(f"[Database] SQLite schema initialized at {DB_PATH}")

init_db()
