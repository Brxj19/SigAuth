# Security Policy

## Cryptographic Standards

| Component | Algorithm | Details |
|-----------|-----------|---------|
| JWT Signing | RS256 | 2048-bit RSA keys |
| Password Hashing | bcrypt | Cost factor ≥ 12 |
| PKCE | S256 | SHA-256 code challenge |
| Client Secrets | HMAC-SHA256 | Hashed before storage |
| Email Verification | HMAC-SHA256 | Time-limited signed tokens |

## Authentication Security

- **Account Lockout**: 5 consecutive failures → 15-minute lockout
- **Password Policy**: Minimum 12 characters, uppercase, lowercase, digit, special character
- **Session Management**: Redis-backed with per-user session listing and revocation
- **Token Revocation**: Individual and bulk token revocation with reuse detection
- **Refresh Token Rotation**: Automatic rotation with family-based revocation on reuse

## Authorization

- **RBAC**: Group-based role inheritance with permission resolution at token issuance
- **Permission Checking**: All admin endpoints enforce fine-grained permissions
- **System Role Protection**: System roles cannot be modified or deleted
- **Multi-tenancy**: Organization-scoped data isolation

## Rate Limiting

- Login: 10 requests/minute per IP
- Token endpoint: 100 requests/minute per IP
- Authorization: 10 requests/minute per IP

## Client Security

- **PKCE Required**: Mandatory for SPA and native app types
- **Redirect URI Validation**: Exact match against registered URIs
- **Client Secret**: Never stored in plaintext; one-time display on creation
- **Secret Rotation**: Immediate invalidation of old secrets

## Audit Trail

- Append-only audit log
- All authentication events logged with IP and user agent
- All administrative actions logged with actor and resource info
- Cursor-based pagination with date range filtering

## Reporting Vulnerabilities

Please report security vulnerabilities to security@internal.com.
