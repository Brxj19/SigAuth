"""Audit log router: GET audit log with filters."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, require_permission
from app.services.audit_service import query_audit_log, get_audit_event_by_id
from app.schemas.audit_log import AuditLogListResponse, AuditLogResponse

router = APIRouter(prefix="/api/v1/organizations/{org_id}/audit-log", tags=["audit"])


@router.get("")
async def get_audit_log(
    org_id: UUID,
    event_type: Optional[str] = Query(None),
    actor_id: Optional[UUID] = Query(None),
    resource_type: Optional[str] = Query(None),
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    cursor: Optional[str] = Query(None),
    current_user: dict = Depends(require_permission("audit:read")),
    db: AsyncSession = Depends(get_db),
):
    """Get paginated audit events with filters."""
    result = await query_audit_log(
        db, org_id, event_type, actor_id, resource_type,
        from_date, to_date, limit, cursor,
    )
    return result


@router.get("/{event_id}", response_model=AuditLogResponse)
async def get_audit_event(
    org_id: UUID,
    event_id: int,
    current_user: dict = Depends(require_permission("audit:read")),
    db: AsyncSession = Depends(get_db),
):
    """Get a single audit event by numeric ID."""
    event = await get_audit_event_by_id(db, org_id, event_id)
    if not event:
        raise HTTPException(404, detail={"error": "not_found", "error_description": "Audit event not found"})

    return AuditLogResponse(
        id=event.id,
        org_id=event.org_id,
        actor_id=event.actor_id,
        actor_type=event.actor_type,
        event_type=event.event_type,
        resource_type=event.resource_type,
        resource_id=event.resource_id,
        metadata=event.metadata_ or {},
        created_at=event.created_at,
    )
