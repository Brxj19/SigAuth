import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import AuthParticleCanvas from '../components/AuthParticleCanvas';

export default function PasswordResetRequest() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await api.post('/api/v1/password-reset/request', { email });
      setMessage(res.data?.message || 'If an account exists, a reset link has been sent.');
    } catch (err) {
      setError(err.response?.data?.detail?.error_description || 'Unable to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell px-4 py-16">
      <AuthParticleCanvas />
      <div className="auth-card mx-auto w-full max-w-md p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-700">Account Recovery</p>
        <h1 className="mt-2 text-2xl font-semibold text-dark-100">Reset password</h1>
        <p className="mt-2 text-sm text-dark-400">Enter your email and we will send a reset link.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {message && <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div>}
          {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dark-300">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Sending...' : 'Send reset link'}</button>
        </form>

        <div className="mt-6 text-center text-xs">
          <Link to="/login" className="font-medium text-gray-900 hover:text-black">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
