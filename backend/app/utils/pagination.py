"""Cursor-based pagination helpers."""

import base64
import json
from datetime import datetime
from typing import Any, Optional
from uuid import UUID


def encode_cursor(record_id: str, created_at: datetime) -> str:
    """Encode a cursor from record ID and created_at timestamp."""
    payload = {
        "id": str(record_id),
        "created_at": created_at.isoformat(),
    }
    return base64.urlsafe_b64encode(json.dumps(payload).encode()).rstrip(b"=").decode("ascii")


def decode_cursor(cursor: str) -> Optional[dict[str, str]]:
    """Decode a cursor string to get the id and created_at values."""
    try:
        padding = 4 - len(cursor) % 4
        if padding != 4:
            cursor += "=" * padding
        decoded = base64.urlsafe_b64decode(cursor).decode("utf-8")
        return json.loads(decoded)
    except Exception:
        return None


def build_pagination_response(
    data: list[Any],
    total: int,
    limit: int,
    has_more: bool,
    next_cursor: Optional[str] = None,
) -> dict[str, Any]:
    """Build a standardized pagination response object."""
    return {
        "total": total,
        "limit": limit,
        "next_cursor": next_cursor,
        "has_more": has_more,
    }
