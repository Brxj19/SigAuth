"""Audit Log Pydantic schemas."""

from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime
from uuid import UUID


class AuditLogResponse(BaseModel):
    id: int
    org_id: Optional[UUID] = None
    actor_id: Optional[UUID] = None
    actor_type: Optional[str] = None
    event_type: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime

    model_config = {"from_attributes": True}


class AuditLogListResponse(BaseModel):
    data: list[AuditLogResponse]
    pagination: dict[str, Any]
