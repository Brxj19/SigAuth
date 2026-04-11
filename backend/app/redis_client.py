"""Redis connection pool using aioredis."""

import redis.asyncio as aioredis
from app.config import settings

redis_pool: aioredis.Redis | None = None


async def get_redis_pool() -> aioredis.Redis:
    """Get or create the Redis connection pool."""
    global redis_pool
    if redis_pool is None:
        redis_pool = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            max_connections=20,
        )
    return redis_pool


async def close_redis_pool() -> None:
    """Close the Redis connection pool."""
    global redis_pool
    if redis_pool is not None:
        await redis_pool.close()
        redis_pool = None
