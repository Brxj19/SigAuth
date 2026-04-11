import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import CopyButton from '../components/CopyButton';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import RoleBadge from '../components/RoleBadge';

export default function Settings() {
  const { claims, rememberBrowser, setRememberBrowserPreference, isSuperAdmin, orgId } = useAuth();
  const [preferences, setPreferences] = useState({
    securityAlerts: false,
    weeklySummary: false,
    rememberSession: rememberBrowser,
  });
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [mfaStatus, setMfaStatus] = useState({ enabled: false, org_enforced: false, recovery_codes_remaining: 0 });
  const [mfaSetup, setMfaSetup] = useState(null);
  const [mfaCode, setMfaCode] = useState('');
  const [visibleBackupCodes, setVisibleBackupCodes] = useState([]);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [regeneratePassword, setRegeneratePassword] = useState('');
  const [regenerateCode, setRegenerateCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaMessage, setMfaMessage] = useState('');
  const [mfaError, setMfaError] = useState('');

  useEffect(() => {
    let active = true;

    const loadSettings = async () => {
      try {
        setLoading(true);
        const [prefRes, mfaRes, orgRes] = await Promise.all([
          api.get('/api/v1/me/preferences'),
          api.get('/api/v1/me/mfa'),
          isSuperAdmin ? api.get(`/api/v1/admin/organizations/${orgId}`) : api.get('/api/v1/me/organization'),
        ]);
        if (!active) return;
        setPreferences({
          securityAlerts: !!prefRes.data?.security_alerts,
          weeklySummary: !!prefRes.data?.weekly_summary_emails,
          rememberSession: rememberBrowser,
        });
        setMfaStatus({
          enabled: !!mfaRes.data?.enabled,
          org_enforced: !!mfaRes.data?.org_enforced,
          recovery_codes_remaining: Number(mfaRes.data?.recovery_codes_remaining || 0),
        });
        setOrganization(orgRes.data || null);
      } catch (err) {
        if (!active) return;
        setError(err.response?.data?.detail?.error_description || 'Unable to load account preferences.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadSettings();
    return () => {
      active = false;
    };
  }, [rememberBrowser, isSuperAdmin, orgId]);

  const organizationName = organization?.display_name || organization?.name || 'Unknown';
  const roles = claims?.roles || [];
  const permissions = claims?.permissions || [];

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const res = await api.put('/api/v1/me/preferences', {
        security_alerts: preferences.securityAlerts,
        weekly_summary_emails: preferences.weeklySummary,
      });

      setRememberBrowserPreference(preferences.rememberSession);
      setPreferences((prev) => ({
        ...prev,
        securityAlerts: !!res.data?.security_alerts,
        weeklySummary: !!res.data?.weekly_summary_emails,
        rememberSession: preferences.rememberSession,
      }));
      setMessage('Preferences saved.');
    } catch (err) {
      setError(err.response?.data?.detail?.error_description || 'Unable to save account preferences.');
    } finally {
      setSaving(false);
    }
  };

  const beginMfaSetup = async () => {
    setMfaLoading(true);
    setMfaError('');
    setMfaMessage('');
    try {
      const res = await api.post('/api/v1/me/mfa/setup');
      setMfaSetup(res.data);
      setMfaCode('');
      setVisibleBackupCodes([]);
    } catch (err) {
      setMfaError(err.response?.data?.detail?.error_description || 'Unable to start MFA setup.');
    } finally {
      setMfaLoading(false);
    }
  };

  const confirmMfaSetup = async (event) => {
    event.preventDefault();
    setMfaLoading(true);
    setMfaError('');
    setMfaMessage('');
    try {
      const res = await api.post('/api/v1/me/mfa/confirm', { code: mfaCode });
      setMfaStatus({
        enabled: !!res.data?.enabled,
        org_enforced: !!res.data?.org_enforced,
        recovery_codes_remaining: Number(res.data?.recovery_codes_remaining || 0),
      });
      setMfaSetup(null);
      setMfaCode('');
      setVisibleBackupCodes(res.data?.backup_codes || []);
      setMfaMessage('Multi-factor authentication is now enabled.');
    } catch (err) {
      setMfaError(err.response?.data?.detail?.error_description || 'Unable to verify authenticator code.');
    } finally {
      setMfaLoading(false);
    }
  };

  const disableMfa = async (event) => {
    event.preventDefault();
    setMfaLoading(true);
    setMfaError('');
    setMfaMessage('');
    try {
      const res = await api.post('/api/v1/me/mfa/disable', {
        current_password: disablePassword,
        code: disableCode,
      });
      setMfaStatus({
        enabled: !!res.data?.enabled,
        org_enforced: !!res.data?.org_enforced,
        recovery_codes_remaining: Number(res.data?.recovery_codes_remaining || 0),
      });
      setDisablePassword('');
      setDisableCode('');
      setMfaSetup(null);
      setVisibleBackupCodes([]);
      setMfaMessage('Multi-factor authentication has been disabled.');
    } catch (err) {
      setMfaError(err.response?.data?.detail?.error_description || 'Unable to disable MFA.');
    } finally {
      setMfaLoading(false);
    }
  };

  const regenerateRecoveryCodes = async (event) => {
    event.preventDefault();
    setMfaLoading(true);
    setMfaError('');
    setMfaMessage('');
    try {
      const res = await api.post('/api/v1/me/mfa/recovery-codes/regenerate', {
        current_password: regeneratePassword,
        code: regenerateCode,
      });
      setMfaStatus({
        enabled: !!res.data?.enabled,
        org_enforced: !!res.data?.org_enforced,
        recovery_codes_remaining: Number(res.data?.recovery_codes_remaining || 0),
      });
      setVisibleBackupCodes(res.data?.backup_codes || []);
      setRegeneratePassword('');
      setRegenerateCode('');
      setMfaMessage('New recovery codes are ready. Your previous unused codes were replaced.');
    } catch (err) {
      setMfaError(err.response?.data?.detail?.error_description || 'Unable to regenerate recovery codes.');
    } finally {
      setMfaLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Settings"
        title="Account Settings"
        description="Manage profile details, password workflow, and security preferences."
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title="Profile" subtitle="Identity information tied to your current account." className="xl:col-span-1">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-500">Email</dt>
              <dd className="mt-1 font-medium text-gray-900">{claims?.email || 'Unknown'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">User ID</dt>
              <dd className="mt-1 break-all font-mono text-xs text-gray-700">{claims?.sub || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Organization</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900">{organizationName}</dd>
              <dd className="mt-1 text-xs text-gray-500">
                {organization?.slug ? `/${organization.slug}` : 'Organization profile'}
                {organization?.access_tier ? ` • ${organization.access_tier.replace('_', ' ')}` : ''}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Organization ID</dt>
              <dd className="mt-1 break-all font-mono text-xs text-gray-700">{claims?.org_id || organization?.id || 'N/A'}</dd>
            </div>
          </dl>
        </Card>

        <Card title="Password" subtitle="Rotate your password regularly for stronger security." className="xl:col-span-1">
          <p className="text-sm text-gray-600">Use the reset flow to update your account password.</p>
          <div className="mt-4">
            <Link to="/password-reset/request">
              <Button variant="secondary" className="w-full justify-center">Open password reset</Button>
            </Link>
          </div>
        </Card>

        <Card title="Security Options" subtitle="Preference toggles for admin account UX." className="xl:col-span-1">
          {error ? <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
          {message ? <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div> : null}

          <div className="space-y-3">
            {[
              {
                key: 'securityAlerts',
                label: 'Security alerts',
                hint: 'Controls security-related in-app notifications and emails like failed sign-ins and password-reset completion alerts.',
              },
              {
                key: 'weeklySummary',
                label: 'Weekly summary emails',
                hint: 'Sends a digest of the last 7 days when there has been account or admin activity worth summarizing.',
              },
              {
                key: 'rememberSession',
                label: 'Remember this browser',
                hint: 'Keeps your admin session in this browser after closing the tab or browser until the token expires or you sign out.',
              },
            ].map((item) => (
              <label key={item.key} className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
                <span>
                  <span className="block font-medium text-gray-900">{item.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-gray-500">{item.hint}</span>
                </span>
                <input
                  type="checkbox"
                  checked={!!preferences[item.key]}
                  onChange={(e) => setPreferences((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                  disabled={loading || saving}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </label>
            ))}
          </div>
          <div className="mt-4">
            <Button className="w-full justify-center" onClick={handleSave} disabled={loading || saving}>
              {loading ? 'Loading...' : saving ? 'Saving...' : 'Save preferences'}
            </Button>
          </div>
        </Card>

        <Card title="Access Profile" subtitle="The roles and permissions currently active for your signed-in account." className="xl:col-span-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Roles</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {roles.length ? roles.map((role) => <RoleBadge key={role} role={role} />) : (
                <span className="text-sm text-gray-500">No roles assigned.</span>
              )}
            </div>
          </div>
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Permissions</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {permissions.length ? [...permissions].sort().map((permission) => (
                <span key={permission} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
                  {permission}
                </span>
              )) : (
                <span className="text-sm text-gray-500">No permissions assigned.</span>
              )}
            </div>
          </div>
        </Card>

        <Card title="Multi-Factor Authentication" subtitle="Use Google Authenticator with standard TOTP codes." className="xl:col-span-2">
          {mfaError ? <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{mfaError}</div> : null}
          {mfaMessage ? <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{mfaMessage}</div> : null}

          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-900">Current status</p>
              <p className="mt-2 text-sm text-gray-600">
                {mfaStatus.enabled
                  ? 'Your account is protected with Google Authenticator.'
                  : 'MFA is not enabled on this account yet.'}
              </p>
              {mfaStatus.enabled ? (
                <p className="mt-2 text-xs leading-5 text-gray-500">
                  Recovery codes remaining: <span className="font-semibold text-gray-700">{mfaStatus.recovery_codes_remaining ?? 0}</span>
                </p>
              ) : null}
              {mfaStatus.org_enforced ? (
                <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-700">
                  Your organization requires MFA. Once it is enabled, it cannot be disabled unless an admin changes the policy.
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-3">
                {!mfaStatus.enabled ? (
                  <Button onClick={beginMfaSetup} disabled={mfaLoading}>
                    {mfaLoading ? 'Preparing...' : 'Set up Google Authenticator'}
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="space-y-4">
              {mfaSetup ? (
                <form onSubmit={confirmMfaSetup} className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-sm font-semibold text-gray-900">Setup key</p>
                  {mfaSetup.qr_code_data_url ? (
                    <div className="mt-3 flex justify-center rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <img src={mfaSetup.qr_code_data_url} alt="Google Authenticator setup QR code" className="h-48 w-48" />
                    </div>
                  ) : null}
                  <div className="mt-3 flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
                    <p className="break-all font-mono text-xs leading-6 text-gray-700">{mfaSetup.manual_entry_key}</p>
                    <CopyButton value={mfaSetup.manual_entry_key} label="Copy setup key" />
                  </div>
                  <ol className="mt-4 list-decimal space-y-1 pl-5 text-xs leading-5 text-gray-600">
                    <li>Open Google Authenticator and scan the QR code.</li>
                    <li>Choose <strong>Enter a setup key</strong> only if scanning is unavailable.</li>
                    <li>Use <strong>{claims?.email || 'your email'}</strong> as the account name.</li>
                    <li>Paste the setup key, then enter the 6-digit code below.</li>
                  </ol>
                  <div className="mt-4">
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">Authenticator code</label>
                    <input
                      type="text"
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="input-field"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="123456"
                      required
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button type="submit" disabled={mfaLoading}>{mfaLoading ? 'Verifying...' : 'Verify and enable MFA'}</Button>
                    <Button type="button" variant="secondary" onClick={() => setMfaSetup(null)} disabled={mfaLoading}>Cancel</Button>
                  </div>
                </form>
              ) : null}

              {visibleBackupCodes.length ? (
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Recovery codes</p>
                      <p className="mt-1 text-xs leading-5 text-gray-600">These codes are shown only once. Save them somewhere secure.</p>
                    </div>
                    <CopyButton value={visibleBackupCodes.join('\n')} label="Copy codes" />
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {visibleBackupCodes.map((code) => (
                      <div key={code} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-center font-mono text-xs tracking-[0.16em] text-gray-700">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {mfaStatus.enabled ? (
                <form onSubmit={regenerateRecoveryCodes} className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-sm font-semibold text-gray-900">Regenerate recovery codes</p>
                  <p className="mt-1 text-xs leading-5 text-gray-600">
                    Generating a new set will permanently invalidate any unused recovery codes you already have.
                  </p>
                  <div className="mt-4 grid gap-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">Current password</label>
                      <input
                        type="password"
                        value={regeneratePassword}
                        onChange={(e) => setRegeneratePassword(e.target.value)}
                        className="input-field"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">Authenticator code</label>
                      <input
                        type="text"
                        value={regenerateCode}
                        onChange={(e) => setRegenerateCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="input-field"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="123456"
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button type="submit" className="w-full justify-center" disabled={mfaLoading}>
                      {mfaLoading ? 'Generating...' : 'Generate new recovery codes'}
                    </Button>
                  </div>
                </form>
              ) : null}

              {mfaStatus.enabled ? (
                <form onSubmit={disableMfa} className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-sm font-semibold text-gray-900">Disable MFA</p>
                  {mfaStatus.org_enforced ? (
                    <p className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs leading-5 text-gray-600">
                      MFA disable is locked because your organization enforces multi-factor authentication.
                    </p>
                  ) : (
                    <>
                      <p className="mt-1 text-xs leading-5 text-gray-600">
                        Confirm your password and a current authenticator code before disabling multi-factor authentication.
                      </p>
                      <div className="mt-4 grid gap-4">
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-gray-700">Current password</label>
                          <input
                            type="password"
                            value={disablePassword}
                            onChange={(e) => setDisablePassword(e.target.value)}
                            className="input-field"
                            placeholder="••••••••"
                            required
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-gray-700">Authenticator code</label>
                          <input
                            type="text"
                            value={disableCode}
                            onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="input-field"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            placeholder="123456"
                            required
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <Button type="submit" variant="secondary" className="w-full justify-center" disabled={mfaLoading}>
                          {mfaLoading ? 'Disabling...' : 'Disable MFA'}
                        </Button>
                      </div>
                    </>
                  )}
                </form>
              ) : null}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
