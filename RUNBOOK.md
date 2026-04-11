# SigAuth Runbook

This is the detailed local setup guide for the full SigAuth project, including the admin console, backend APIs, seeded demo data, MailHog email capture, billing lifecycle scripts, tests, and the SigVerse client-app integration flow.

## 1. What This Repository Contains

| Component | Default Port | Purpose |
| --- | ---: | --- |
| SigAuth backend | `8000` | OIDC provider, admin APIs, MFA, notifications, billing, email queue |
| SigAuth frontend | `3000` | Admin console and landing pages |
| HR Portal demo client | `4000` | Sample web client |
| Project Tracker demo client | `4001` | Sample SPA client |
| SigVerse frontend | `5173` | OIDC-integrated sample learning app |
| SigVerse backend | `3100` | Resource server validating SigAuth tokens |
| PostgreSQL | `5432` | Primary SigAuth database |
| Redis | `6379` | Sessions, MFA/login cache, rate limiting |
| MailHog SMTP | `1025` | Local outgoing email capture |
| MailHog UI | `8025` | Inspect emails in the browser |

## 2. Prerequisites

Install these first:

- Python `3.11+`
- Node.js `18+` or `20+`
- PostgreSQL `15+`
- Redis `7+`
- Docker optional, but easiest for MailHog
- For SigVerse only: MySQL and MongoDB

On macOS with Homebrew, a typical local setup is:

```bash
brew install python@3.11 node postgresql redis
brew services start postgresql
brew services start redis
```

## 3. Repository Setup

From the project root:

```bash
cd /Users/as-mac-1293/Desktop/mini-okta-v2.2
```

If you have not created the database yet:

```bash
createdb idp
```

If `createdb idp` says the database already exists, that is fine.

## 4. Backend Environment Setup

The backend reads configuration from `backend/.env`.

Create or update `backend/.env` with at least this local-development baseline:

```dotenv
DATABASE_URL=postgresql+asyncpg://localhost:5432/idp
REDIS_URL=redis://localhost:6379/0

RSA_PRIVATE_KEY_PATH=secrets/private.pem
RSA_PUBLIC_KEY_PATH=secrets/public.pem
ISSUER_URL=http://localhost:8000
ADMIN_CONSOLE_URL=http://localhost:3000

ADMIN_EMAIL=admin@internal.com
ADMIN_SECRET=changeme_admin_secret!

SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_PASSWORD=
SMTP_FROM=noreply@internal.com
SMTP_USE_TLS=false
SMTP_STARTTLS=false

PAYMENTS_PROVIDER=demo
BILLING_CURRENCY=INR
SUBSCRIPTION_CYCLE_DAYS=30

RATE_LIMIT_ENABLED=true
ACCESS_TOKENS_ENABLED=true
REFRESH_TOKENS_ENABLED=true
```

Notes:

- `PAYMENTS_PROVIDER=demo` is the correct setting for your current internship-demo billing flow.
- If you later switch to Razorpay, replace `demo` and add the Razorpay keys.
- RSA key paths already point to the checked-in local dev keys in `backend/secrets/`.

## 5. Backend Python Virtual Environment

Create the virtual environment and install dependencies:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Important note:

- Use `python -m pip ...` instead of `pip ...` if your machine has multiple Python installations.
- Use `venv/bin/python -m alembic ...` if the plain `python3 -m alembic` command is picking up the wrong environment.

## 6. MailHog Setup

MailHog is recommended for local testing because all invitations, password reset emails, verification emails, MFA alerts, and notification emails will show up there.

Option A: Docker

```bash
docker run -d --name mailhog -p 1025:1025 -p 8025:8025 mailhog/mailhog
```

Option B: if MailHog is already installed locally, just run it with SMTP on `1025` and web UI on `8025`.

Open the inbox UI at:

```text
http://localhost:8025
```

## 7. Database Migrations

Run migrations from inside `backend`:

```bash
cd backend
source venv/bin/activate
venv/bin/python -m alembic upgrade head
```

If you prefer while the venv is activated:

```bash
python -m alembic upgrade head
```

If you ever see this error:

```text
No module named alembic.__main__
```

that usually means the current Python process is not using the backend virtual environment. Activate the venv and use:

```bash
venv/bin/python -m alembic upgrade head
```

## 8. Seed the Base Demo Data

After migrations, seed the base platform:

```bash
cd backend
source venv/bin/activate
python scripts/seed.py
```

This creates:

- default organization
- system roles
- super admin user
- sample users Alice and Bob
- sample groups
- sample applications

Default seeded accounts:

| User | Email | Password |
| --- | --- | --- |
| Super admin | `admin@internal.com` unless overridden in `.env` | value of `ADMIN_SECRET` |
| Alice | `alice@internal.com` | `Test@1234` |
| Bob | `bob@internal.com` | `Test@1234` |

## 9. Start the Backend

Run the API server:

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Useful checks:

```bash
curl http://localhost:8000/
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/.well-known/openid-configuration
```

Useful URLs:

- API base: `http://localhost:8000`
- OpenAPI docs: `http://localhost:8000/api/docs`
- Developer docs: `http://localhost:8000/docs`

## 10. Frontend Setup and Run

In a new terminal:

```bash
cd /Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

The landing page, login, signup, password reset flow, settings, notifications, billing page, and docs links all route from here.

## 11. Optional Demo Client Apps

### HR Portal

```bash
cd clients/hr-portal
npm install
npm run dev
```

### Project Tracker

```bash
cd clients/project-tracker
npm install
npm run dev
```

Seeded client configuration:

- HR Portal client ID: `hr-portal-client-id`
- Project Tracker client ID: `project-tracker-client-id`

## 12. Running Tests and Syntax Checks

### Backend unit and API tests

```bash
cd backend
source venv/bin/activate
venv/bin/python -m unittest discover -s tests -v
```

### Backend syntax/import compilation

```bash
cd backend
source venv/bin/activate
venv/bin/python -m compileall app scripts
```

### Frontend production build

```bash
cd frontend
npm run build
```

These three are the recommended minimum validation commands before a demo.

## 13. Email and Notification Scheduled Jobs

Two backend scripts are intended to run on a schedule.

### Weekly summary emails

```bash
cd backend
source venv/bin/activate
python scripts/send_weekly_summaries.py
```

### Subscription reminder and expiry notifications

```bash
cd backend
source venv/bin/activate
python scripts/process_subscription_notifications.py
```

Example cron jobs:

```cron
0 9 * * 1 cd /Users/as-mac-1293/Desktop/mini-okta-v2.2/backend && venv/bin/python scripts/send_weekly_summaries.py >> /tmp/sigauth-weekly.log 2>&1
0 10 * * * cd /Users/as-mac-1293/Desktop/mini-okta-v2.2/backend && venv/bin/python scripts/process_subscription_notifications.py >> /tmp/sigauth-billing.log 2>&1
```

## 14. SigVerse Quick Start

SigVerse is the most complete example client app in this repo.

There are two ways to connect it:

- Quick path: use the SigVerse seed script
- Manual path: create a new organization and configure the client app yourself

### 14.1 Quick Path Using the SigVerse Seed Script

After the base backend seed is done:

```bash
cd backend
source venv/bin/activate
python scripts/seed_sigverse.py
```

What the script does:

- creates or reuses a SPA app named `SigVerse`
- default client ID: `GfRUxhhDZeKl1b6IoatrdMQdlCEsRQEY`
- default redirect URI: `http://localhost:5173/auth/callback`
- creates groups:
  - `sigverse-admins`
  - `sigverse-instructors`
  - `sigverse-learners`
- assigns those groups to the SigVerse app
- creates seeded users:
  - `sigverse.admin@gmail.com`
  - `sigverse.instructor@gmail.com`
  - `sigverse.learner@gmail.com`
- default seeded password: `Test@1234`

You can override the defaults before running the script:

```bash
export SIGVERSE_CLIENT_ID=your-client-id
export SIGVERSE_REDIRECT_URI=http://localhost:5173/auth/callback
export SIGVERSE_DEMO_PASSWORD=Test@1234
python scripts/seed_sigverse.py
```

## 15. SigVerse Manual Setup with a New Organization

Use this if you want the demo to show a fresh organization created in SigAuth instead of the default org.

### 15.1 Create the organization

1. Open `http://localhost:3000/signup`
2. Create a new self-serve organization
3. Sign in as that organization admin
4. If needed, upgrade the org plan from the billing page so you are not blocked by self-serve limits

### 15.2 Create the SigVerse groups

Inside the organization admin console:

1. Go to `Groups`
2. Create:
   - `sigverse-admins`
   - `sigverse-instructors`
   - `sigverse-learners`

### 15.3 Create the SigVerse application

Inside `Applications`, create a new app with these values:

- Name: `SigVerse`
- App type: `spa`
- Redirect URI: `http://localhost:5173/auth/callback`
- Allowed scopes:
  - `openid`
  - `profile`
  - `email`
- Status: active

After the app is created, copy the generated `client_id`.

### 15.4 Assign the application to groups

Open the SigVerse application detail page and assign:

- `sigverse-admins`
- `sigverse-instructors`
- `sigverse-learners`

This is required so users in those groups can actually see and launch the SigVerse app.

### 15.5 Create or invite SigVerse users

In `Users`, create or invite users for each access tier:

- one admin user
- one instructor user
- one learner user

Then add them to the correct groups:

- admin user -> `sigverse-admins`
- instructor user -> `sigverse-instructors`
- learner user -> `sigverse-learners`

Finish each invite/setup email from MailHog if you are using invite-first onboarding.

## 16. SigVerse Backend Configuration

Create or update:

```text
clients/SigVerse/backend/.env
```

The important IdP-related values are:

```dotenv
IDP_ISSUER_URL=http://localhost:8000
IDP_CLIENT_ID=<the SigVerse client_id from SigAuth>
IDP_PUBLIC_KEY_PATH=../../../backend/secrets/public.pem

SIGVERSE_ADMIN_GROUPS=sigverse-admins,admins
SIGVERSE_INSTRUCTOR_GROUPS=sigverse-instructors,instructors

SIGVERSE_ADMIN_APP_ROLES=app:admin,admin
SIGVERSE_INSTRUCTOR_APP_ROLES=app:instructor,instructor
SIGVERSE_LEARNER_APP_ROLES=app:learner,learner
```

Important note:

- `IDP_CLIENT_ID` must match the SigVerse application created in SigAuth.
- `IDP_PUBLIC_KEY_PATH` should point to the SigAuth backend public key so the SigVerse backend can validate tokens.

Run SigVerse backend:

```bash
cd clients/SigVerse/backend
npm install
npm run dev
```

The backend also needs its own MySQL and MongoDB configuration in its `.env`. Keep those aligned with however you are already running SigVerse locally.

## 17. SigVerse Frontend Configuration

Create or update:

```text
clients/SigVerse/frontend/.env
```

Recommended values:

```dotenv
VITE_API_URL=http://localhost:3100
VITE_IDP_URL=http://localhost:8000
VITE_IDP_CLIENT_ID=<the same SigVerse client_id>
VITE_IDP_REDIRECT_URI=http://localhost:5173/auth/callback
```

Run SigVerse frontend:

```bash
cd clients/SigVerse/frontend
npm install
npm run dev -- --port 5173
```

Open:

```text
http://localhost:5173/login
```

## 18. End-to-End SigVerse Verification Flow

After SigAuth backend, SigAuth frontend, SigVerse backend, and SigVerse frontend are all running:

1. Open `http://localhost:5173/login`
2. Click `Continue with SigAuth`
3. You should be redirected to the SigAuth authorize login page
4. Sign in with a SigAuth user assigned to the SigVerse application
5. Complete MFA if the user or org requires it
6. Watch the redirect loading screen
7. Return to SigVerse authenticated

Expected access behavior:

- organization admins can log into any app in their organization
- regular users need assignment via an application group
- app role mappings are optional for access itself
- SigVerse derives its internal role from app roles, app groups, or fallback org roles

## 19. Demo-Friendly Manual Checks

These are the best checks to run before showing the project:

1. Sign into `http://localhost:3000` as super admin
2. Create a new organization
3. Create or invite a user
4. Confirm the invitation email lands in MailHog
5. Complete password setup
6. Trigger password reset and confirm the reset email lands in MailHog
7. Enable MFA in settings and verify login challenge works
8. Assign a user to an app group and confirm the app appears in `My Apps`
9. Upgrade or manage the billing plan for a self-serve org
10. Open notifications and confirm recent activity appears
11. Open `http://localhost:8000/docs` and verify docs render correctly
12. Complete a SigVerse sign-in round trip

## 20. Troubleshooting

### Alembic error

If you see:

```text
No module named alembic.__main__
```

use the virtualenv interpreter explicitly:

```bash
cd backend
venv/bin/python -m alembic upgrade head
```

### Emails not appearing

Check:

- MailHog is running
- `SMTP_HOST=localhost`
- `SMTP_PORT=1025`
- backend was restarted after changing `.env`

### Developer docs logo not loading

The docs page expects the admin frontend to be available at `ADMIN_CONSOLE_URL`, because the logo is served from that frontend.

For local development, that should be:

```dotenv
ADMIN_CONSOLE_URL=http://localhost:3000
```

and the frontend dev server must be running.

### SigVerse login fails immediately

Check:

- SigAuth backend is running on `8000`
- SigVerse backend `IDP_CLIENT_ID` matches the exact SigAuth app client ID
- SigVerse frontend `VITE_IDP_CLIENT_ID` matches the same value
- redirect URI in SigAuth includes `http://localhost:5173/auth/callback`
- the user belongs to a group assigned to the SigVerse app, or is the org admin

### User can log into SigAuth but not see SigVerse

That usually means one of these is missing:

- the SigVerse app is not active
- the user is not in an assigned group
- the application is not assigned to the user’s group

## 21. Recommended Terminal Layout for a Full Demo

Use 5 terminals:

1. `backend` running `uvicorn`
2. `frontend` running Vite
3. `clients/SigVerse/backend` running Express
4. `clients/SigVerse/frontend` running Vite
5. MailHog logs or any extra one-off scripts

That setup is usually the smoothest for demos and debugging.
