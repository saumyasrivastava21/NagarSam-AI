from pydantic import BaseModel, Field
from typing import Optional, List

class NotificationResponse(BaseModel):
    id: str
    userId: str
    type: str
    title: str
    message: str
    relatedResourceType: Optional[str] = None
    relatedResourceId: Optional[str] = None
    linkUrl: Optional[str] = None
    read: bool = False
    isRead: bool = False
    readAt: Optional[str] = None
    createdAt: str

    class Config:
        from_attributes = True

class PaginatedNotificationsResponse(BaseModel):
    data: List[NotificationResponse]
    total: int
    unreadCount: int
