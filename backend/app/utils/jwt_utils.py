"""JWT utilities: RS256 signing, verification, and JWKS building."""

import hashlib
import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from jose import jwt, JWTError

from app.config import settings

_private_key: Optional[str] = None
_public_key: Optional[str] = None
_kid: Optional[str] = None
ADMIN_CONSOLE_AUDIENCE = "admin-console"


def _ensure_keys_exist() -> None:
    """Generate RSA 2048-bit key pair if they don't exist."""
    priv_path = settings.RSA_PRIVATE_KEY_PATH
    pub_path = settings.RSA_PUBLIC_KEY_PATH

    os.makedirs(os.path.dirname(priv_path), exist_ok=True)

    if not os.path.exists(priv_path) or not os.path.exists(pub_path):
        key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

        private_pem = key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        )

        public_pem = key.public_key().public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )

        with open(priv_path, "wb") as f:
            f.write(private_pem)
        with open(pub_path, "wb") as f:
            f.write(public_pem)


def _load_keys() -> None:
    """Load RSA keys from disk and compute kid."""
    global _private_key, _public_key, _kid

    _ensure_keys_exist()

    with open(settings.RSA_PRIVATE_KEY_PATH, "r") as f:
        _private_key = f.read()
    with open(settings.RSA_PUBLIC_KEY_PATH, "r") as f:
        _public_key = f.read()

    # kid = first 16 hex chars of SHA256 fingerprint of DER-encoded public key
    from cryptography.hazmat.primitives.serialization import load_pem_public_key
    pub_key = load_pem_public_key(_public_key.encode())
    der_bytes = pub_key.public_bytes(
        encoding=serialization.Encoding.DER,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    _kid = hashlib.sha256(der_bytes).hexdigest()[:16]


def get_private_key() -> str:
    """Get the RSA private key PEM string."""
    if _private_key is None:
        _load_keys()
    return _private_key


def get_public_key() -> str:
    """Get the RSA public key PEM string."""
    if _public_key is None:
        _load_keys()
    return _public_key


def get_kid() -> str:
    """Get the key ID."""
    if _kid is None:
        _load_keys()
    return _kid


def build_audience_claims(
    *,
    client_id: str,
    roles: list[str],
    permissions: list[str],
    groups: list[str],
    group_ids: list[str],
    app_groups: list[str],
    app_group_ids: list[str],
    app_roles: list[str],
) -> dict[str, list[str]]:
    """Shape authorization claims according to token audience."""
    if client_id == ADMIN_CONSOLE_AUDIENCE:
        return {
            "roles": roles,
            "permissions": permissions,
            "groups": groups,
            "group_ids": group_ids,
            "app_groups": app_groups,
            "app_group_ids": app_group_ids,
            "app_roles": app_roles,
        }

    return {
        "roles": roles,
        "permissions": [],
        "groups": [],
        "group_ids": [],
        "app_groups": app_groups,
        "app_group_ids": app_group_ids,
        "app_roles": app_roles,
    }


def sign_id_token(
    user_id: str,
    email: str,
    email_verified: bool,
    name: str,
    given_name: str,
    family_name: str,
    org_id: str,
    is_super_admin: bool,
    client_id: str,
    roles: list[str],
    permissions: list[str],
    groups: list[str],
    group_ids: list[str],
    app_groups: list[str],
    app_group_ids: list[str],
    app_roles: list[str],
    nonce: Optional[str] = None,
    lifetime: Optional[int] = None,
    jti: Optional[str] = None,
) -> tuple[str, str, int]:
    """Sign an ID Token with RS256.

    Returns: (token_string, jti, expires_in)
    """
    now = datetime.now(timezone.utc)
    token_lifetime = lifetime or settings.ID_TOKEN_LIFETIME
    exp = now + timedelta(seconds=token_lifetime)
    token_jti = jti or str(uuid.uuid4())
    audience_claims = build_audience_claims(
        client_id=client_id,
        roles=roles,
        permissions=permissions,
        groups=groups,
        group_ids=group_ids,
        app_groups=app_groups,
        app_group_ids=app_group_ids,
        app_roles=app_roles,
    )

    payload: dict[str, Any] = {
        "iss": settings.ISSUER_URL,
        "sub": user_id,
        "aud": client_id,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
        "jti": token_jti,
        "email": email,
        "email_verified": email_verified,
        "name": name,
        "given_name": given_name,
        "family_name": family_name,
        "org_id": org_id,
        "is_super_admin": is_super_admin,
        **audience_claims,
    }

    if nonce:
        payload["nonce"] = nonce

    headers = {
        "alg": "RS256",
        "kid": get_kid(),
        "typ": "JWT",
    }

    token = jwt.encode(payload, get_private_key(), algorithm="RS256", headers=headers)
    return token, token_jti, token_lifetime


def sign_access_token(
    sub: str,
    org_id: str,
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
    jti: Optional[str] = None,
) -> tuple[str, str, int]:
    """Sign an Access Token with RS256.

    Returns: (token_string, jti, expires_in)
    """
    now = datetime.now(timezone.utc)
    token_lifetime = lifetime or settings.ACCESS_TOKEN_LIFETIME
    exp = now + timedelta(seconds=token_lifetime)
    token_jti = jti or str(uuid.uuid4())
    audience_claims = build_audience_claims(
        client_id=client_id,
        roles=roles,
        permissions=permissions,
        groups=groups,
        group_ids=group_ids,
        app_groups=app_groups,
        app_group_ids=app_group_ids,
        app_roles=app_roles,
    )

    payload: dict[str, Any] = {
        "iss": settings.ISSUER_URL,
        "sub": sub,
        "aud": client_id,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
        "jti": token_jti,
        "org_id": org_id,
        "is_super_admin": is_super_admin,
        "scope": " ".join(scopes),
        **audience_claims,
        "token_type": "access",
    }

    if email is not None:
        payload["email"] = email
    if email_verified is not None:
        payload["email_verified"] = email_verified
    if name is not None:
        payload["name"] = name
    if given_name is not None:
        payload["given_name"] = given_name
    if family_name is not None:
        payload["family_name"] = family_name

    headers = {
        "alg": "RS256",
        "kid": get_kid(),
        "typ": "JWT",
    }

    token = jwt.encode(payload, get_private_key(), algorithm="RS256", headers=headers)
    return token, token_jti, token_lifetime


def verify_token(token: str) -> dict[str, Any]:
    """Verify an RS256 JWT and return claims.

    Raises JWTError on invalid token.
    """
    try:
        claims = jwt.decode(
            token,
            get_public_key(),
            algorithms=["RS256"],
            options={
                "verify_aud": False,  # We verify aud manually per-endpoint
                "verify_iss": True,
            },
            issuer=settings.ISSUER_URL,
        )
        return claims
    except JWTError:
        raise


def build_jwks() -> dict:
    """Build JWKS response from public key(s)."""
    from cryptography.hazmat.primitives.serialization import load_pem_public_key
    import base64

    keys = []

    # Primary key
    pub_key_obj = load_pem_public_key(get_public_key().encode())
    pub_numbers = pub_key_obj.public_numbers()

    def _int_to_base64url(value: int) -> str:
        byte_length = (value.bit_length() + 7) // 8
        value_bytes = value.to_bytes(byte_length, byteorder="big")
        return base64.urlsafe_b64encode(value_bytes).rstrip(b"=").decode("ascii")

    primary_jwk = {
        "kty": "RSA",
        "use": "sig",
        "kid": get_kid(),
        "alg": "RS256",
        "n": _int_to_base64url(pub_numbers.n),
        "e": _int_to_base64url(pub_numbers.e),
    }
    keys.append(primary_jwk)

    # Check for rotated key pair (public2.pem)
    secondary_pub_path = settings.RSA_PUBLIC_KEY_PATH.replace("public.pem", "public2.pem")
    if os.path.exists(secondary_pub_path):
        mtime = os.path.getmtime(secondary_pub_path)
        age_hours = (datetime.now(timezone.utc).timestamp() - mtime) / 3600

        with open(secondary_pub_path, "r") as f:
            sec_pub_pem = f.read()

        sec_pub_key = load_pem_public_key(sec_pub_pem.encode())
        sec_numbers = sec_pub_key.public_numbers()
        sec_der = sec_pub_key.public_bytes(
            encoding=serialization.Encoding.DER,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )
        sec_kid = hashlib.sha256(sec_der).hexdigest()[:16]

        sec_jwk = {
            "kty": "RSA",
            "use": "sig",
            "kid": sec_kid,
            "alg": "RS256",
            "n": _int_to_base64url(sec_numbers.n),
            "e": _int_to_base64url(sec_numbers.e),
        }

        if age_hours < 24:
            # Both keys active during rotation window
            keys.append(sec_jwk)

    return {"keys": keys}


def initialize_keys() -> None:
    """Initialize RSA keys on startup."""
    _load_keys()
