"""Role Pydantic schemas."""

from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime
from uuid import UUID


class RoleCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    permissions: list[str] = Field(default_factory=list)


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[list[str]] = None


class RoleResponse(BaseModel):
    id: UUID
    org_id: UUID
    name: str
    description: Optional[str] = None
    permissions: list[str]
    is_system: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class RoleListResponse(BaseModel):
    data: list[RoleResponse]
    pagination: dict[str, Any]
