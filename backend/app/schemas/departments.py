from pydantic import BaseModel
from typing import Optional, List

class DepartmentResponse(BaseModel):
    id: str
    name: str
    code: Optional[str] = "PWD-01"
    headName: Optional[str] = "Chief City Engineer"
    contactEmail: Optional[str] = "pwd@nagarsam.gov"
    contactPhone: Optional[str] = "+91-522-220011"
    activeIncidentsCount: int = 0
    completedIncidentsCount: int = 0

    class Config:
        from_attributes = True

class WardResponse(BaseModel):
    id: str
    number: int = 1
    name: str
    zone: str = "Central Zone"
    corporatorName: Optional[str] = "Municipal Ward Representative"
    corporatorPhone: Optional[str] = "+91-522-220099"
    activeHazardsCount: int = 0
    activePotholesCount: int = 0
    boundaryGeojson: Optional[str] = None

    class Config:
        from_attributes = True
