import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import RoleBadge from '../components/RoleBadge';
import PageHeader from '../components/PageHeader';
import { ArrowLeftIcon, CheckIcon, XIcon } from '../components/Icons';
import CopyButton from '../components/CopyButton';
import { hasPermission, hasRole } from '../utils/permissions';

export default function UserDetail() {
  const { id } = useParams();
  const { orgId, claims, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await api.get(`/api/v1/organizations/${orgId}/users/${id}`);
      setUser(res.data);
    } catch { navigate('/users'); }
    setLoading(false);
  };

  useEffect(() => { fetchUser(); }, [id, orgId]);

  const handleSuspend = async () => {
    if (!confirm('Suspend this user? All sessions will be revoked.')) return;
    await api.post(`/api/v1/organizations/${orgId}/users/${id}/suspend`);
    fetchUser();
  };

  const handleUnlock = async () => {
    if (!confirm('Unlock/reactivate this user?')) return;
    await api.post(`/api/v1/organizations/${orgId}/users/${id}/unlock`);
    fetchUser();
  };

  const handleResetPassword = async () => {
    if (!confirm('Send password reset email?')) return;
    await api.post(`/api/v1/organizations/${orgId}/users/${id}/reset-password`);
    alert('Password reset email sent');
  };

  const handleRevokeSessions = async () => {
    if (!confirm('Revoke all active sessions?')) return;
    const res = await api.post(`/api/v1/organizations/${orgId}/users/${id}/revoke-sessions`);
    alert(res.data.message);
  };

  const handleDelete = async () => {
    if (!confirm('Permanently delete this user?')) return;
    await api.delete(`/api/v1/organizations/${orgId}/users/${id}`);
    navigate('/users');
  };

  if (loading || !user) return <div className="text-center py-20 text-dark-400">Loading...</div>;

  const displayName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
  const actorCanManageProtectedUsers = isSuperAdmin || hasRole(claims, 'org:admin');
  const targetIsProtected = !!user.is_super_admin || (user.roles || []).includes('org:admin');
  const isSelf = claims?.sub === user.id;
  const allowSensitiveActions = !targetIsProtected || actorCanManageProtectedUsers;
  const canUpdateUsers = hasPermission(claims, 'user:update');
  const canResetPasswords = hasPermission(claims, 'user:reset_password');
  const canDeleteUsers = hasPermission(claims, 'user:delete');

  return (
    <div>
      <button onClick={() => navigate('/users')} className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-dark-400 hover:text-dark-200">
        <ArrowLeftIcon className="h-4 w-4" />
        Back to users
      </button>

      <PageHeader
        eyebrow="User Profile"
        title={displayName}
        description={user.email}
        actions={
          <div className="flex gap-2">
            {canUpdateUsers && allowSensitiveActions && !isSelf ? <button onClick={handleRevokeSessions} className="btn-secondary text-sm">Revoke sessions</button> : null}
            {canResetPasswords && allowSensitiveActions && !isSelf ? <button onClick={handleResetPassword} className="btn-secondary text-sm">Reset password</button> : null}
            {canUpdateUsers && allowSensitiveActions && !isSelf && user.status === 'active' ? <button onClick={handleSuspend} className="btn-danger text-sm">Suspend</button> : null}
            {canUpdateUsers && allowSensitiveActions && !isSelf && (user.status === 'locked' || user.status === 'suspended') ? <button onClick={handleUnlock} className="btn-secondary text-sm">Unlock</button> : null}
            {canDeleteUsers && allowSensitiveActions && !isSelf ? <button onClick={handleDelete} className="btn-danger text-sm">Delete</button> : null}
          </div>
        }
      />

      {isSelf ? (
        <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          Administrative self-actions are blocked here. Use the normal account settings and sign-out flows for your own account.
        </div>
      ) : null}
      {targetIsProtected && !allowSensitiveActions ? (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This account has administrator access. Only organization admins can revoke sessions, reset passwords, suspend, or delete it.
        </div>
      ) : null}

      <div className="mb-8 flex items-center gap-4 rounded-xl border border-dark-700 bg-dark-900 p-5 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-xl font-semibold text-primary-700">
            {user.email?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-base font-semibold text-dark-100">{displayName}</p>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-sm text-dark-400">{user.email}</p>
              <CopyButton value={user.email} label="Copy email" />
            </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Details</h2>
          <dl className="space-y-4">
            <div><dt className="text-xs text-dark-400 uppercase">Status</dt><dd className="mt-1"><span className={user.status === 'active' ? 'badge-green' : 'badge-red'}>{user.status}</span></dd></div>
            <div><dt className="text-xs text-dark-400 uppercase">Email Verified</dt><dd className="mt-1">{user.email_verified ? <span className="badge-green"><CheckIcon className="h-3.5 w-3.5" />Verified</span> : <span className="badge-gray"><XIcon className="h-3.5 w-3.5" />Not verified</span>}</dd></div>
            <div><dt className="text-xs text-dark-400 uppercase">MFA</dt><dd className="mt-1">{user.mfa_enabled ? <span className="badge-green"><CheckIcon className="h-3.5 w-3.5" />Enabled</span> : <span className="badge-gray"><XIcon className="h-3.5 w-3.5" />Disabled</span>}</dd></div>
            <div><dt className="text-xs text-dark-400 uppercase">Last Login</dt><dd className="mt-1 text-dark-300">{user.last_login_at ? new Date(user.last_login_at).toLocaleString() : '—'}</dd></div>
            <div><dt className="text-xs text-dark-400 uppercase">Created</dt><dd className="mt-1 text-dark-300">{new Date(user.created_at).toLocaleString()}</dd></div>
            <div>
              <dt className="text-xs text-dark-400 uppercase">User ID</dt>
              <dd className="mt-1 flex items-center gap-2 text-dark-300 font-mono text-xs break-all">
                {user.id}
                <CopyButton value={user.id} label="Copy user id" />
              </dd>
            </div>
          </dl>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">Groups</h2>
            <div className="flex flex-wrap gap-2">
              {(user.groups || []).length === 0 && <span className="text-dark-500 text-sm">No group memberships</span>}
              {(user.groups || []).map(g => (
                <span key={g.id} className="badge-blue" title={g.description || g.name}>
                  {g.name}
                </span>
              ))}
            </div>
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">Effective Roles</h2>
            <div className="flex flex-wrap gap-2">
              {(user.roles || []).length === 0 && <span className="text-dark-500 text-sm">No roles assigned</span>}
              {(user.roles || []).map(r => <RoleBadge key={r} role={r} />)}
            </div>
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">Effective Permissions</h2>
            <div className="flex flex-wrap gap-1.5">
              {(user.permissions || []).length === 0 && <span className="text-dark-500 text-sm">No permissions</span>}
              {(user.permissions || []).map(p => (
                <span key={p} className="badge-gray text-xs">{p}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
