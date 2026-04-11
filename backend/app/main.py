"""FastAPI application: router registration, CORS, middleware, startup."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.branding import PLATFORM_DESCRIPTION, PRODUCT_NAME
from app.config import settings
from app.database import engine, async_session_factory
from app.redis_client import get_redis_pool, close_redis_pool
from app.utils.jwt_utils import initialize_keys
from app.middleware.audit_middleware import AuditMiddleware
from app.middleware.rate_limit import RateLimitMiddleware
from app.models.application import Application

# Import all routers
from app.routers import auth, organizations, applications, users, groups, roles, sessions, audit, health, email_deliveries, notifications, developer_docs, me


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown events."""
    # Startup
    initialize_keys()
    await get_redis_pool()
    yield
    # Shutdown
    await close_redis_pool()
    await engine.dispose()


app = FastAPI(
    title=PRODUCT_NAME,
    description=PLATFORM_DESCRIPTION,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# ─── CORS ─────────────────────────────────────────────────────────────
# Dynamic origins from registered redirect_uris + default dev origins
CORS_ORIGINS = [
    "http://localhost:3000",  # Admin Console
    "http://localhost:4000",  # Client App 1
    "http://localhost:4001",  # Client App 2
    "http://localhost:5173",  # Vite dev
    "http://localhost:5174",
    "http://localhost:5175",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ─── Custom Middleware ─────────────────────────────────────────────────
app.add_middleware(AuditMiddleware)
app.add_middleware(RateLimitMiddleware)

# ─── Register Routers ─────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(organizations.router)
app.include_router(organizations.org_router)
app.include_router(applications.router)
app.include_router(users.router)
app.include_router(groups.router)
app.include_router(roles.router)
app.include_router(sessions.router)
app.include_router(me.router)
app.include_router(audit.router)
app.include_router(email_deliveries.admin_router)
app.include_router(email_deliveries.org_router)
app.include_router(notifications.router)
app.include_router(developer_docs.router)
app.include_router(health.router)


# ─── Root endpoint ────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "name": PRODUCT_NAME,
        "version": "1.0.0",
        "developer_docs": "/docs",
        "api_docs": "/api/docs",
        "health": "/health",
        "openid_configuration": "/api/v1/.well-known/openid-configuration",
    }
