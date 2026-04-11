# SigAuth App Integration Guide

This guide is for external developers integrating their application with SigAuth.

It covers:
- how to register an application
- how to implement OIDC Authorization Code + PKCE
- how to validate tokens in backend APIs
- how to map groups/roles for app authorization
- what to verify in development and production

---

## 1. Integration Model

Recommended pattern for most apps:

1. Frontend redirects user to IdP `/api/v1/authorize`
2. IdP authenticates user and redirects back with `code`
3. Frontend (or backend BFF) exchanges code at `/api/v1/token`
4. App stores token and calls its own backend APIs
5. App backend validates token and enforces authorization

Important:
- IdP handles user authentication.
- Your app backend must still validate tokens and authorize every protected endpoint.

---

## 2. App Registration in Admin Console

In IdP Admin UI:

1. Go to **Applications** and create a new app
2. Choose app type:
   - `spa` for browser-only JS apps
   - `web` for server-rendered/confidential apps
   - `native` for mobile/desktop apps
   - `m2m` for service-to-service
3. Configure:
   - redirect URIs (exact values)
   - allowed scopes (`openid profile email` minimum)
   - token lifetimes
   - refresh token policy (if needed)
4. Save `client_id` (and `client_secret` if applicable)
5. (Optional but recommended) assign app-level groups for authorization scoping

---

## 3. Required Endpoints

Use these IdP endpoints:

- Authorization: `GET /api/v1/authorize`
- Token: `POST /api/v1/token`
- UserInfo: `GET /api/v1/userinfo`
- Logout (token revoke): `POST /api/v1/logout`
- OIDC discovery: `GET /api/v1/.well-known/openid-configuration`
- JWKS: `GET /api/v1/.well-known/jwks.json`
- Introspection (confidential clients): `POST /api/v1/introspect`

Base URL example:
- `http://localhost:8000`

---

## 4. SPA Flow (Authorization Code + PKCE)

### 4.1 Create authorize request

Generate:
- `state` (random UUID)
- `nonce` (random UUID)
- `code_verifier` (high-entropy random string)
- `code_challenge = base64url(SHA256(code_verifier))`

Redirect to:

```text
GET /api/v1/authorize
  ?response_type=code
  &client_id=<CLIENT_ID>
  &redirect_uri=<URL_ENCODED_REDIRECT_URI>
  &scope=openid%20profile%20email
  &state=<STATE>
  &nonce=<NONCE>
  &code_challenge=<CODE_CHALLENGE>
  &code_challenge_method=S256
```

### 4.2 Handle callback

At your `redirect_uri`:
- verify returned `state` matches stored `state`
- extract `code`

### 4.3 Exchange code for token

Send:

```http
POST /api/v1/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=<CODE>
&redirect_uri=<REDIRECT_URI>
&client_id=<CLIENT_ID>
&code_verifier=<CODE_VERIFIER>
```

Response includes `id_token` (and may include `access_token`/`refresh_token` depending on app settings).

---

## 5. Token Claims You Can Use

Common claims:

- `iss` issuer
- `sub` user ID
- `aud` client ID
- `exp` expiry
- `email`, `name`
- `org_id`
- `roles`
- `groups`
- `app_groups`
- `app_roles`

Authorization guidance:
- Prefer `app_roles` for stable app-specific authorization decisions.
- Prefer `app_groups` for app-specific authorization
- Use `groups` for org-global group membership
- Use `roles` for coarse privileges where appropriate

---

## 6. Backend Token Validation (Required)

Your backend must validate bearer tokens:

1. Verify JWT signature using IdP public keys (`JWKS` or configured PEM)
2. Verify `iss` equals your IdP issuer
3. Verify `aud` equals your app `client_id`
4. Verify `exp` and `nbf`/`iat` as needed
5. Reject invalid/expired tokens

Do not rely on frontend-only decoding for security decisions.

---

## 7. Group/Role Mapping Pattern (SigVerse-style)

Typical mapping logic:

1. If token has admin role/group -> app `admin`
2. Else if instructor group -> app `instructor`
3. Else -> app `learner`

Keep this mapping:
- centralized in one backend module
- environment-configurable (group names)
- audited when role changes are inferred from token claims

---

## 8. Logout Pattern

When user signs out:

1. App calls IdP `POST /api/v1/logout` with current bearer token
2. App clears local token storage/session
3. App redirects to login screen

This ensures token revocation is visible in IdP audit logs.

---

## 9. Security Checklist (Production)

- Use HTTPS for IdP and app URLs
- Keep redirect URI list strict (exact matches only)
- Use PKCE for public clients (SPA/native)
- Keep tokens short-lived
- Enable refresh-token rotation where needed
- Validate `state` and `nonce`
- Store secrets only on server side (never in SPA bundle)
- Implement CSRF controls for cookie-based architectures
- Add rate limiting and lockout handling
- Log auth events for incident traceability

---

## 10. Testing Checklist for Integrators

1. Login success:
   - authorize redirect works
   - token exchange returns valid JWT
2. Failure paths:
   - invalid state rejected
   - wrong redirect_uri rejected
   - bad code_verifier rejected
3. Authorization:
   - user in admin app group gets admin UI/API access
   - user outside app groups is blocked
4. Logout:
   - token revoked
   - app session cleared
5. Expiry:
   - expired token rejected by backend
6. Audit:
   - login/token/logout events visible in IdP audit logs

---

## 11. Minimal Integrator Hand-off Template

Share this with developers integrating your IdP:

- `issuer`: `http://localhost:8000` (or prod URL)
- `client_id`: `<provided per app>`
- `client_secret`: `<only for confidential clients>`
- `redirect_uris`: `<approved list>`
- `scopes`: `openid profile email`
- `discovery`: `/.well-known/openid-configuration`
- `jwks_uri`: `/.well-known/jwks.json`
- required token claims for authz: `app_groups`, `groups`, `roles`
- logout endpoint: `/api/v1/logout`

---

## 12. Quick Reference Commands (Local)

Open discovery document:

```bash
curl http://localhost:8000/api/v1/.well-known/openid-configuration
```

Open JWKS:

```bash
curl http://localhost:8000/api/v1/.well-known/jwks.json
```

---

If you want, create a separate per-app onboarding doc using this template with concrete values (client ID, redirect URIs, group names, and role mapping rules) and keep it in your app repository.
