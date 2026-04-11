"""Organizations router: full org CRUD + suspend/activate."""

from typing import Optional
from uuid import UUID
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.organization import Organization

from app.dependencies import get_db, require_super_admin, require_permission
from app.schemas.organization import (
    OrganizationCreate, OrganizationUpdate, OrganizationResponse, OrganizationListResponse,
    OrganizationCreateResponse, BootstrapAdminResponse,
    UpgradeRequestCreate, PlanStatusResponse, PendingUpgradeRequestListResponse, PendingUpgradeRequestItem,
)
from app.services.organization_service import (
    create_organization_with_admin, get_organization, list_organizations,
    update_organization, suspend_organization, activate_organization, soft_delete_organization,
    set_organization_access_tier, get_org_access_tier, get_org_limits,
)
from app.services.audit_service import write_audit_event

router = APIRouter(prefix="/api/v1/admin/organizations", tags=["organizations"])
org_router = APIRouter(prefix="/api/v1/organizations/{org_id}", tags=["organizations"])


@router.post("", response_model=OrganizationCreateResponse, status_code=201)
async def create_org(
    body: OrganizationCreate,
    current_user: dict = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create organization, seed roles, and bootstrap the first org admin."""
    try:
        org, bootstrap_admin = await create_organization_with_admin(
            db,
            name=body.name,
            slug=body.slug,
            admin_email=body.bootstrap_admin.email,
            admin_password=body.bootstrap_admin.password,
            admin_first_name=body.bootstrap_admin.first_name,
            admin_last_name=body.bootstrap_admin.last_name,
            display_name=body.display_name,
            org_settings=body.settings,
        )
    except ValueError as exc:
        raise HTTPException(400, detail={"error": "invalid_request", "error_description": str(exc)})

    await write_audit_event(
        db, "org.created", "organization", str(org.id),
        org_id=org.id, actor_id=current_user["user_id"],
        metadata={
            "name": org.name,
            "slug": org.slug,
            "bootstrap_admin_email": bootstrap_admin.email,
            "bootstrap_admin_id": str(bootstrap_admin.id),
        }
    )

    return OrganizationCreateResponse(
        **OrganizationResponse.model_validate(org).model_dump(),
        bootstrap_admin=BootstrapAdminResponse.model_validate(bootstrap_admin),
    )


@router.get("", response_model=OrganizationListResponse)
async def list_orgs(
    limit: int = Query(25, ge=1, le=100),
    cursor: Optional[str] = Query(None),
    current_user: dict = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all organizations (paginated)."""
    result = await list_organizations(db, limit, cursor)
    return OrganizationListResponse(
        data=[OrganizationResponse.model_validate(org) for org in result["data"]],
        pagination=result["pagination"],
    )


@router.get("/pending-upgrade-requests", response_model=PendingUpgradeRequestListResponse)
async def list_pending_upgrade_requests(
    current_user: dict = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    """List pending free-tier upgrade requests submitted by organization admins."""
    org_rows = await db.execute(select(Organization).where(Organization.deleted_at.is_(None)))
    organizations = org_rows.scalars().all()
    items: list[PendingUpgradeRequestItem] = []
    for org in organizations:
        settings = org.settings or {}
        request = settings.get("upgrade_request") if isinstance(settings, dict) else None
        if not isinstance(request, dict):
            continue
        if str(request.get("status")) != "submitted":
            continue
        submitted_at_raw = request.get("submitted_at")
        submitted_at = None
        if isinstance(submitted_at_raw, str):
            try:
                submitted_at = datetime.fromisoformat(submitted_at_raw)
            except ValueError:
                submitted_at = None
        items.append(
            PendingUpgradeRequestItem(
                org_id=org.id,
                org_name=org.display_name or org.name,
                org_slug=org.slug,
                access_tier=get_org_access_tier(settings),
                verification_status=str(settings.get("verification_status") or "pending"),
                submitted_at=submitted_at,
                submitted_by_email=request.get("submitted_by_email"),
                payload=request.get("payload") if isinstance(request.get("payload"), dict) else {},
            )
        )
    items.sort(key=lambda row: row.submitted_at or datetime.fromtimestamp(0, tz=timezone.utc), reverse=True)
    return PendingUpgradeRequestListResponse(data=items)


@router.get("/{org_id}", response_model=OrganizationResponse)
async def get_org(
    org_id: UUID,
    current_user: dict = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get organization details."""
    org = await get_organization(db, org_id)
    if not org:
        raise HTTPException(404, detail={"error": "not_found", "error_description": "Organization not found"})
    return OrganizationResponse.model_validate(org)


@router.patch("/{org_id}", response_model=OrganizationResponse)
async def update_org(
    org_id: UUID,
    body: OrganizationUpdate,
    current_user: dict = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update organization display_name and/or settings."""
    org = await update_organization(db, org_id, body.display_name, body.settings)
    if not org:
        raise HTTPException(404, detail={"error": "not_found", "error_description": "Organization not found"})
    return OrganizationResponse.model_validate(org)


@router.post("/{org_id}/suspend", response_model=OrganizationResponse)
async def suspend_org(
    org_id: UUID,
    current_user: dict = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    """Suspend an organization."""
    org = await suspend_organization(db, org_id)
    if not org:
        raise HTTPException(404, detail={"error": "not_found", "error_description": "Organization not found"})

    await write_audit_event(
        db, "org.suspended", "organization", str(org.id),
        org_id=org.id, actor_id=current_user["user_id"],
        metadata={"org_name": org.name}
    )

    return OrganizationResponse.model_validate(org)


@router.post("/{org_id}/activate", response_model=OrganizationResponse)
async def activate_org(
    org_id: UUID,
    current_user: dict = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    """Activate an organization."""
    org = await activate_organization(db, org_id)
    if not org:
        raise HTTPException(404, detail={"error": "not_found", "error_description": "Organization not found"})
    return OrganizationResponse.model_validate(org)


@router.delete("/{org_id}", status_code=200)
async def delete_org(
    org_id: UUID,
    current_user: dict = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    """Soft delete an organization."""
    org = await soft_delete_organization(db, org_id)
    if not org:
        raise HTTPException(404, detail={"error": "not_found", "error_description": "Organization not found"})
    return {"message": "Organization deleted"}


@router.post("/{org_id}/verify-enterprise", response_model=OrganizationResponse)
async def verify_organization_enterprise(
    org_id: UUID,
    current_user: dict = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    """Promote a self-serve organization to verified enterprise access."""
    try:
        org = await set_organization_access_tier(db, org_id, "verified_enterprise")
    except ValueError as exc:
        raise HTTPException(400, detail={"error": "invalid_request", "error_description": str(exc)})

    if not org:
        raise HTTPException(404, detail={"error": "not_found", "error_description": "Organization not found"})

    await write_audit_event(
        db,
        "org.access_tier.verified",
        "organization",
        str(org.id),
        org_id=org.id,
        actor_id=current_user["user_id"],
        metadata={"org_name": org.name, "access_tier": "verified_enterprise"},
    )
    return OrganizationResponse.model_validate(org)


@router.post("/{org_id}/approve-upgrade-request", response_model=OrganizationResponse)
async def approve_upgrade_request(
    org_id: UUID,
    current_user: dict = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    """Approve pending upgrade request and grant full verified enterprise access."""
    try:
        org = await set_organization_access_tier(db, org_id, "verified_enterprise")
    except ValueError as exc:
        raise HTTPException(400, detail={"error": "invalid_request", "error_description": str(exc)})
    if not org:
        raise HTTPException(404, detail={"error": "not_found", "error_description": "Organization not found"})

    settings = dict(org.settings or {})
    existing_request = settings.get("upgrade_request")
    if isinstance(existing_request, dict):
        existing_request.update(
            {
                "status": "approved",
                "approved_at": datetime.now(timezone.utc).isoformat(),
                "approved_by_user_id": str(current_user["user_id"]),
            }
        )
        settings["upgrade_request"] = existing_request
    settings["verification_status"] = "approved"
    org.settings = settings
    org.updated_at = datetime.now(timezone.utc)

    await write_audit_event(
        db,
        "org.upgrade_request.approved",
        "organization",
        str(org.id),
        org_id=org.id,
        actor_id=current_user["user_id"],
        metadata={"org_name": org.name, "access_tier": "verified_enterprise"},
    )
    return OrganizationResponse.model_validate(org)


@router.post("/{org_id}/set-limited", response_model=OrganizationResponse)
async def set_organization_limited(
    org_id: UUID,
    current_user: dict = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    """Set an organization back to limited self-serve mode."""
    try:
        org = await set_organization_access_tier(db, org_id, "limited")
    except ValueError as exc:
        raise HTTPException(400, detail={"error": "invalid_request", "error_description": str(exc)})

    if not org:
        raise HTTPException(404, detail={"error": "not_found", "error_description": "Organization not found"})

    await write_audit_event(
        db,
        "org.access_tier.limited",
        "organization",
        str(org.id),
        org_id=org.id,
        actor_id=current_user["user_id"],
        metadata={"org_name": org.name, "access_tier": "limited"},
    )
    return OrganizationResponse.model_validate(org)


@org_router.get("/plan-status", response_model=PlanStatusResponse)
async def get_plan_status(
    org_id: UUID,
    current_user: dict = Depends(require_permission("org:read")),
    db: AsyncSession = Depends(get_db),
):
    """Return current organization tier and upgrade request status for in-app display."""
    org = await get_organization(db, org_id)
    if not org:
        raise HTTPException(404, detail={"error": "not_found", "error_description": "Organization not found"})
    settings = org.settings or {}
    return PlanStatusResponse(
        org_id=org.id,
        org_name=org.display_name or org.name,
        org_slug=org.slug,
        access_tier=get_org_access_tier(settings),
        verification_status=str(settings.get("verification_status") or "pending"),
        limits=get_org_limits(settings),
        upgrade_request=settings.get("upgrade_request") if isinstance(settings.get("upgrade_request"), dict) else None,
    )


@org_router.post("/upgrade-request", response_model=PlanStatusResponse)
async def submit_upgrade_request(
    org_id: UUID,
    body: UpgradeRequestCreate,
    current_user: dict = Depends(require_permission("org:read")),
    db: AsyncSession = Depends(get_db),
):
    """Submit a free-tier upgrade request form for super-admin verification."""
    if not current_user.get("is_super_admin"):
        normalized_roles = {str(role).lower() for role in (current_user.get("roles") or [])}
        if "org:admin" not in normalized_roles:
            raise HTTPException(
                status_code=403,
                detail={"error": "org_admin_required", "error_description": "Only organization admins can submit upgrade requests."},
            )

    if not body.agree_to_terms:
        raise HTTPException(
            status_code=400,
            detail={"error": "terms_required", "error_description": "Please confirm the declaration to submit the request."},
        )

    org = await get_organization(db, org_id)
    if not org:
        raise HTTPException(404, detail={"error": "not_found", "error_description": "Organization not found"})

    settings = dict(org.settings or {})
    if get_org_access_tier(settings) == "verified_enterprise":
        raise HTTPException(
            status_code=400,
            detail={"error": "already_verified", "error_description": "Organization already has verified enterprise access."},
        )

    settings["verification_status"] = "pending_review"
    settings["upgrade_request"] = {
        "status": "submitted",
        "submitted_at": datetime.now(timezone.utc).isoformat(),
        "submitted_by_user_id": str(current_user["user_id"]),
        "submitted_by_email": current_user.get("email"),
        "payload": {
            "company_name": body.company_name,
            "company_website": body.company_website,
            "company_size": body.company_size,
            "primary_use_case": body.primary_use_case,
            "expected_monthly_users": body.expected_monthly_users,
            "requested_features": body.requested_features,
            "billing_contact_name": body.billing_contact_name,
            "billing_contact_email": body.billing_contact_email,
            "notes": body.notes,
            "agreed_to_terms": body.agree_to_terms,
        },
    }
    org.settings = settings
    org.updated_at = datetime.now(timezone.utc)

    await write_audit_event(
        db,
        "org.upgrade_request.submitted",
        "organization",
        str(org.id),
        org_id=org.id,
        actor_id=current_user["user_id"],
        metadata={"org_name": org.name, "submitted_by": current_user.get("email")},
    )

    return PlanStatusResponse(
        org_id=org.id,
        org_name=org.display_name or org.name,
        org_slug=org.slug,
        access_tier=get_org_access_tier(settings),
        verification_status=str(settings.get("verification_status") or "pending_review"),
        limits=get_org_limits(settings),
        upgrade_request=settings.get("upgrade_request"),
    )
