"""Redis sliding-window rate limiter middleware."""

import time
from typing import Callable, Optional
from uuid import UUID

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from jose import JWTError
from sqlalchemy import select

from app.config import settings
from app.database import async_session_factory
from app.models.organization import Organization
from app.redis_client import get_redis_pool
from app.utils.jwt_utils import verify_token


# Rate limit rules: (path_prefix, key_extractor, max_requests, window_seconds)
RATE_LIMIT_RULES = [
    {
        "path": "/api/v1/login",
        "key_type": "ip",
        "max_requests": 10,
        "window": 60,
    },
    {
        "path": "/api/v1/token",
        "key_type": "client_id",
        "max_requests": 100,
        "window": 60,
    },
    {
        "path": "/api/v1/authorize/submit",
        "key_type": "ip",
        "max_requests": 10,
        "window": 60,
    },
]


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Redis sliding-window rate limiter."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if not settings.RATE_LIMIT_ENABLED:
            return await call_next(request)

        path = request.url.path
        rule = self._find_rule(path)

        if not rule:
            return await call_next(request)

        try:
            redis = await get_redis_pool()
        except Exception:
            # If Redis is unavailable, allow the request
            return await call_next(request)

        limited_org_response = await self._enforce_limited_org_rate_limit(request, redis)
        if limited_org_response is not None:
            return limited_org_response

        # Extract rate limit key
        key = self._extract_key(request, rule)
        if not key:
            return await call_next(request)

        redis_key = f"rate_limit:{rule['path']}:{key}"
        exceeded, retry_after = await self._check_rate_limit(redis, redis_key, rule["max_requests"], rule["window"])
        if exceeded:
            return JSONResponse(
                status_code=429,
                content={
                    "error": "rate_limit_exceeded",
                    "error_description": f"Rate limit exceeded. Max {rule['max_requests']} requests per {rule['window']} seconds.",
                },
                headers={"Retry-After": str(max(retry_after, 1))},
            )

        return await call_next(request)

    async def _check_rate_limit(self, redis, redis_key: str, max_requests: int, window: int) -> tuple[bool, int]:
        """Sliding-window check. Returns (exceeded, retry_after)."""
        now = time.time()
        try:
            pipe = redis.pipeline()
            await pipe.zremrangebyscore(redis_key, 0, now - window)
            await pipe.zadd(redis_key, {str(now): now})
            await pipe.zcard(redis_key)
            await pipe.expire(redis_key, window)
            results = await pipe.execute()
            request_count = results[2]
            if request_count > max_requests:
                oldest_entries = await redis.zrange(redis_key, 0, 0)
                if oldest_entries:
                    retry_after = int(window - (now - float(oldest_entries[0])))
                else:
                    retry_after = window
                return True, max(retry_after, 1)
        except Exception:
            return False, 0
        return False, 0

    async def _enforce_limited_org_rate_limit(self, request: Request, redis) -> Optional[Response]:
        """Apply stricter rate limit for limited self-serve organizations."""
        path = request.url.path
        if not path.startswith("/api/v1/organizations/"):
            return None

        auth_header = request.headers.get("authorization", "")
        if not auth_header.startswith("Bearer "):
            return None

        token = auth_header[7:].strip()
        try:
            claims = verify_token(token)
        except JWTError:
            return None

        org_id_raw = claims.get("org_id")
        if not org_id_raw:
            return None

        try:
            org_id = UUID(str(org_id_raw))
        except Exception:
            return None

        is_limited = False
        try:
            async with async_session_factory() as db:
                result = await db.execute(select(Organization).where(Organization.id == org_id, Organization.deleted_at.is_(None)))
                org = result.scalar_one_or_none()
                settings = (org.settings or {}) if org else {}
                is_limited = str(settings.get("access_tier") or "") == "limited"
        except Exception:
            return None

        if not is_limited:
            return None

        user_part = str(claims.get("sub") or (request.client.host if request.client else "unknown"))
        redis_key = f"rate_limit:limited_org:{org_id}:{user_part}"
        max_requests = 80
        window = 60
        exceeded, retry_after = await self._check_rate_limit(redis, redis_key, max_requests, window)
        if not exceeded:
            return None

        return JSONResponse(
            status_code=429,
            content={
                "error": "rate_limit_exceeded",
                "error_description": "Free-tier organizations have stricter API rate limits. Upgrade to enterprise for higher throughput.",
            },
            headers={"Retry-After": str(max(retry_after, 1))},
        )

    def _find_rule(self, path: str) -> Optional[dict]:
        """Find the matching rate limit rule for the given path."""
        for rule in RATE_LIMIT_RULES:
            if path == rule["path"] or path.startswith(rule["path"]):
                return rule
        return None

    def _extract_key(self, request: Request, rule: dict) -> Optional[str]:
        """Extract the rate limit key based on rule type."""
        if rule["key_type"] == "ip":
            return request.client.host if request.client else "unknown"
        elif rule["key_type"] == "client_id":
            # Try to get client_id from form data or query params
            # For token endpoint, client_id is in the form body
            # We use the IP as fallback since we can't read the body here
            return request.client.host if request.client else "unknown"
        return None
