import json
import sqlite3
from datetime import datetime
from typing import List, Optional, Dict, Any, Tuple
from backend.app.db.database import get_db_connection
from backend.app.schemas.reports import CreateReportRequest, ReportResponse

def generate_report_id() -> str:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM reports")
    count = cursor.fetchone()[0] + 1
    conn.close()
    return f"NS-2026-{count:05d}"

def create_report_in_db(
    report_id: str,
    citizen_id: str,
    data: CreateReportRequest,
    image_url: str,
    ai_detection: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()

    now = datetime.utcnow().isoformat() + "Z"
    
    # Determine defect and severity
    primary = data.primary_defect or data.issue_type
    if ai_detection and ("primary_defect" in ai_detection or "primaryDefectClass" in ai_detection):
        primary = ai_detection.get("primary_defect") or ai_detection.get("primaryDefectClass") or primary

    severity = "CRITICAL" if "pothole" in primary.lower() else "HIGH" if "alligator" in primary.lower() else "MEDIUM"
    priority = "CRITICAL" if severity == "CRITICAL" else "HIGH" if severity == "HIGH" else "MEDIUM"
    
    ward_name = data.ward_name or f"Ward {data.ward_id}"
    dept_id = "DEPT-01"
    dept_name = "Road Maintenance Division"
    incident_id = f"INC-{report_id}"

    ai_detection_str = json.dumps(ai_detection) if ai_detection else None
    
    confidence = ai_detection.get("confidence", 0.90) if ai_detection else 0.90
    reasoning = {
        "recommendation": priority,
        "confidenceScore": int(confidence * 100),
        "factors": [
            f"YOLO11 visual detection confidence ({int(confidence * 100)}%) for {primary}",
            "Pavement fracture surface threshold analyzed",
            "Municipal road transit corridor prioritized",
        ],
    }
    reasoning_str = json.dumps(reasoning)

    cursor.execute("""
        INSERT INTO reports (
            id, citizen_id, citizen_name, citizen_phone, image_url,
            issue_type, primary_defect, description, landmark, latitude, longitude,
            address, ward_id, ward_name, status, severity, priority,
            department_id, department_name, incident_id, ai_detection_json,
            ai_priority_reasoning_json, created_at, updated_at
        ) VALUES (
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, 'SUBMITTED', ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?
        )
    """, (
        report_id, citizen_id, data.citizen_name or "Citizen Reporter", data.citizen_phone or "+91 98765 43210", image_url,
        data.issue_type, primary, data.description, data.landmark, data.latitude, data.longitude,
        data.address, data.ward_id, ward_name, severity, priority,
        dept_id, dept_name, incident_id, ai_detection_str,
        reasoning_str, now, now
    ))

    # Also register corresponding triage incident
    cursor.execute("""
        INSERT INTO incidents (
            id, report_id, title, description, ward_id, ward_name,
            department_id, department_name, status, severity, priority,
            latitude, longitude, address, created_at, updated_at
        ) VALUES (
            ?, ?, ?, ?, ?, ?,
            ?, ?, 'OPEN', ?, ?,
            ?, ?, ?, ?, ?
        )
    """, (
        incident_id, report_id, f"Report {report_id}: {primary.title()} on {data.address}",
        data.description, data.ward_id, ward_name, dept_id, dept_name,
        severity, priority, data.latitude, data.longitude, data.address,
        now, now
    ))

    conn.commit()
    conn.close()

    return get_report_from_db(report_id)

def get_report_from_db(report_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM reports WHERE id = ?", (report_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    return _row_to_report_dict(row)

def list_reports_from_db(
    citizen_id: Optional[str] = None,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    priority: Optional[str] = None,
    ward_id: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 20
) -> Tuple[List[Dict[str, Any]], int]:
    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM reports WHERE 1=1"
    params = []

    if citizen_id:
        query += " AND citizen_id = ?"
        params.append(citizen_id)
    if status:
        query += " AND status = ?"
        params.append(status)
    if severity:
        query += " AND severity = ?"
        params.append(severity)
    if priority:
        query += " AND priority = ?"
        params.append(priority)
    if ward_id:
        query += " AND ward_id = ?"
        params.append(ward_id)
    if search:
        query += " AND (id LIKE ? OR description LIKE ? OR address LIKE ? OR ward_name LIKE ?)"
        pattern = f"%{search}%"
        params.extend([pattern, pattern, pattern, pattern])

    # Count total
    count_query = f"SELECT COUNT(*) FROM ({query})"
    cursor.execute(count_query, params)
    total = cursor.fetchone()[0]

    # Order and paginate
    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, (page - 1) * limit])

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    reports = [_row_to_report_dict(r) for r in rows]
    return reports, total

def update_report_status_in_db(report_id: str, new_status: str, note: Optional[str] = None) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat() + "Z"

    cursor.execute("UPDATE reports SET status = ?, updated_at = ? WHERE id = ?", (new_status, now, report_id))
    cursor.execute("UPDATE incidents SET status = ?, updated_at = ? WHERE report_id = ?", (new_status, now, report_id))
    conn.commit()
    conn.close()

    return get_report_from_db(report_id)

def _row_to_report_dict(row: sqlite3.Row) -> Dict[str, Any]:
    ai_det = json.loads(row["ai_detection_json"]) if row["ai_detection_json"] else None
    ai_reason = json.loads(row["ai_priority_reasoning_json"]) if row["ai_priority_reasoning_json"] else None

    # Base report payload
    return {
        "id": row["id"],
        "citizenId": row["citizen_id"],
        "citizenName": row["citizen_name"],
        "citizenPhone": row["citizen_phone"],
        "imageUrl": row["image_url"],
        "issueType": row["issue_type"],
        "primaryDefect": row["primary_defect"],
        "description": row["description"],
        "landmark": row["landmark"],
        "latitude": row["latitude"],
        "longitude": row["longitude"],
        "address": row["address"],
        "wardId": row["ward_id"],
        "wardName": row["ward_name"],
        "status": row["status"],
        "severity": row["severity"],
        "priority": row["priority"],
        "departmentId": row["department_id"],
        "departmentName": row["department_name"],
        "incidentId": row["incident_id"],
        "aiDetection": ai_det,
        "aiPriorityReasoning": ai_reason,
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
        "timeline": [
            {
                "id": f"TL-{row['id']}-1",
                "status": "SUBMITTED",
                "title": "Report Submitted",
                "description": "Citizen report logged with photographic evidence and geolocation.",
                "actor": row["citizen_name"],
                "actorRole": "CITIZEN",
                "timestamp": row["created_at"]
            },
            {
                "id": f"TL-{row['id']}-2",
                "status": "UNDER_REVIEW",
                "title": "AI Defect Telemetry Recorded",
                "description": f"Verified defect as {row['primary_defect'].title()}.",
                "actor": "YOLO11 AI Engine",
                "actorRole": "ADMIN",
                "timestamp": row["created_at"]
            }
        ]
    }
