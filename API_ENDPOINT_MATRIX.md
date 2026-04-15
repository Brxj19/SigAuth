# SigAuth API Endpoint Matrix

Status meanings:

- `Admin UI`: used directly by the SigAuth admin console React app
- `Built-in Auth UI`: used by the server-rendered authorize or email-link flow
- `Client App`: used by a demo/client application integrating with SigAuth
- `External/Infra`: meant for integrators, automation, health checks, or standards-based consumers

| Method | Path | Status | Used By | Notes |
| --- | --- | --- | --- | --- |
| `GET` | `/` | External/Infra | Root service probe | Service metadata/root links |
| `GET` | `/docs` | Admin UI | Landing page | Developer documentation page |
| `GET` | `/health` | External/Infra | Deploy/runtime checks | Liveness probe |
| `GET` | `/health/ready` | External/Infra | Deploy/runtime checks | Readiness probe |
| `POST` | `/api/v1/signup/organization` | Admin UI | [`frontend/src/pages/Signup.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/Signup.jsx) | Self-serve org signup |
| `POST` | `/api/v1/login` | Admin UI | [`frontend/src/pages/Login.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/Login.jsx) | Console login |
| `POST` | `/api/v1/login/mfa/verify` | Admin UI | [`frontend/src/pages/Login.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/Login.jsx) | Console MFA step |
| `GET` | `/api/v1/authorize` | Client App | SigVerse, Logistica, Project Tracker, HR Portal | OIDC authorize start |
| `GET` | `/api/v1/authorize/login-page` | Built-in Auth UI | [`backend/app/services/auth_page_renderer.py`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/backend/app/services/auth_page_renderer.py) | Branded authorize sign-in page |
| `POST` | `/api/v1/authorize/submit` | Built-in Auth UI | [`backend/app/services/auth_page_renderer.py`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/backend/app/services/auth_page_renderer.py) | Authorize sign-in submit |
| `POST` | `/api/v1/authorize/mfa-submit` | Built-in Auth UI | [`backend/app/services/auth_page_renderer.py`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/backend/app/services/auth_page_renderer.py) | Authorize MFA submit |
| `POST` | `/api/v1/token` | Client App | SigVerse, Logistica, Project Tracker, HR Portal | OIDC token exchange |
| `POST` | `/api/v1/logout` | Admin UI / Client App | AuthContext, SigVerse, Logistica | Provider logout |
| `GET` | `/api/v1/userinfo` | Client App | Project Tracker | OIDC userinfo |
| `GET` | `/api/v1/.well-known/openid-configuration` | External/Infra | Docs / integrators | OIDC discovery |
| `GET` | `/api/v1/.well-known/jwks.json` | External/Infra | Docs / token validators | JWKS |
| `POST` | `/api/v1/introspect` | External/Infra | Machine/integration use | Token introspection endpoint |
| `GET` | `/api/v1/verify-email` | Built-in Auth UI | Email verification links | Email verification callback |
| `POST` | `/api/v1/password-reset/request` | Admin UI | [`frontend/src/pages/PasswordResetRequest.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/PasswordResetRequest.jsx) | Forgot password start |
| `POST` | `/api/v1/password-reset/confirm` | Admin UI | [`frontend/src/pages/PasswordResetConfirm.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/PasswordResetConfirm.jsx) | Forgot password completion |
| `POST` | `/api/v1/password-setup/confirm` | Admin UI | [`frontend/src/pages/PasswordSetup.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/PasswordSetup.jsx) | Invitation/onboarding password setup |
| `POST` | `/api/v1/admin/organizations` | Admin UI | [`frontend/src/pages/OrganizationNew.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/OrganizationNew.jsx) | Create organization |
| `GET` | `/api/v1/admin/organizations` | Admin UI | [`frontend/src/pages/Organizations.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/Organizations.jsx), [`frontend/src/components/OrgSelector.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/components/OrgSelector.jsx) | List organizations |
| `GET` | `/api/v1/admin/organizations/pending-upgrade-requests` | Admin UI | [`frontend/src/pages/Organizations.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/Organizations.jsx) | Review pending free-tier upgrade requests |
| `GET` | `/api/v1/admin/organizations/{org_id}` | Admin UI | [`frontend/src/pages/OrganizationDetail.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/OrganizationDetail.jsx), Settings/Dashboard super-admin org context | Get organization detail |
| `PATCH` | `/api/v1/admin/organizations/{org_id}` | Admin UI | [`frontend/src/pages/OrganizationDetail.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/OrganizationDetail.jsx) | Update organization settings |
| `POST` | `/api/v1/admin/organizations/{org_id}/suspend` | Admin UI | [`frontend/src/pages/OrganizationDetail.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/OrganizationDetail.jsx) | Suspend organization |
| `POST` | `/api/v1/admin/organizations/{org_id}/activate` | Admin UI | [`frontend/src/pages/OrganizationDetail.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/OrganizationDetail.jsx) | Activate organization |
| `DELETE` | `/api/v1/admin/organizations/{org_id}` | Admin UI | [`frontend/src/pages/OrganizationDetail.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/OrganizationDetail.jsx) | Soft delete organization |
| `POST` | `/api/v1/admin/organizations/{org_id}/verify-enterprise` | Admin UI | [`frontend/src/pages/OrganizationDetail.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/OrganizationDetail.jsx) | Verify enterprise access |
| `POST` | `/api/v1/admin/organizations/{org_id}/approve-upgrade-request` | Admin UI | [`frontend/src/pages/OrganizationDetail.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/OrganizationDetail.jsx) | Approve submitted upgrade request |
| `POST` | `/api/v1/admin/organizations/{org_id}/set-limited` | Admin UI | [`frontend/src/pages/OrganizationDetail.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/OrganizationDetail.jsx) | Return org to limited mode |
| `GET` | `/api/v1/organizations/{org_id}/plan-status` | Admin UI | [`frontend/src/pages/UpgradeAccess.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/UpgradeAccess.jsx), [`frontend/src/components/Layout.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/components/Layout.jsx) | Billing/plan status |
| `POST` | `/api/v1/organizations/{org_id}/billing/checkout-session` | Admin UI | [`frontend/src/pages/UpgradeAccess.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/UpgradeAccess.jsx) | Start checkout |
| `POST` | `/api/v1/organizations/{org_id}/billing/checkout-complete` | Admin UI | [`frontend/src/pages/UpgradeAccess.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/UpgradeAccess.jsx) | Complete checkout |
| `POST` | `/api/v1/organizations/{org_id}/billing/cancel-at-period-end` | Admin UI | [`frontend/src/pages/UpgradeAccess.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/UpgradeAccess.jsx) | Schedule subscription cancellation |
| `POST` | `/api/v1/organizations/{org_id}/billing/resume` | Admin UI | [`frontend/src/pages/UpgradeAccess.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/UpgradeAccess.jsx) | Resume subscription |
| `POST` | `/api/v1/organizations/{org_id}/upgrade-request` | Admin UI | [`frontend/src/pages/UpgradeAccess.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/UpgradeAccess.jsx) | Submit verified-access request |
| `GET` | `/api/v1/organizations/{org_id}/roles` | Admin UI | Roles, GroupDetail, ApplicationDetail | List roles |
| `POST` | `/api/v1/organizations/{org_id}/roles` | Admin UI | [`frontend/src/pages/Roles.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/Roles.jsx) | Create role |
| `PATCH` | `/api/v1/organizations/{org_id}/roles/{role_id}` | Admin UI | [`frontend/src/pages/Roles.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/Roles.jsx) | Update role |
| `GET` | `/api/v1/me/profile` | Admin UI | [`frontend/src/contexts/AuthContext.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/contexts/AuthContext.jsx) | Current user profile |
| `PATCH` | `/api/v1/me/profile` | Admin UI | [`frontend/src/pages/Settings.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/Settings.jsx) | Update current user profile |
| `GET` | `/api/v1/me/organization` | Admin UI | Settings, Dashboard | Current organization |
| `GET` | `/api/v1/me/applications` | Admin UI | Dashboard, My Apps | User-assigned applications |
| `GET` | `/api/v1/me/preferences` | Admin UI | [`frontend/src/pages/Settings.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/Settings.jsx) | Account preference load |
| `PUT` | `/api/v1/me/preferences` | Admin UI | [`frontend/src/pages/Settings.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/Settings.jsx) | Account preference save |
| `GET` | `/api/v1/me/mfa` | Admin UI | [`frontend/src/pages/Settings.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/Settings.jsx) | MFA status |
| `POST` | `/api/v1/me/mfa/setup` | Admin UI | [`frontend/src/pages/Settings.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/Settings.jsx) | Start MFA |
| `POST` | `/api/v1/me/mfa/confirm` | Admin UI | [`frontend/src/pages/Settings.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/Settings.jsx) | Confirm MFA |
| `POST` | `/api/v1/me/mfa/disable` | Admin UI | [`frontend/src/pages/Settings.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/Settings.jsx) | Disable MFA |
| `POST` | `/api/v1/me/mfa/recovery-codes/regenerate` | Admin UI | [`frontend/src/pages/Settings.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/Settings.jsx) | Regenerate recovery codes |
| `GET` | `/api/v1/organizations/{org_id}/audit-log` | Admin UI | Dashboard, Search, AuditLog viewer | Audit list |
| `GET` | `/api/v1/organizations/{org_id}/audit-log/{event_id}` | Admin UI | [`frontend/src/pages/AuditLogDetail.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/AuditLogDetail.jsx) | Audit detail |
| `GET` | `/api/v1/me/sessions` | Admin UI | Dashboard, Settings | Current user sessions |
| `DELETE` | `/api/v1/me/sessions/{jti}` | Admin UI | [`frontend/src/pages/Settings.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/Settings.jsx) | Revoke one session |
| `POST` | `/api/v1/organizations/{org_id}/applications` | Admin UI | [`frontend/src/pages/ApplicationNew.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/ApplicationNew.jsx) | Create app |
| `GET` | `/api/v1/organizations/{org_id}/applications` | Admin UI | Applications, Dashboard, Search | List apps |
| `GET` | `/api/v1/organizations/{org_id}/applications/{app_id}` | Admin UI | [`frontend/src/pages/ApplicationDetail.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/ApplicationDetail.jsx) | App detail |
| `PATCH` | `/api/v1/organizations/{org_id}/applications/{app_id}` | Admin UI | [`frontend/src/pages/ApplicationDetail.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/ApplicationDetail.jsx) | Update app |
| `POST` | `/api/v1/organizations/{org_id}/applications/{app_id}/rotate-secret` | Admin UI | [`frontend/src/pages/ApplicationDetail.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/ApplicationDetail.jsx) | Rotate secret |
| `POST` | `/api/v1/organizations/{org_id}/applications/{app_id}/disable` | Admin UI | [`frontend/src/pages/ApplicationDetail.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/ApplicationDetail.jsx) | Disable app |
| `DELETE` | `/api/v1/organizations/{org_id}/applications/{app_id}` | Admin UI | [`frontend/src/pages/ApplicationDetail.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/ApplicationDetail.jsx) | Delete app |
| `GET` | `/api/v1/organizations/{org_id}/applications/{app_id}/groups` | Admin UI | [`frontend/src/pages/ApplicationDetail.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/ApplicationDetail.jsx) | App group assignments |
| `POST` | `/api/v1/organizations/{org_id}/applications/{app_id}/groups` | Admin UI | [`frontend/src/pages/ApplicationDetail.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/ApplicationDetail.jsx) | Assign group to app |
| `DELETE` | `/api/v1/organizations/{org_id}/applications/{app_id}/groups/{group_id}` | Admin UI | [`frontend/src/pages/ApplicationDetail.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/ApplicationDetail.jsx) | Remove group from app |
| `GET` | `/api/v1/organizations/{org_id}/applications/{app_id}/role-mappings` | Admin UI | [`frontend/src/pages/ApplicationDetail.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/ApplicationDetail.jsx) | Role mappings list |
| `POST` | `/api/v1/organizations/{org_id}/applications/{app_id}/role-mappings` | Admin UI | [`frontend/src/pages/ApplicationDetail.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/ApplicationDetail.jsx) | Create role mapping |
| `DELETE` | `/api/v1/organizations/{org_id}/applications/{app_id}/role-mappings/{mapping_id}` | Admin UI | [`frontend/src/pages/ApplicationDetail.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/ApplicationDetail.jsx) | Delete role mapping |
| `POST` | `/api/v1/organizations/{org_id}/users` | Admin UI | [`frontend/src/pages/UserNew.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/UserNew.jsx) | Create user |
| `GET` | `/api/v1/organizations/{org_id}/users` | Admin UI | Users, Search, GroupMembershipTable, Dashboard | User list |
| `GET` | `/api/v1/organizations/{org_id}/users/{user_id}` | Admin UI | [`frontend/src/pages/UserDetail.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/UserDetail.jsx) | User detail |
| `PATCH` | `/api/v1/organizations/{org_id}/users/{user_id}` | Admin UI | [`frontend/src/pages/UserDetail.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/UserDetail.jsx) | Update first/last name |
| `POST` | `/api/v1/organizations/{org_id}/users/{user_id}/suspend` | Admin UI | [`frontend/src/pages/UserDetail.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/UserDetail.jsx) | Suspend user |
| `POST` | `/api/v1/organizations/{org_id}/users/{user_id}/unlock` | Admin UI | [`frontend/src/pages/UserDetail.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/UserDetail.jsx) | Unlock user |
| `POST` | `/api/v1/organizations/{org_id}/users/{user_id}/reset-password` | Admin UI | [`frontend/src/pages/UserDetail.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/UserDetail.jsx) | Send reset email |
| `DELETE` | `/api/v1/organizations/{org_id}/users/{user_id}` | Admin UI | [`frontend/src/pages/UserDetail.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/UserDetail.jsx) | Delete user |
| `POST` | `/api/v1/organizations/{org_id}/users/{user_id}/revoke-sessions` | Admin UI | [`frontend/src/pages/UserDetail.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/UserDetail.jsx) | Revoke all user sessions |
| `GET` | `/api/v1/organizations/{org_id}/users/{user_id}/notification-preferences` | Admin UI | [`frontend/src/pages/UserDetail.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/UserDetail.jsx) | User notification prefs |
| `PUT` | `/api/v1/organizations/{org_id}/users/{user_id}/notification-preferences` | Admin UI | [`frontend/src/pages/UserDetail.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/UserDetail.jsx) | Update user notification prefs |
| `GET` | `/api/v1/organizations/{org_id}/groups` | Admin UI | Groups, Search, ApplicationDetail, GroupDetail | List groups |
| `POST` | `/api/v1/organizations/{org_id}/groups` | Admin UI | [`frontend/src/pages/GroupNew.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/GroupNew.jsx) | Create group |
| `PATCH` | `/api/v1/organizations/{org_id}/groups/{group_id}` | Admin UI | [`frontend/src/pages/GroupDetail.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/GroupDetail.jsx) | Update group |
| `DELETE` | `/api/v1/organizations/{org_id}/groups/{group_id}` | Admin UI | [`frontend/src/pages/GroupDetail.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/GroupDetail.jsx) | Delete group |
| `GET` | `/api/v1/organizations/{org_id}/groups/{group_id}/members` | Admin UI | [`frontend/src/components/GroupMembershipTable.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/components/GroupMembershipTable.jsx) | Group members |
| `POST` | `/api/v1/organizations/{org_id}/groups/{group_id}/members` | Admin UI | [`frontend/src/components/GroupMembershipTable.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/components/GroupMembershipTable.jsx) | Add member |
| `DELETE` | `/api/v1/organizations/{org_id}/groups/{group_id}/members/{user_id}` | Admin UI | [`frontend/src/components/GroupMembershipTable.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/components/GroupMembershipTable.jsx) | Remove member |
| `POST` | `/api/v1/organizations/{org_id}/groups/{group_id}/roles` | Admin UI | [`frontend/src/pages/GroupDetail.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/GroupDetail.jsx) | Assign role to group |
| `DELETE` | `/api/v1/organizations/{org_id}/groups/{group_id}/roles/{role_id}` | Admin UI | [`frontend/src/pages/GroupDetail.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/GroupDetail.jsx) | Remove role from group |
| `GET` | `/api/v1/organizations/{org_id}/groups/{group_id}/roles` | Admin UI | [`frontend/src/pages/GroupDetail.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/GroupDetail.jsx) | Group roles |
| `GET` | `/api/v1/notifications` | Admin UI | [`frontend/src/components/Layout.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/components/Layout.jsx) | Notification feed |
| `PATCH` | `/api/v1/notifications/{notification_id}/read` | Admin UI | [`frontend/src/components/Layout.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/components/Layout.jsx) | Mark one read |
| `PATCH` | `/api/v1/notifications/read-all` | Admin UI | [`frontend/src/components/Layout.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/components/Layout.jsx) | Mark all read |
| `DELETE` | `/api/v1/notifications/{notification_id}` | Admin UI | [`frontend/src/components/Layout.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/components/Layout.jsx) | Delete one notification |
| `DELETE` | `/api/v1/notifications` | Admin UI | [`frontend/src/components/Layout.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/components/Layout.jsx) | Clear notifications |
| `GET` | `/api/v1/admin/email-deliveries` | Admin UI | [`frontend/src/pages/EmailDeliveries.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/EmailDeliveries.jsx) | Cross-org email queue list |
| `POST` | `/api/v1/admin/email-deliveries/process` | Admin UI | [`frontend/src/pages/EmailDeliveries.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/EmailDeliveries.jsx) | Process email queue |
| `GET` | `/api/v1/organizations/{org_id}/email-deliveries` | Admin UI | [`frontend/src/pages/EmailDeliveries.jsx`](/Users/as-mac-1293/Desktop/mini-okta-v2.2/frontend/src/pages/EmailDeliveries.jsx) | Org-scoped email queue list |

## External-Only By Design

These endpoints are intentionally not wired to the SigAuth admin console because they are standards/infrastructure surfaces:

- `POST /api/v1/introspect`
- `GET /api/v1/.well-known/openid-configuration`
- `GET /api/v1/.well-known/jwks.json`
- `GET /health`
- `GET /health/ready`
