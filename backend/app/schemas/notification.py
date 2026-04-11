"""Notification response schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: UUID
    org_id: UUID | None = None
    user_id: UUID
    event_key: str
    title: str
    message: str
    read: bool
    read_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class NotificationListResponse(BaseModel):
    data: list[NotificationResponse]
    unread_count: int


class NotificationReadAllResponse(BaseModel):
    message: str
    updated: int
    unread_count: int


class NotificationClearResponse(BaseModel):
    message: str
    deleted: int
    unread_count: int
