"""Group Pydantic schemas."""

from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime
from uuid import UUID


class GroupCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None


class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class GroupResponse(BaseModel):
    id: UUID
    org_id: UUID
    name: str
    description: Optional[str] = None
    member_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class GroupDetailResponse(GroupResponse):
    members: list[dict[str, Any]] = Field(default_factory=list)
    roles: list[dict[str, Any]] = Field(default_factory=list)


class GroupListResponse(BaseModel):
    data: list[GroupResponse]
    pagination: dict[str, Any]


class GroupMemberAdd(BaseModel):
    user_ids: list[UUID]


class GroupRoleAssign(BaseModel):
    role_ids: list[UUID]
