"""FastAPI dependencies: auth/session helpers and permission enforcement."""

from typing import Optional
from uuid import UUID

import redis.asyncio as aioredis
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_factory
from app.redis_client import get_redis_pool
from app.utils.jwt_utils import verify_token
from app.services.token_service import get_token_by_jti
from app.services.user_service import get_user, resolve_rbac
from app.services.organization_service import get_organization, is_org_limited

security = HTTPBearer(auto_error=False)

LIMITED_ORG_BLOCKED_PERMISSIONS = {
    "org:update",
    "user:delete",
    "user:reset_password",
    "app:update",
    "app:delete",
    "group:create",
    "group:update",
    "group:delete",
    "group:member:add",
    "group:member:remove",
    "role:create",
    "role:update",
}


async def get_db():
    """Provide an async database session."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def get_redis() -> aioredis.Redis:
    """Provide a Redis connection."""
    return await get_redis_pool()


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Extract and verify the current user from the Bearer token.
    
    Returns dict with: user_id, email, org_id, is_super_admin, roles, permissions, jti, claims
    """
    if not credentials:
        raise HTTPException(status_code=401, detail={"error": "unauthorized", "error_description": "Missing authorization header"})

    token = credentials.credentials
    try:
        claims = verify_token(token)
    except JWTError as e:
        raise HTTPException(status_code=401, detail={"error": "invalid_token", "error_description": f"Invalid token: {str(e)}"})

    # Verify token is not revoked
    jti = claims.get("jti")
    if jti:
        token_record = await get_token_by_jti(db, jti)
        if token_record and token_record.revoked:
            raise HTTPException(status_code=401, detail={"error": "token_revoked", "error_description": "Token has been revoked"})

    # Get user
    user_id = claims.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail={"error": "invalid_token", "error_description": "Token missing sub claim"})

    user = await get_user(db, UUID(user_id))
    if not user:
        raise HTTPException(status_code=401, detail={"error": "user_not_found", "error_description": "User not found"})

    if user.status != "active":
        raise HTTPException(status_code=403, detail={"error": "account_inactive", "error_description": f"Account is {user.status}"})

    return {
        "user_id": UUID(user_id),
        "email": claims.get("email", ""),
        "org_id": UUID(claims.get("org_id", "")),
        "is_super_admin": bool(claims.get("is_super_admin", False) or getattr(user, "is_super_admin", False)),
        "roles": claims.get("roles", []),
        "permissions": claims.get("permissions", []),
        "jti": jti,
        "claims": claims,
        "user": user,
    }


def require_permission(*required_permissions: str):
    """Dependency factory: require the current user to have ALL specified permissions."""
    async def checker(
        request: Request,
        current_user: dict = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ):
        request_org_id_raw = request.path_params.get("org_id")
        request_org_id = UUID(request_org_id_raw) if request_org_id_raw else None

        if request_org_id and not current_user["is_super_admin"] and request_org_id != current_user["org_id"]:
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "cross_tenant_forbidden",
                    "error_description": "You do not have access to this organization",
                },
            )

        if current_user["is_super_admin"]:
            current_user["roles"] = ["super_admin"]
            current_user["permissions"] = ["*"]
            current_user["effective_org_id"] = request_org_id or current_user["org_id"]
            return current_user

        effective_org_id = request_org_id or current_user["org_id"]
        roles, permissions = await resolve_rbac(db, current_user["user_id"], effective_org_id)

        org = await get_organization(db, effective_org_id)
        if org and is_org_limited(org.settings):
            blocked = [perm for perm in required_permissions if perm in LIMITED_ORG_BLOCKED_PERMISSIONS]
            if blocked:
                raise HTTPException(
                    status_code=403,
                    detail={
                        "error": "organization_verification_required",
                        "error_description": "This organization is in limited self-serve mode. Ask a super admin to verify and unlock enterprise access.",
                    },
                )

        for perm in required_permissions:
            if perm not in permissions:
                raise HTTPException(
                    status_code=403,
                    detail={
                        "error": "insufficient_permissions",
                        "error_description": f"Missing required permission: {perm}",
                    },
                )
        current_user["roles"] = roles
        current_user["permissions"] = permissions
        current_user["effective_org_id"] = effective_org_id
        return current_user
    return checker


async def require_super_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Allow access only to platform-level administrators."""
    if not current_user["is_super_admin"]:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "super_admin_required",
                "error_description": "This action requires a super admin account",
            },
        )
    current_user["roles"] = ["super_admin"]
    current_user["permissions"] = ["*"]
    current_user["effective_org_id"] = current_user["org_id"]
    return current_user
