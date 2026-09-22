from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class VerificationResponse(BaseModel):
    id: str
    workOrderId: str
    issueType: Optional[str] = None
    beforeImageUrl: str
    afterImageUrl: str
    verificationScore: float
    status: str
    officerDecision: Optional[str] = None
    notes: Optional[str] = None
    verifiedAt: Optional[str] = None
    verifiedBy: Optional[str] = None
    createdAt: str

    class Config:
        from_attributes = True

class PaginatedVerificationsResponse(BaseModel):
    data: List[VerificationResponse]
    total: int
