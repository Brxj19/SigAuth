"""Health check router."""

from datetime import datetime, timezone

import redis.asyncio as aioredis
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, get_redis

router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    """Basic health check."""
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


@router.get("/health/ready")
async def health_ready(
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    """Readiness check: verify DB and Redis connectivity."""
    status = {}
    all_ok = True

    # Check DB
    try:
        await db.execute(text("SELECT 1"))
        status["db"] = "ok"
    except Exception as e:
        status["db"] = f"error: {str(e)}"
        all_ok = False

    # Check Redis
    try:
        pong = await redis.ping()
        status["redis"] = "ok" if pong else "error: no pong"
        if not pong:
            all_ok = False
    except Exception as e:
        status["redis"] = f"error: {str(e)}"
        all_ok = False

    status_code = 200 if all_ok else 503
    return JSONResponse(content=status, status_code=status_code)
