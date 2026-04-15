# Logistica Delivery Client

Logistica Delivery is a lightweight client app for demonstrating SigAuth login with app-scoped role-based access.

Roles supported:
- `admin`
- `delivery_agent`
- `end_user`

The client uses:
- `Node.js + Express` for a tiny API that verifies SigAuth tokens
- `React + Vite` for the browser UI

## Folder structure

```text
clients/logistica-delivery/
  backend/
  frontend/
```

## SigAuth setup

1. Create a new application in SigAuth.
2. Set the redirect URI to `http://localhost:4101/auth/callback`.
3. Use a client ID such as `logistica-delivery-client-id`.
4. Assign one or more groups to the application for access control.
5. Add application role mappings so SigAuth emits one of these app roles:
   - `admin`
   - `delivery_agent`
   - `end_user`

The client app uses group assignment only for access gating inside SigAuth. The client itself relies on `app_roles`.

## Backend setup

```bash
cd clients/logistica-delivery/backend
cp .env.example .env
npm install
npm run dev
```

## Frontend setup

```bash
cd clients/logistica-delivery/frontend
cp .env.example .env
npm install
npm run dev
```

## Default local ports

- Backend: `http://localhost:4100`
- Frontend: `http://localhost:4101`

## Useful env values

Backend:
- `PORT`
- `FRONTEND_URL`
- `IDP_ISSUER_URL`
- `IDP_CLIENT_ID`
- `IDP_PUBLIC_KEY_PATH`
- `LOGISTICA_ADMIN_APP_ROLES`
- `LOGISTICA_DELIVERY_AGENT_APP_ROLES`
- `LOGISTICA_END_USER_APP_ROLES`

Frontend:
- `VITE_API_URL`
- `VITE_IDP_URL`
- `VITE_IDP_CLIENT_ID`
- `VITE_IDP_REDIRECT_URI`

