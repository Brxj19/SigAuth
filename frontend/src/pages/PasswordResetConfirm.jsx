import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import PasswordCriteria from '../components/PasswordCriteria';
import AuthParticleCanvas from '../components/AuthParticleCanvas';
import { LOGOUT_SYNC_KEY, clearStoredAuth } from '../utils/authStorage';

export default function PasswordResetConfirm() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => params.get('token') || '', [params]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!token) {
      setError('Missing reset token. Open the link from your email again.');
      return;
    }
    if (!passwordsMatch) {
      setError('Confirm password must match the new password.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/v1/password-reset/confirm', { token, new_password: newPassword });
      clearStoredAuth();
      localStorage.setItem(LOGOUT_SYNC_KEY, String(Date.now()));
      setMessage(res.data?.message || 'Password reset complete. Please sign in again.');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (err) {
      setError(err.response?.data?.detail?.error_description || 'Unable to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell px-4 py-16">
      <AuthParticleCanvas />
      <div className="auth-card mx-auto w-full max-w-md p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-700">Account Recovery</p>
        <h1 className="mt-2 text-2xl font-semibold text-dark-100">Choose a new password</h1>
        <p className="mt-2 text-sm text-dark-400">Use a strong password with upper/lowercase, number, and symbol.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {message && <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div>}
          {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dark-300">New password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="input-field" />
            <PasswordCriteria password={newPassword} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dark-300">Confirm password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="input-field" />
            <div className="password-criteria">
              <div className={`password-rule ${passwordsMatch ? 'valid' : 'invalid'}`}>
                <span className="password-rule-dot" />
                {passwordsMatch ? 'Password matches' : 'Password does not match yet'}
              </div>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Saving...' : 'Reset password'}</button>
        </form>

        <div className="mt-6 text-center text-xs">
          <Link to="/login" className="font-medium text-gray-900 hover:text-black">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
