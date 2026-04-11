"""Roles router: list + create + update roles."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, require_permission
from app.schemas.role import RoleCreate, RoleUpdate, RoleResponse, RoleListResponse
from app.services.role_service import create_role, list_roles, update_role, get_role

router = APIRouter(prefix="/api/v1/organizations/{org_id}/roles", tags=["roles"])


@router.get("", response_model=RoleListResponse)
async def list_roles_endpoint(
    org_id: UUID,
    limit: int = Query(50, ge=1, le=100),
    cursor: Optional[str] = Query(None),
    current_user: dict = Depends(require_permission("role:read")),
    db: AsyncSession = Depends(get_db),
):
    """List all roles (system + custom) for an org."""
    result = await list_roles(db, org_id, limit, cursor)
    return RoleListResponse(
        data=[RoleResponse.model_validate(r) for r in result["data"]],
        pagination=result["pagination"],
    )


@router.post("", response_model=RoleResponse, status_code=201)
async def create_role_endpoint(
    org_id: UUID,
    body: RoleCreate,
    current_user: dict = Depends(require_permission("role:create")),
    db: AsyncSession = Depends(get_db),
):
    """Create a custom role."""
    role = await create_role(db, org_id, body.name, body.description, body.permissions)
    return RoleResponse.model_validate(role)


@router.patch("/{role_id}", response_model=RoleResponse)
async def update_role_endpoint(
    org_id: UUID,
    role_id: UUID,
    body: RoleUpdate,
    current_user: dict = Depends(require_permission("role:update")),
    db: AsyncSession = Depends(get_db),
):
    """Update a custom role. REJECTS if is_system=True (403)."""
    try:
        role = await update_role(db, role_id, body.name, body.description, body.permissions)
    except ValueError as e:
        raise HTTPException(403, detail={"error": "forbidden", "error_description": str(e)})

    if not role or role.org_id != org_id:
        raise HTTPException(404, detail={"error": "not_found", "error_description": "Role not found"})
    return RoleResponse.model_validate(role)
