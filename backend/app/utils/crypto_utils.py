"""Crypto utilities: PKCE, HMAC-SHA256, bcrypt helpers."""

import base64
import hashlib
import hmac
import os
import re
import secrets
import string
from datetime import datetime, timedelta, timezone

from passlib.context import CryptContext

# bcrypt context with cost >= 12
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)


def hash_password(password: str) -> str:
    """Hash a password using bcrypt with cost >= 12."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


def validate_password_policy(password: str) -> tuple[bool, str]:
    """Validate password meets policy:
    - 8+ chars
    - >= 1 uppercase
    - >= 1 lowercase
    - >= 1 digit or special char

    Returns (is_valid, error_message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r"[\d\W_]", password):
        return False, "Password must contain at least one digit or special character"
    return True, ""


def generate_client_id() -> str:
    """Generate a random 32-char alphanumeric client_id."""
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(32))


def generate_client_secret() -> str:
    """Generate a random 32-byte hex client secret."""
    return secrets.token_hex(32)


def generate_auth_code() -> str:
    """Generate a cryptographically random authorization code (32 bytes hex)."""
    return secrets.token_hex(32)


def pkce_verify(code_verifier: str, code_challenge: str) -> bool:
    """Verify PKCE: BASE64URL(SHA256(code_verifier)) == code_challenge."""
    digest = hashlib.sha256(code_verifier.encode("ascii")).digest()
    computed = base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")
    return hmac.compare_digest(computed, code_challenge)


def hmac_sha256_sign(key: str, data: str) -> str:
    """Create HMAC-SHA256 signature and return base64url-encoded result."""
    sig = hmac.new(key.encode("utf-8"), data.encode("utf-8"), hashlib.sha256).digest()
    return base64.urlsafe_b64encode(sig).rstrip(b"=").decode("ascii")


def hmac_sha256_verify(key: str, data: str, signature: str) -> bool:
    """Verify HMAC-SHA256 signature."""
    expected = hmac_sha256_sign(key, data)
    return hmac.compare_digest(expected, signature)


def generate_email_verification_token(user_id: str, secret_key: str) -> str:
    """Generate email verification token: base64url(HMAC(secret, user_id:expires))."""
    expires = int((datetime.now(timezone.utc) + timedelta(hours=24)).timestamp())
    data = f"{user_id}:{expires}"
    sig = hmac_sha256_sign(secret_key, data)
    token_data = f"{data}:{sig}"
    return base64.urlsafe_b64encode(token_data.encode()).rstrip(b"=").decode("ascii")


def verify_email_verification_token(token: str, secret_key: str) -> tuple[bool, str]:
    """Verify email verification token.

    Returns (is_valid, user_id) or (False, error_message)
    """
    try:
        # Add back padding
        padding = 4 - len(token) % 4
        if padding != 4:
            token += "=" * padding
        decoded = base64.urlsafe_b64decode(token).decode("utf-8")

        parts = decoded.rsplit(":", 2)
        if len(parts) != 3:
            return False, "Invalid token format"

        user_id, expires_str, signature = parts
        data = f"{user_id}:{expires_str}"

        if not hmac_sha256_verify(secret_key, data, signature):
            return False, "Invalid signature"

        expires = int(expires_str)
        if datetime.now(timezone.utc).timestamp() > expires:
            return False, "Token expired"

        return True, user_id
    except Exception as e:
        return False, f"Invalid token: {str(e)}"


def generate_reset_token() -> str:
    """Generate a UUID-based password reset token."""
    import uuid
    return str(uuid.uuid4())
