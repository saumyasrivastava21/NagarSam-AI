from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class IncidentConfirmRequest(BaseModel):
    note: Optional[str] = Field(None, description="Officer notes upon confirmation")

class IncidentRejectRequest(BaseModel):
    reason: str = Field(..., min_length=3, description="Mandatory reason for incident rejection")

class IncidentPriorityUpdateRequest(BaseModel):
    priority: str = Field(..., description="Priority: LOW, MEDIUM, HIGH, CRITICAL")
    note: Optional[str] = None

class IncidentDepartmentAssignRequest(BaseModel):
    department_id: str = Field(..., description="Target department ID")
    note: Optional[str] = None

class IncidentAssignWorkerRequest(BaseModel):
    worker_id: str = Field(..., description="Target field worker user ID")
    instructions: Optional[str] = Field(None, description="Operational repair instructions")
    due_in_hours: Optional[int] = Field(48, description="SLA repair due window")

class IncidentResponse(BaseModel):
    id: str
    reportId: str
    title: str
    issueType: Optional[str] = None
    primaryDefect: Optional[str] = None
    description: str
    imageUrl: str
    latitude: float
    longitude: float
    address: str
    wardId: str
    wardName: str
    departmentId: str
    departmentName: str
    status: str
    severity: str
    priority: str
    priorityScore: float
    aiDetection: Optional[Dict[str, Any]] = None
    aiFactors: Optional[List[str]] = None
    assignedOfficerId: Optional[str] = None
    assignedWorkerId: Optional[str] = None
    assignedWorkerName: Optional[str] = None
    workOrderId: Optional[str] = None
    rejectionReason: Optional[str] = None
    createdAt: str
    updatedAt: str
    timeline: Optional[List[Dict[str, Any]]] = None

    class Config:
        from_attributes = True

class PaginatedIncidentsResponse(BaseModel):
    data: List[IncidentResponse]
    total: int
    page: int
    limit: int
    totalPages: int
