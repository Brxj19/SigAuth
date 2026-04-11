"""Audit service: write and query audit events (append-only)."""

from datetime import datetime, timezone
from typing import Any, Optional
from uuid import UUID

from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog
from app.utils.pagination import encode_cursor, decode_cursor, build_pagination_response


async def write_audit_event(
    db: AsyncSession,
    event_type: str,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    org_id: Optional[UUID] = None,
    actor_id: Optional[UUID] = None,
    actor_type: str = "user",
    metadata: Optional[dict[str, Any]] = None,
) -> AuditLog:
    """Write an audit event. This is append-only — never update or delete."""
    audit_entry = AuditLog(
        org_id=org_id,
        actor_id=actor_id,
        actor_type=actor_type,
        event_type=event_type,
        resource_type=resource_type,
        resource_id=str(resource_id) if resource_id else None,
        metadata_=metadata or {},
    )
    db.add(audit_entry)
    await db.flush()
    return audit_entry


async def query_audit_log(
    db: AsyncSession,
    org_id: UUID,
    event_type: Optional[str] = None,
    actor_id: Optional[UUID] = None,
    resource_type: Optional[str] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    limit: int = 50,
    cursor: Optional[str] = None,
) -> dict[str, Any]:
    """Query audit log with filters and cursor-based pagination."""
    query = select(AuditLog).where(AuditLog.org_id == org_id)

    if event_type:
        query = query.where(AuditLog.event_type == event_type)
    if actor_id:
        query = query.where(AuditLog.actor_id == actor_id)
    if resource_type:
        query = query.where(AuditLog.resource_type == resource_type)
    if from_date:
        query = query.where(AuditLog.created_at >= from_date)
    if to_date:
        query = query.where(AuditLog.created_at <= to_date)

    # Cursor-based pagination
    if cursor:
        cursor_data = decode_cursor(cursor)
        if cursor_data:
            cursor_id = int(cursor_data["id"])
            query = query.where(AuditLog.id < cursor_id)

    # Count total
    count_query = select(func.count()).select_from(AuditLog).where(AuditLog.org_id == org_id)
    if event_type:
        count_query = count_query.where(AuditLog.event_type == event_type)
    if actor_id:
        count_query = count_query.where(AuditLog.actor_id == actor_id)
    if resource_type:
        count_query = count_query.where(AuditLog.resource_type == resource_type)
    if from_date:
        count_query = count_query.where(AuditLog.created_at >= from_date)
    if to_date:
        count_query = count_query.where(AuditLog.created_at <= to_date)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Order by created_at DESC and limit
    query = query.order_by(AuditLog.created_at.desc()).limit(limit + 1)

    result = await db.execute(query)
    records = list(result.scalars().all())

    has_more = len(records) > limit
    if has_more:
        records = records[:limit]

    next_cursor = None
    if has_more and records:
        last = records[-1]
        next_cursor = encode_cursor(str(last.id), last.created_at)

    data = []
    for r in records:
        data.append({
            "id": r.id,
            "org_id": r.org_id,
            "actor_id": r.actor_id,
            "actor_type": r.actor_type,
            "event_type": r.event_type,
            "resource_type": r.resource_type,
            "resource_id": r.resource_id,
            "metadata": r.metadata_,
            "created_at": r.created_at,
        })

    return {
        "data": data,
        "pagination": build_pagination_response(data, total, limit, has_more, next_cursor),
    }


async def get_audit_event_by_id(
    db: AsyncSession,
    org_id: UUID,
    event_id: int,
) -> Optional[AuditLog]:
    """Get a single audit event by ID, scoped to organization."""
    result = await db.execute(
        select(AuditLog).where(
            AuditLog.id == event_id,
            AuditLog.org_id == org_id,
        )
    )
    return result.scalar_one_or_none()
