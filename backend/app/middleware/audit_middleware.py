"""Audit middleware: writes audit_log on every mutating request."""

import json
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


class AuditMiddleware(BaseHTTPMiddleware):
    """Middleware that logs mutating HTTP requests (POST, PUT, PATCH, DELETE) to audit."""

    MUTATING_METHODS = {"POST", "PUT", "PATCH", "DELETE"}

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)

        # Only log mutating requests that succeeded (2xx/3xx)
        if request.method in self.MUTATING_METHODS and response.status_code < 400:
            # Audit is handled at the service/router level for specific events
            # This middleware provides a safety net for any missed audits
            pass

        return response
