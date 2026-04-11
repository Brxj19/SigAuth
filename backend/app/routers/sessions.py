"""Sessions router: GET /me/sessions, DELETE /me/sessions/:jti."""

import json
from uuid import UUID

import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, get_redis, get_current_user
from app.schemas.token import SessionResponse
from app.services.token_service import revoke_token, get_token_by_jti

router = APIRouter(prefix="/api/v1/me/sessions", tags=["sessions"])


@router.get("")
async def list_sessions(
    current_user: dict = Depends(get_current_user),
    redis: aioredis.Redis = Depends(get_redis),
):
    """List all active sessions for the current user."""
    user_id = str(current_user["user_id"])

    # Scan Redis for session keys
    sessions = []
    async for key in redis.scan_iter(match="session:*"):
        data = await redis.get(key)
        if data:
            try:
                session = json.loads(data)
                if session.get("user_id") == user_id:
                    sessions.append(SessionResponse(
                        jti=session.get("jti", ""),
                        user_id=session.get("user_id", ""),
                        client_id=session.get("client_id"),
                        ip_address=session.get("ip_address"),
                        user_agent=session.get("user_agent"),
                    ))
            except json.JSONDecodeError:
                continue

    return {"data": [s.model_dump() for s in sessions]}


@router.delete("/{jti}")
async def revoke_session(
    jti: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    """Revoke a specific session. Verify ownership."""
    # Check session exists and belongs to current user
    session_data = await redis.get(f"session:{jti}")
    if session_data:
        try:
            session = json.loads(session_data)
            if session.get("user_id") != str(current_user["user_id"]):
                raise HTTPException(403, detail={"error": "forbidden", "error_description": "Session does not belong to you"})
        except json.JSONDecodeError:
            pass

    # Revoke token in DB
    await revoke_token(db, jti, reason="session_revoked")

    # Delete Redis key
    await redis.delete(f"session:{jti}")

    return {"message": "Session revoked"}
