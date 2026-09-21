from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class ReportBase(BaseModel):
    citizen_name: Optional[str] = "Citizen Reporter"
    citizen_phone: Optional[str] = "+91 98765 43210"
    issue_type: str = "longitudinal crack"
    primary_defect: Optional[str] = None
    description: str
    landmark: Optional[str] = None
    latitude: float
    longitude: float
    address: str
    ward_id: str
    ward_name: Optional[str] = None

class CreateReportRequest(ReportBase):
    image_url: Optional[str] = None
    ai_detection: Optional[Dict[str, Any]] = None

class ReportResponse(BaseModel):
    id: str
    citizenId: str
    citizenName: str
    citizenPhone: Optional[str] = None
    imageUrl: str
    issueType: str
    primaryDefect: str
    description: str
    landmark: Optional[str] = None
    latitude: float
    longitude: float
    address: str
    wardId: str
    wardName: str
    status: str
    severity: str
    priority: str
    departmentId: Optional[str] = None
    departmentName: Optional[str] = None
    incidentId: Optional[str] = None
    aiDetection: Optional[Dict[str, Any]] = None
    aiPriorityReasoning: Optional[Dict[str, Any]] = None
    createdAt: str
    updatedAt: str
    timeline: Optional[List[Dict[str, Any]]] = None

class PaginatedReportsResponse(BaseModel):
    data: List[ReportResponse]
    total: int
    page: int
    limit: int
    totalPages: int

class UpdateReportStatusRequest(BaseModel):
    status: str
    note: Optional[str] = None
