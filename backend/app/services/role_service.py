"""Role service: CRUD and permission management."""

from datetime import datetime, timezone
from typing import Any, Optional
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.role import Role
from app.utils.pagination import encode_cursor, decode_cursor, build_pagination_response


async def create_role(
    db: AsyncSession,
    org_id: UUID,
    name: str,
    description: Optional[str] = None,
    permissions: Optional[list[str]] = None,
) -> Role:
    """Create a custom role (is_system=False)."""
    role = Role(
        org_id=org_id,
        name=name,
        description=description,
        permissions=permissions or [],
        is_system=False,
    )
    db.add(role)
    await db.flush()
    return role


async def get_role(db: AsyncSession, role_id: UUID) -> Optional[Role]:
    """Get role by ID."""
    result = await db.execute(select(Role).where(Role.id == role_id))
    return result.scalar_one_or_none()


async def list_roles(db: AsyncSession, org_id: UUID, limit: int = 50, cursor: Optional[str] = None) -> dict[str, Any]:
    """List all roles (system + custom) for an org with cursor-based pagination."""
    query = select(Role).where(Role.org_id == org_id)

    if cursor:
        cursor_data = decode_cursor(cursor)
        if cursor_data:
            from datetime import datetime as dt
            cursor_created = dt.fromisoformat(cursor_data["created_at"])
            query = query.where(Role.created_at < cursor_created)

    count_query = select(func.count()).select_from(Role).where(Role.org_id == org_id)
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Role.is_system.desc(), Role.created_at.desc()).limit(limit + 1)
    result = await db.execute(query)
    records = list(result.scalars().all())

    has_more = len(records) > limit
    if has_more:
        records = records[:limit]

    next_cursor = None
    if has_more and records:
        last = records[-1]
        next_cursor = encode_cursor(str(last.id), last.created_at)

    return {
        "data": records,
        "pagination": build_pagination_response(records, total, limit, has_more, next_cursor),
    }


async def update_role(
    db: AsyncSession,
    role_id: UUID,
    name: Optional[str] = None,
    description: Optional[str] = None,
    permissions: Optional[list[str]] = None,
) -> Optional[Role]:
    """Update a custom role. Rejects if is_system=True."""
    role = await get_role(db, role_id)
    if not role:
        return None

    if role.is_system:
        raise ValueError("Cannot modify system roles")

    if name is not None:
        role.name = name
    if description is not None:
        role.description = description
    if permissions is not None:
        role.permissions = permissions

    await db.flush()
    return role
