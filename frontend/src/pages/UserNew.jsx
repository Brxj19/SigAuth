import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';

export default function UserNew() {
  const { orgId } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', first_name: '', last_name: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.post(`/api/v1/organizations/${orgId}/users`, form);
      setSuccess('User created and invitation email sent for first-time password setup.');
      setTimeout(() => navigate('/users'), 900);
    } catch (err) {
      setError(err.response?.data?.detail?.error_description || 'Failed to create user');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl">
      <button onClick={() => navigate('/users')} className="text-dark-400 hover:text-dark-200 text-sm mb-4 inline-flex items-center gap-1">← Back</button>
      <h1 className="text-2xl font-bold mb-6">Create User</h1>

      <form onSubmit={handleSubmit} className="card space-y-5">
        {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">{error}</div>}
        {success && <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">First Name</label>
            <input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1">Last Name</label>
            <input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} className="input-field" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-1">Email *</label>
          <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input-field" />
        </div>
        <p className="text-xs text-dark-500">A one-time setup link will be emailed. The user must set a password before first login.</p>
        <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Creating...' : 'Create User'}</button>
      </form>
    </div>
  );
}
