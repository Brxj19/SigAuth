import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import PasswordCriteria from '../components/PasswordCriteria';
import AuthParticleCanvas from '../components/AuthParticleCanvas';

export default function PasswordSetup() {
  const [params] = useSearchParams();
  const token = useMemo(() => params.get('token') || '', [params]);
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!token) {
      setError('Missing setup token. Open the invitation link from your email again.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/v1/password-setup/confirm', { token, new_password: newPassword });
      setMessage(res.data?.message || 'Account setup completed.');
      setNewPassword('');
    } catch (err) {
      setError(err.response?.data?.detail?.error_description || 'Unable to complete account setup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell px-4 py-16">
      <AuthParticleCanvas />
      <div className="auth-card mx-auto w-full max-w-md p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-700">Invitation</p>
        <h1 className="mt-2 text-2xl font-semibold text-dark-100">Set your password</h1>
        <p className="mt-2 text-sm text-dark-400">Complete first-time setup before signing in.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {message && <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div>}
          {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dark-300">New password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="input-field" />
            <PasswordCriteria password={newPassword} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Saving...' : 'Complete setup'}</button>
        </form>

        <div className="mt-6 text-center text-xs">
          <Link to="/login" className="font-medium text-gray-900 hover:text-black">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
