from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class CreateWorkOrderRequest(BaseModel):
    incident_id: str = Field(..., description="Target Incident ID")
    assigned_worker_id: Optional[str] = Field(None, description="Field worker user ID")
    instructions: str = Field("Execute asphalt pothole repair and compaction.", description="Repair instructions")
    priority: str = Field("MEDIUM", description="Priority level")
    due_date: Optional[str] = Field(None, description="ISO-8601 target completion date")

class AssignWorkOrderRequest(BaseModel):
    worker_id: str = Field(..., description="Target field worker user ID")
    instructions: Optional[str] = None
    due_in_hours: Optional[int] = 48

class CompleteWorkOrderRequest(BaseModel):
    notes: Optional[str] = Field(None, description="Worker completion notes")
    materials_used: Optional[List[Dict[str, Any]]] = Field(None, description="List of materials utilized")
    labor_hours: Optional[float] = Field(None, description="Recorded labor hours")
    after_image_url: Optional[str] = Field(None, description="URL of post-repair photographic evidence")

class WorkOrderResponse(BaseModel):
    id: str
    incidentId: str
    reportId: str
    title: str
    issueType: Optional[str] = None
    description: str
    instructions: str
    locationAddress: str
    latitude: float
    longitude: float
    priority: str
    status: str
    assignedWorkerId: Optional[str] = None
    assignedWorkerName: Optional[str] = None
    assignedWorkerPhone: Optional[str] = None
    departmentId: str
    departmentName: str
    beforeImageUrl: str
    afterImageUrl: Optional[str] = None
    verification: Optional[Dict[str, Any]] = None
    dueDate: str
    createdAt: str
    updatedAt: str
    completedAt: Optional[str] = None
    timeline: Optional[List[Dict[str, Any]]] = None

    class Config:
        from_attributes = True

class PaginatedWorkOrdersResponse(BaseModel):
    data: List[WorkOrderResponse]
    total: int
    page: int
    limit: int
    totalPages: int
