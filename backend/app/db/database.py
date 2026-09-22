import os
import sqlite3
from typing import Optional, List, Dict, Any
from backend.app.config import settings
from backend.app.db.session import Base, engine

DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")
DB_PATH = os.path.join(DB_DIR, "nagarsam.db")

def get_db_connection() -> sqlite3.Connection:
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=10.0)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes SQLAlchemy schema and SQLite fallback database."""
    os.makedirs(DB_DIR, exist_ok=True)
    # Ensure all models are imported so Base.metadata knows about them
    import backend.app.db.models  # noqa
    Base.metadata.create_all(bind=engine)
    print(f"[Database] Schema initialized successfully.")

init_db()
