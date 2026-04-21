"""Groups router: full group CRUD + members + roles."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, require_permission
from app.models.group import GroupMember, GroupRole
from app.models.role import Role
from app.models.user import User
from app.schemas.group import (
    GroupCreate, GroupUpdate, GroupResponse, GroupListResponse,
    GroupMemberAdd, GroupRoleAssign,
)
from app.schemas.user import UserResponse
from app.services.group_service import (
    create_group, get_group, list_groups, update_group, delete_group,
    get_group_members, add_members, remove_member, get_application_group_membership_conflicts,
    assign_roles, remove_role, get_group_roles,
)
from app.services.organization_service import get_organization
from app.services.role_service import get_role
from app.services.audit_service import write_audit_event
from app.services.notification_service import send_admin_activity_notification, send_notification_event

router = APIRouter(prefix="/api/v1/organizations/{org_id}/groups", tags=["groups"])

PROTECTED_ROLE_NAMES = {"org:admin", "super_admin"}


def _can_manage_protected_access(current_user: dict) -> bool:
    return bool(current_user.get("is_super_admin") or "org:admin" in (current_user.get("roles") or []))


async def _group_has_protected_role(db: AsyncSession, group_id: UUID) -> bool:
    roles = await get_group_roles(db, group_id)
    return any(role.name in PROTECTED_ROLE_NAMES for role in roles)


async def _ensure_group_manageable(db: AsyncSession, current_user: dict, group_id: UUID) -> None:
    if await _group_has_protected_role(db, group_id) and not _can_manage_protected_access(current_user):
        raise HTTPException(
            status_code=403,
            detail={
                "error": "protected_group_forbidden",
                "error_description": "Only organization admins can manage groups that grant administrator access.",
            },
        )


async def _resolve_org_roles_or_404(db: AsyncSession, org_id: UUID, role_ids: list[UUID]):
    roles = []
    for role_id in role_ids:
        role = await get_role(db, role_id)
        if not role or role.org_id != org_id:
            raise HTTPException(404, detail={"error": "not_found", "error_description": "Role not found"})
        roles.append(role)
    return roles


async def _get_org_group_or_404(db: AsyncSession, org_id: UUID, group_id: UUID):
    group = await get_group(db, group_id)
    if not group or group.org_id != org_id:
        raise HTTPException(404, detail={"error": "not_found", "error_description": "Group not found"})
    return group


def _is_bootstrap_admin_group(org_settings: dict | None, group) -> bool:
    if not isinstance(org_settings, dict):
        return str(group.name or "").strip().lower() == "admins"
    configured_group_id = str(org_settings.get("bootstrap_admin_group_id") or "").strip()
    if configured_group_id and configured_group_id == str(group.id):
        return True
    return str(group.name or "").strip().lower() == "admins"


async def _resolve_bootstrap_admin_user_id(db: AsyncSession, org_id: UUID, org_settings: dict | None) -> UUID | None:
    if isinstance(org_settings, dict):
        configured_user_id = str(org_settings.get("bootstrap_admin_user_id") or "").strip()
        if configured_user_id:
            try:
                return UUID(configured_user_id)
            except ValueError:
                pass

    result = await db.execute(
        select(User.id)
        .where(User.org_id == org_id, User.deleted_at.is_(None))
        .order_by(User.created_at.asc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def _ensure_bootstrap_admin_membership_removable(
    db: AsyncSession,
    *,
    org_id: UUID,
    group,
    target_user_id: UUID,
    current_user: dict,
) -> None:
    org = await get_organization(db, org_id)
    org_settings = org.settings if org else {}
    if not _is_bootstrap_admin_group(org_settings, group):
        return

    current_user_id = current_user.get("user_id")
    if current_user_id and target_user_id == current_user_id:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "admin_group_self_removal_forbidden",
                "error_description": "Organization admins cannot remove themselves from the bootstrap admins group.",
            },
        )


async def _count_user_role_source_groups(
    db: AsyncSession,
    *,
    org_id: UUID,
    user_id: UUID,
    role_name: str,
) -> int:
    result = await db.execute(
        select(func.count(func.distinct(GroupMember.group_id)))
        .select_from(GroupMember)
        .join(GroupRole, GroupRole.group_id == GroupMember.group_id)
        .join(Role, Role.id == GroupRole.role_id)
        .where(
            GroupMember.user_id == user_id,
            Role.org_id == org_id,
            Role.name == role_name,
        )
    )
    return int(result.scalar() or 0)


async def _ensure_manager_membership_self_removal_safe(
    db: AsyncSession,
    *,
    org_id: UUID,
    group,
    target_user_id: UUID,
    current_user: dict,
) -> None:
    current_user_id = current_user.get("user_id")
    if not current_user_id or target_user_id != current_user_id:
        return

    group_roles = await get_group_roles(db, group.id)
    role_names = {role.name for role in group_roles}
    if "group:manager" not in role_names:
        return

    role_source_count = await _count_user_role_source_groups(
        db,
        org_id=org_id,
        user_id=target_user_id,
        role_name="group:manager",
    )
    if role_source_count <= 1:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "manager_group_self_removal_forbidden",
                "error_description": "You cannot remove yourself from the last group that grants your group manager access.",
            },
        )

    bootstrap_admin_user_id = await _resolve_bootstrap_admin_user_id(db, org_id, org_settings)
    if bootstrap_admin_user_id and target_user_id == bootstrap_admin_user_id:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "bootstrap_admin_removal_forbidden",
                "error_description": "The first organization admin cannot be removed from the admins group.",
            },
        )


@router.get("")
async def list_groups_endpoint(
    org_id: UUID,
    limit: int = Query(25, ge=1, le=100),
    cursor: Optional[str] = Query(None),
    current_user: dict = Depends(require_permission("group:read")),
    db: AsyncSession = Depends(get_db),
):
    """List all groups with member_count."""
    result = await list_groups(db, org_id, limit, cursor)
    return result


@router.post("", status_code=201)
async def create_group_endpoint(
    org_id: UUID,
    body: GroupCreate,
    current_user: dict = Depends(require_permission("group:create")),
    db: AsyncSession = Depends(get_db),
):
    """Create a group."""
    try:
        group = await create_group(db, org_id, body.name, body.description)
    except ValueError as exc:
        raise HTTPException(
            status_code=409,
            detail={"error": "group_conflict", "error_description": str(exc)},
        )
    return GroupResponse(
        id=group.id, org_id=group.org_id, name=group.name,
        description=group.description, member_count=0,
        created_at=group.created_at, updated_at=group.updated_at,
    )


@router.patch("/{group_id}")
async def update_group_endpoint(
    org_id: UUID,
    group_id: UUID,
    body: GroupUpdate,
    current_user: dict = Depends(require_permission("group:update")),
    db: AsyncSession = Depends(get_db),
):
    """Update group name/description."""
    group = await _get_org_group_or_404(db, org_id, group_id)
    await _ensure_group_manageable(db, current_user, group.id)
    previous_name = group.name
    previous_description = group.description
    try:
        group = await update_group(db, group_id, body.name, body.description)
    except ValueError as exc:
        raise HTTPException(
            status_code=409,
            detail={"error": "group_conflict", "error_description": str(exc)},
        )
    if not group:
        raise HTTPException(404, detail={"error": "not_found", "error_description": "Group not found"})
    if group.name != previous_name or group.description != previous_description:
        await write_audit_event(
            db,
            "group.updated",
            "group",
            str(group.id),
            org_id=org_id,
            actor_id=current_user["user_id"],
            metadata={
                "group_id": str(group.id),
                "previous_name": previous_name,
                "new_name": group.name,
                "previous_description": previous_description,
                "new_description": group.description,
            },
        )
        await send_admin_activity_notification(
            db=db,
            org_id=org_id,
            actor_user_id=current_user["user_id"],
            title="Group updated",
            message=f"{current_user.get('email', 'An admin')} updated group '{previous_name}' to '{group.name}'.",
        )
    return GroupResponse(
        id=group.id, org_id=group.org_id, name=group.name,
        description=group.description, member_count=0,
        created_at=group.created_at, updated_at=group.updated_at,
    )


@router.delete("/{group_id}")
async def delete_group_endpoint(
    org_id: UUID,
    group_id: UUID,
    current_user: dict = Depends(require_permission("group:delete")),
    db: AsyncSession = Depends(get_db),
):
    """Delete group (cascades memberships and role assignments)."""
    group = await _get_org_group_or_404(db, org_id, group_id)
    await _ensure_group_manageable(db, current_user, group.id)
    await delete_group(db, group_id)
    return {"message": "Group deleted"}


@router.get("/{group_id}/members")
async def list_members_endpoint(
    org_id: UUID,
    group_id: UUID,
    limit: int = Query(25, ge=1, le=100),
    cursor: Optional[str] = Query(None),
    current_user: dict = Depends(require_permission("group:read")),
    db: AsyncSession = Depends(get_db),
):
    """List users in group (paginated)."""
    group = await _get_org_group_or_404(db, org_id, group_id)
    result = await get_group_members(db, group_id, limit, cursor)
    return {
        "data": [UserResponse.model_validate(u) for u in result["data"]],
        "pagination": result["pagination"],
    }


@router.post("/{group_id}/members")
async def add_members_endpoint(
    org_id: UUID,
    group_id: UUID,
    body: GroupMemberAdd,
    current_user: dict = Depends(require_permission("group:member:add")),
    db: AsyncSession = Depends(get_db),
):
    """Add users to a group."""
    group = await _get_org_group_or_404(db, org_id, group_id)
    await _ensure_group_manageable(db, current_user, group.id)

    conflicts = await get_application_group_membership_conflicts(db, group_id, body.user_ids)
    if conflicts:
        first_conflict = conflicts[0]
        raise HTTPException(
            409,
            detail={
                "error": "application_group_membership_conflict",
                "error_description": (
                    f"{first_conflict['user_email']} is already in "
                    f"'{first_conflict['group_name']}' for application "
                    f"'{first_conflict['application_name']}'. Remove them from that application group first."
                ),
                "conflicts": conflicts,
            },
        )

    added = await add_members(db, group_id, body.user_ids)

    await write_audit_event(
        db, "group.member_added", "group", str(group_id),
        org_id=org_id, actor_id=current_user["user_id"],
        metadata={"group_id": str(group_id), "user_ids": [str(uid) for uid in added]}
    )
    for user_id in added:
        user = await db.get(User, user_id)
        if user:
            await send_notification_event(
                db=db,
                user=user,
                event_key="account.role_changed",
                title="Group membership updated",
                message=f"You were added to group '{group.name}'.",
            )
    if added:
        await send_admin_activity_notification(
            db=db,
            org_id=org_id,
            actor_user_id=current_user["user_id"],
            title="Group membership changed",
            message=f"{current_user.get('email', 'An admin')} added {len(added)} user(s) to group '{group.name}'.",
        )

    return {"message": f"Added {len(added)} members", "added": [str(uid) for uid in added]}


@router.delete("/{group_id}/members/{user_id}")
async def remove_member_endpoint(
    org_id: UUID,
    group_id: UUID,
    user_id: UUID,
    current_user: dict = Depends(require_permission("group:member:remove")),
    db: AsyncSession = Depends(get_db),
):
    """Remove a user from a group."""
    group = await _get_org_group_or_404(db, org_id, group_id)
    await _ensure_group_manageable(db, current_user, group.id)
    await _ensure_bootstrap_admin_membership_removable(
        db,
        org_id=org_id,
        group=group,
        target_user_id=user_id,
        current_user=current_user,
    )
    await _ensure_manager_membership_self_removal_safe(
        db,
        org_id=org_id,
        group=group,
        target_user_id=user_id,
        current_user=current_user,
    )
    success = await remove_member(db, group_id, user_id)
    if not success:
        raise HTTPException(404, detail={"error": "not_found", "error_description": "Member not found in group"})
    user = await db.get(User, user_id)
    if user:
        await send_notification_event(
            db=db,
            user=user,
            event_key="account.role_changed",
            title="Group membership updated",
            message=f"You were removed from group '{group.name}'.",
        )
    await send_admin_activity_notification(
        db=db,
        org_id=org_id,
        actor_user_id=current_user["user_id"],
        title="Group membership changed",
        message=f"{current_user.get('email', 'An admin')} removed a user from group '{group.name}'.",
    )
    return {"message": "Member removed"}


@router.post("/{group_id}/roles")
async def assign_roles_endpoint(
    org_id: UUID,
    group_id: UUID,
    body: GroupRoleAssign,
    current_user: dict = Depends(require_permission("group:role:assign")),
    db: AsyncSession = Depends(get_db),
):
    """Assign roles to a group."""
    group = await _get_org_group_or_404(db, org_id, group_id)
    await _ensure_group_manageable(db, current_user, group.id)
    roles = await _resolve_org_roles_or_404(db, org_id, body.role_ids)
    if any(role.name in PROTECTED_ROLE_NAMES for role in roles) and not _can_manage_protected_access(current_user):
        raise HTTPException(
            status_code=403,
            detail={
                "error": "protected_role_forbidden",
                "error_description": "Only organization admins can assign administrator roles to groups.",
            },
        )

    assigned = await assign_roles(db, group_id, body.role_ids)

    for rid in assigned:
        await write_audit_event(
            db, "group.role_assigned", "group", str(group_id),
            org_id=org_id, actor_id=current_user["user_id"],
            metadata={"group_id": str(group_id), "role_id": str(rid)}
        )

    member_rows = await db.execute(
        select(User).join(GroupMember, GroupMember.user_id == User.id).where(GroupMember.group_id == group_id)
    )
    for user in member_rows.scalars().all():
        await send_notification_event(
            db=db,
            user=user,
            event_key="account.role_changed",
            title="Access role updated",
            message=f"Role assignments changed for group '{group.name}'.",
        )
    if assigned:
        await send_admin_activity_notification(
            db=db,
            org_id=org_id,
            actor_user_id=current_user["user_id"],
            title="Group roles updated",
            message=f"{current_user.get('email', 'An admin')} assigned {len(assigned)} role(s) to group '{group.name}'.",
        )

    return {"message": f"Assigned {len(assigned)} roles", "assigned": [str(rid) for rid in assigned]}


@router.delete("/{group_id}/roles/{role_id}")
async def remove_role_endpoint(
    org_id: UUID,
    group_id: UUID,
    role_id: UUID,
    current_user: dict = Depends(require_permission("group:role:update")),
    db: AsyncSession = Depends(get_db),
):
    """Remove a role from a group."""
    group = await _get_org_group_or_404(db, org_id, group_id)
    role = await get_role(db, role_id)
    if not role or role.org_id != org_id:
        raise HTTPException(404, detail={"error": "not_found", "error_description": "Role not found"})
    if role.name in PROTECTED_ROLE_NAMES and not _can_manage_protected_access(current_user):
        raise HTTPException(
            status_code=403,
            detail={
                "error": "protected_role_forbidden",
                "error_description": "Only organization admins can remove administrator roles from groups.",
            },
        )
    await _ensure_group_manageable(db, current_user, group.id)
    success = await remove_role(db, group_id, role_id)
    if not success:
        raise HTTPException(404, detail={"error": "not_found", "error_description": "Role not assigned to group"})

    member_rows = await db.execute(
        select(User).join(GroupMember, GroupMember.user_id == User.id).where(GroupMember.group_id == group_id)
    )
    for user in member_rows.scalars().all():
        await send_notification_event(
            db=db,
            user=user,
            event_key="account.role_changed",
            title="Access role updated",
            message=f"Role assignments changed for group '{group.name}'.",
        )
    await send_admin_activity_notification(
        db=db,
        org_id=org_id,
        actor_user_id=current_user["user_id"],
        title="Group roles updated",
        message=f"{current_user.get('email', 'An admin')} removed a role from group '{group.name}'.",
    )
    return {"message": "Role removed from group"}


@router.get("/{group_id}/roles")
async def list_group_roles_endpoint(
    org_id: UUID,
    group_id: UUID,
    current_user: dict = Depends(require_permission("group:read")),
    db: AsyncSession = Depends(get_db),
):
    """Get all roles assigned to a group."""
    from app.schemas.role import RoleResponse
    await _get_org_group_or_404(db, org_id, group_id)
    roles = await get_group_roles(db, group_id)
    return {"data": [RoleResponse.model_validate(r) for r in roles]}
