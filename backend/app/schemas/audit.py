from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class AuditLogResponse(BaseModel):
    id: str
    actorId: Optional[str] = None
    actorRole: Optional[str] = None
    actorName: Optional[str] = None
    action: str
    resourceType: str
    resourceId: str
    result: str
    metadata: Optional[Dict[str, Any]] = None
    createdAt: str

    class Config:
        from_attributes = True

class PaginatedAuditLogsResponse(BaseModel):
    data: List[AuditLogResponse]
    total: int
    page: int
    limit: int
    totalPages: int
