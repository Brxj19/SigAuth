import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';

export default function GroupNew() {
  const { orgId } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post(`/api/v1/organizations/${orgId}/groups`, form);
      navigate(`/groups/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail?.error_description || 'Failed to create group');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl">
      <button onClick={() => navigate('/groups')} className="text-dark-400 hover:text-dark-200 text-sm mb-4 inline-flex items-center gap-1">← Back</button>
      <h1 className="text-2xl font-bold mb-6">Create Group</h1>
      <form onSubmit={handleSubmit} className="card space-y-5">
        {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-1">Group Name *</label>
          <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" placeholder="e.g. engineering" />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-1">Description</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input-field" rows={3} placeholder="Optional description..." />
        </div>
        <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Creating...' : 'Create Group'}</button>
      </form>
    </div>
  );
}
