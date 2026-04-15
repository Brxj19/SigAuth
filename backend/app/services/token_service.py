"""Token service: ID, Access, Refresh token issuance, revocation, and introspection."""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Optional
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.token import Token
from app.utils.jwt_utils import sign_id_token, sign_access_token, verify_token


async def issue_id_token(
    db: AsyncSession,
    user_id: UUID,
    email: str,
    email_verified: bool,
    name: str,
    given_name: str,
    family_name: str,
    org_id: UUID,
    is_super_admin: bool,
    client_id: str,
    roles: list[str],
    permissions: list[str],
    groups: list[str],
    group_ids: list[str],
    app_groups: list[str],
    app_group_ids: list[str],
    app_roles: list[str],
    scopes: list[str],
    nonce: Optional[str] = None,
    lifetime: Optional[int] = None,
) -> tuple[str, str, int]:
    """Issue an ID token and record it in the tokens table.
    
    Returns (token_string, jti, expires_in)
    """
    token_str, jti, expires_in = sign_id_token(
        user_id=str(user_id),
        email=email,
        email_verified=email_verified,
        name=name,
        given_name=given_name,
        family_name=family_name,
        org_id=str(org_id),
        is_super_admin=is_super_admin,
        client_id=client_id,
        roles=roles,
        permissions=permissions,
        groups=groups,
        group_ids=group_ids,
        app_groups=app_groups,
        app_group_ids=app_group_ids,
        app_roles=app_roles,
        nonce=nonce,
        lifetime=lifetime,
    )

    token_record = Token(
        jti=jti,
        user_id=user_id,
        client_id=client_id,
        org_id=org_id,
        token_type="id",
        scopes=scopes,
        expires_at=datetime.now(timezone.utc) + timedelta(seconds=expires_in),
    )
    db.add(token_record)
    await db.flush()

    return token_str, jti, expires_in


async def issue_access_token(
    db: AsyncSession,
    sub: str,
    org_id: UUID,
    is_super_admin: bool,
    client_id: str,
    scopes: list[str],
    roles: list[str],
    permissions: list[str],
    groups: list[str],
    group_ids: list[str],
    app_groups: list[str],
    app_group_ids: list[str],
    app_roles: list[str],
    email: Optional[str] = None,
    email_verified: Optional[bool] = None,
    name: Optional[str] = None,
    given_name: Optional[str] = None,
    family_name: Optional[str] = None,
    lifetime: Optional[int] = None,
) -> tuple[str, str, int]:
    """Issue an access token and record it in the tokens table."""
    token_str, jti, expires_in = sign_access_token(
        sub=sub,
        org_id=str(org_id),
        is_super_admin=is_super_admin,
        client_id=client_id,
        email=email,
        email_verified=email_verified,
        name=name,
        given_name=given_name,
        family_name=family_name,
        scopes=scopes,
        roles=roles,
        permissions=permissions,
        groups=groups,
        group_ids=group_ids,
        app_groups=app_groups,
        app_group_ids=app_group_ids,
        app_roles=app_roles,
        lifetime=lifetime,
    )

    # For M2M tokens there is no user_id — use a sentinel UUID
    try:
        user_uuid = UUID(sub)
    except ValueError:
        user_uuid = None

    token_record = Token(
        jti=jti,
        user_id=user_uuid if user_uuid else UUID("00000000-0000-0000-0000-000000000000"),
        client_id=client_id,
        org_id=org_id,
        token_type="access",
        scopes=scopes,
        expires_at=datetime.now(timezone.utc) + timedelta(seconds=expires_in),
    )
    db.add(token_record)
    await db.flush()

    return token_str, jti, expires_in


async def issue_refresh_token(
    db: AsyncSession,
    user_id: UUID,
    org_id: UUID,
    client_id: str,
    scopes: list[str],
) -> str:
    """Issue an opaque refresh token (stored as jti) and record it.
    
    Returns the refresh token string (which is the jti).
    """
    jti = str(uuid.uuid4())

    token_record = Token(
        jti=jti,
        user_id=user_id,
        client_id=client_id,
        org_id=org_id,
        token_type="refresh",
        scopes=scopes,
        expires_at=datetime.now(timezone.utc) + timedelta(days=30),  # 30-day refresh token
    )
    db.add(token_record)
    await db.flush()

    return jti


async def get_token_by_jti(db: AsyncSession, jti: str) -> Optional[Token]:
    """Look up a token record by its jti."""
    result = await db.execute(select(Token).where(Token.jti == jti))
    return result.scalar_one_or_none()


async def revoke_token(db: AsyncSession, jti: str, reason: str = "logout") -> bool:
    """Revoke a token by setting revoked=True."""
    token = await get_token_by_jti(db, jti)
    if not token:
        return False
    token.revoked = True
    token.revoked_at = datetime.now(timezone.utc)
    token.revoke_reason = reason
    await db.flush()
    return True


async def revoke_all_user_tokens(db: AsyncSession, user_id: UUID, reason: str = "session_revoked") -> int:
    """Revoke all tokens for a given user. Returns count of revoked tokens."""
    now = datetime.now(timezone.utc)
    result = await db.execute(
        update(Token)
        .where(Token.user_id == user_id, Token.revoked == False)
        .values(revoked=True, revoked_at=now, revoke_reason=reason)
    )
    await db.flush()
    return result.rowcount


async def revoke_all_client_tokens(db: AsyncSession, client_id: str, reason: str = "app_deleted") -> int:
    """Revoke all tokens for a given client_id."""
    now = datetime.now(timezone.utc)
    result = await db.execute(
        update(Token)
        .where(Token.client_id == client_id, Token.revoked == False)
        .values(revoked=True, revoked_at=now, revoke_reason=reason)
    )
    await db.flush()
    return result.rowcount


async def revoke_token_family(db: AsyncSession, user_id: UUID, client_id: str, reason: str = "reuse_detected") -> int:
    """Revoke entire token family (all tokens for user+client_id). Used for refresh token reuse detection."""
    now = datetime.now(timezone.utc)
    result = await db.execute(
        update(Token)
        .where(Token.user_id == user_id, Token.client_id == client_id, Token.revoked == False)
        .values(revoked=True, revoked_at=now, revoke_reason=reason)
    )
    await db.flush()
    return result.rowcount


async def get_user_token_jtis(db: AsyncSession, user_id: UUID) -> list[str]:
    """Get all active JTIs for a user (for Redis session cleanup)."""
    result = await db.execute(
        select(Token.jti).where(
            Token.user_id == user_id,
            Token.revoked == False,
            Token.expires_at > datetime.now(timezone.utc),
        )
    )
    return [row[0] for row in result.all()]


async def introspect_token(db: AsyncSession, jti: str) -> Optional[dict[str, Any]]:
    """Introspect a token by jti. Returns None if inactive."""
    token = await get_token_by_jti(db, jti)
    if not token:
        return None
    if token.revoked or token.expires_at < datetime.now(timezone.utc):
        return None
    return {
        "active": True,
        "jti": token.jti,
        "user_id": str(token.user_id),
        "client_id": token.client_id,
        "org_id": str(token.org_id),
        "token_type": token.token_type,
        "scopes": token.scopes,
        "expires_at": token.expires_at,
    }
