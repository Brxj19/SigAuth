"""TOTP-based MFA helpers and short-lived challenge management."""

import base64
import hashlib
import hmac
import io
import json
import secrets
import struct
import time
from typing import Any, Optional
from urllib.parse import quote
from uuid import UUID

import redis.asyncio as aioredis
from cryptography.fernet import Fernet, InvalidToken
from sqlalchemy.ext.asyncio import AsyncSession

from app.branding import PRODUCT_NAME
from app.config import settings
from app.models.user import User
from app.services.organization_service import get_organization

MFA_ISSUER_NAME = PRODUCT_NAME
MFA_CODE_DIGITS = 6
MFA_TIME_STEP_SECONDS = 30
MFA_ALLOWED_DRIFT_STEPS = 1
MFA_CHALLENGE_TTL_SECONDS = 300
MFA_SETUP_CACHE_TTL_SECONDS = 600
MFA_RECOVERY_CODE_COUNT = 10
MFA_RECOVERY_SEGMENT_LENGTH = 4
MFA_RECOVERY_SEGMENTS = 3
MFA_RECOVERY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def _fernet() -> Fernet:
    key_material = hashlib.sha256(f"{settings.ADMIN_SECRET}:mfa".encode("utf-8")).digest()
    return Fernet(base64.urlsafe_b64encode(key_material))


def generate_totp_secret() -> str:
    """Generate a random base32 secret suitable for TOTP apps."""
    return base64.b32encode(secrets.token_bytes(20)).decode("ascii").rstrip("=")


def encrypt_totp_secret(secret: str) -> str:
    """Encrypt a TOTP secret before storing it."""
    return _fernet().encrypt(secret.encode("utf-8")).decode("utf-8")


def decrypt_totp_secret(encrypted_secret: str) -> Optional[str]:
    """Decrypt an encrypted TOTP secret."""
    if not encrypted_secret:
        return None
    try:
        return _fernet().decrypt(encrypted_secret.encode("utf-8")).decode("utf-8")
    except (InvalidToken, ValueError, TypeError):
        return None


def build_totp_uri(secret: str, account_name: str, issuer: str = MFA_ISSUER_NAME) -> str:
    """Build otpauth URI compatible with Google Authenticator and other TOTP apps."""
    label = quote(f"{issuer}:{account_name}")
    encoded_issuer = quote(issuer)
    return (
        f"otpauth://totp/{label}"
        f"?secret={quote(secret)}&issuer={encoded_issuer}&algorithm=SHA1&digits={MFA_CODE_DIGITS}&period={MFA_TIME_STEP_SECONDS}"
    )


def build_totp_qr_data_url(otpauth_url: str) -> str:
    """Build a QR-code SVG data URL for authenticator apps."""
    import qrcode
    from qrcode.image.svg import SvgPathImage

    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=2,
    )
    qr.add_data(otpauth_url)
    qr.make(fit=True)
    image = qr.make_image(image_factory=SvgPathImage)
    buffer = io.BytesIO()
    image.save(buffer)
    svg_bytes = buffer.getvalue()
    encoded = base64.b64encode(svg_bytes).decode("ascii")
    return f"data:image/svg+xml;base64,{encoded}"


def normalize_totp_code(code: str) -> str:
    """Strip non-digits so users can paste codes with spaces."""
    return "".join(ch for ch in str(code or "") if ch.isdigit())


def normalize_recovery_code(code: str) -> str:
    """Normalize recovery code input for comparison."""
    return "".join(ch for ch in str(code or "").upper() if ch.isalnum())


def generate_recovery_codes(count: int = MFA_RECOVERY_CODE_COUNT) -> list[str]:
    """Generate one-time recovery codes for MFA fallback."""
    codes: list[str] = []
    for _ in range(count):
        segments = [
            "".join(secrets.choice(MFA_RECOVERY_ALPHABET) for _ in range(MFA_RECOVERY_SEGMENT_LENGTH))
            for _ in range(MFA_RECOVERY_SEGMENTS)
        ]
        codes.append("-".join(segments))
    return codes


def _hash_recovery_code(code: str) -> str:
    normalized = normalize_recovery_code(code)
    digest = hmac.new(
        f"{settings.ADMIN_SECRET}:mfa-recovery".encode("utf-8"),
        normalized.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return digest


def serialize_recovery_codes(codes: list[str]) -> str:
    """Store only hashed recovery codes."""
    return json.dumps([_hash_recovery_code(code) for code in codes])


def _deserialize_recovery_codes(serialized_codes: Optional[str]) -> list[str]:
    if not serialized_codes:
        return []
    try:
        data = json.loads(serialized_codes)
    except json.JSONDecodeError:
        return []
    if not isinstance(data, list):
        return []
    return [str(item) for item in data if str(item or "").strip()]


def count_recovery_codes(serialized_codes: Optional[str]) -> int:
    """Return the number of remaining recovery codes."""
    return len(_deserialize_recovery_codes(serialized_codes))


def verify_and_consume_recovery_code(serialized_codes: Optional[str], candidate_code: str) -> tuple[bool, Optional[str], int]:
    """Verify and consume a recovery code if it matches."""
    stored_hashes = _deserialize_recovery_codes(serialized_codes)
    if not stored_hashes:
        return False, serialized_codes, 0

    candidate_hash = _hash_recovery_code(candidate_code)
    for index, stored_hash in enumerate(stored_hashes):
        if hmac.compare_digest(stored_hash, candidate_hash):
            remaining_hashes = stored_hashes[:index] + stored_hashes[index + 1:]
            updated = json.dumps(remaining_hashes) if remaining_hashes else None
            return True, updated, len(remaining_hashes)
    return False, serialized_codes, len(stored_hashes)


def _totp_at_counter(secret: str, counter: int, digits: int = MFA_CODE_DIGITS) -> str:
    padded = secret.upper()
    missing_padding = (-len(padded)) % 8
    if missing_padding:
        padded += "=" * missing_padding
    key = base64.b32decode(padded, casefold=True)
    msg = struct.pack(">Q", counter)
    digest = hmac.new(key, msg, hashlib.sha1).digest()
    offset = digest[-1] & 0x0F
    code_int = struct.unpack(">I", digest[offset:offset + 4])[0] & 0x7FFFFFFF
    return str(code_int % (10 ** digits)).zfill(digits)


def verify_totp_code(secret: str, code: str, at_time: Optional[int] = None) -> bool:
    """Verify a TOTP code allowing small clock skew."""
    normalized = normalize_totp_code(code)
    if len(normalized) != MFA_CODE_DIGITS:
        return False

    reference_time = at_time or int(time.time())
    counter = reference_time // MFA_TIME_STEP_SECONDS
    for offset in range(-MFA_ALLOWED_DRIFT_STEPS, MFA_ALLOWED_DRIFT_STEPS + 1):
        if hmac.compare_digest(_totp_at_counter(secret, counter + offset), normalized):
            return True
    return False


async def get_mfa_requirement(db: AsyncSession, user: User) -> str:
    """Return one of: none, verify, setup."""
    org = await get_organization(db, user.org_id)
    org_settings = org.settings if org else {}
    org_enforced = isinstance(org_settings, dict) and bool(org_settings.get("enforce_mfa"))

    if user.mfa_enabled and user.mfa_secret:
        return "verify"
    if org_enforced:
        return "setup"
    return "none"


async def is_org_mfa_enforced(db: AsyncSession, user: User) -> bool:
    """Whether the user's tenant currently requires MFA."""
    org = await get_organization(db, user.org_id)
    org_settings = org.settings if org else {}
    return isinstance(org_settings, dict) and bool(org_settings.get("enforce_mfa"))


async def cache_pending_mfa_setup(redis: aioredis.Redis, user_id: UUID, secret: str) -> None:
    """Cache a pending setup secret for an authenticated user."""
    await redis.set(
        f"mfa_setup:{user_id}",
        json.dumps({"secret": secret}),
        ex=MFA_SETUP_CACHE_TTL_SECONDS,
    )


async def get_pending_mfa_setup(redis: aioredis.Redis, user_id: UUID) -> Optional[str]:
    """Get a cached pending setup secret."""
    payload = await redis.get(f"mfa_setup:{user_id}")
    if not payload:
        return None
    try:
        data = json.loads(payload)
    except json.JSONDecodeError:
        return None
    return str(data.get("secret") or "")


async def clear_pending_mfa_setup(redis: aioredis.Redis, user_id: UUID) -> None:
    """Clear pending authenticated setup."""
    await redis.delete(f"mfa_setup:{user_id}")


async def create_mfa_challenge(
    redis: aioredis.Redis,
    *,
    user_id: UUID,
    email: str,
    flow: str,
    challenge_type: str,
    client_id: str = "admin-console",
    ip_address: str = "",
    user_agent: str = "",
    state: Optional[str] = None,
    pending_secret: Optional[str] = None,
) -> str:
    """Create a short-lived MFA challenge for login or authorize flows."""
    token = secrets.token_urlsafe(32)
    payload: dict[str, Any] = {
        "user_id": str(user_id),
        "email": email,
        "flow": flow,
        "challenge_type": challenge_type,
        "client_id": client_id,
        "ip_address": ip_address,
        "user_agent": user_agent,
        "state": state,
    }
    if pending_secret:
        payload["pending_secret"] = pending_secret
    await redis.set(f"mfa_challenge:{token}", json.dumps(payload), ex=MFA_CHALLENGE_TTL_SECONDS)
    return token


async def get_mfa_challenge(redis: aioredis.Redis, challenge_token: str) -> Optional[dict[str, Any]]:
    """Return MFA challenge payload from Redis."""
    payload = await redis.get(f"mfa_challenge:{challenge_token}")
    if not payload:
        return None
    try:
        return json.loads(payload)
    except json.JSONDecodeError:
        return None


async def delete_mfa_challenge(redis: aioredis.Redis, challenge_token: str) -> None:
    """Delete MFA challenge from Redis."""
    await redis.delete(f"mfa_challenge:{challenge_token}")
