import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import { usePageTitle } from '../hooks/usePageTitle';
import { loginWithIdp } from '../services/authService';
import Icon from '../components/Icon';

const PLATFORM_SIGNALS = [
  { value: 'OIDC', label: 'Identity Flow' },
  { value: 'PKCE', label: 'Browser Security' },
  { value: 'RBAC', label: 'Role Mapping' }
];

export default function Login() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [idpLoading, setIdpLoading] = useState(false);

  usePageTitle('Sign In');

  if (user) return <Navigate to="/dashboard" replace />;

  const handleIdpLogin = async () => {
    setIdpLoading(true);
    try {
      await loginWithIdp();
    } catch (err) {
      setIdpLoading(false);
      showToast(err.message || 'Unable to start Identity Admin login', 'error');
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-effects">
        <div className="login-orb login-orb-1"></div>
        <div className="login-orb login-orb-2"></div>
        <div className="login-orb login-orb-3"></div>
      </div>
      <div className="login-shell">
        <section className="login-showcase">
          <div className="login-showcase-brand">
            <div className="login-logo sigverse-logo login-showcase-logo">
              <Icon name="brand" size={42} className="logo-icon-svg" />
            </div>
            <div className="login-showcase-copy">
              <h1 className="login-title">SigVerse</h1>
              <p className="login-subtitle">
                Course delivery, instructor operations, and learner workflows now use centralized sign-in through Identity Admin.
              </p>
            </div>
          </div>
          <div className="login-showcase-band">
            {PLATFORM_SIGNALS.map((signal) => (
              <div key={signal.label} className="login-signal-chip">
                <strong className="login-signal-value">{signal.value}</strong>
                <span className="login-signal-label">{signal.label}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="login-card login-card-wide">
          <div className="login-card-inner">
            <div className="login-panel-copy">
              <span className="login-panel-eyebrow">Identity Admin required</span>
              <h2 className="login-panel-title">Sign in with your organization account</h2>
              <p className="login-panel-text">
                Local email login, signup, GitHub auth, and password reset are disabled for this client.
                Access is now controlled through the Identity Provider, including application group assignments.
              </p>
            </div>

            <div className="login-trust-grid">
              <div className="login-trust-card">
                <strong>Centralized access</strong>
                <span>SigVerse uses the same tenant, group, and role policies enforced by the IdP.</span>
              </div>
              <div className="login-trust-card">
                <strong>Application groups</strong>
                <span>Only users assigned to groups authorized for SigVerse can complete sign-in.</span>
              </div>
              <div className="login-trust-card">
                <strong>Automatic local profile sync</strong>
                <span>SigVerse creates or updates the local profile from the IdP token after login.</span>
              </div>
            </div>

            <div className="login-form">
              <button
                type="button"
                className="btn btn-primary login-submit-btn"
                onClick={handleIdpLogin}
                disabled={idpLoading}
              >
                {idpLoading ? 'Redirecting...' : 'Continue with Identity Admin'}
              </button>
              <p className="form-hint" style={{ textAlign: 'center' }}>
                Use your IdP user such as `admin@internal.com`, `alice@internal.com`, or another user assigned to the SigVerse application.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
