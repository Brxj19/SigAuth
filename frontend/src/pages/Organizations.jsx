import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/PageHeader';
import { PlusIcon } from '../components/Icons';

export default function Organizations() {
  const { isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchOrganizations = async (loadMore = false) => {
    if (!isSuperAdmin) {
      setLoading(false);
      return;
    }
    if (loadMore) setLoadingMore(true);
    else setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '25');
      if (loadMore && cursor) params.set('cursor', cursor);
      const res = await api.get(`/api/v1/admin/organizations?${params}`);
      const data = res.data.data || [];
      const pag = res.data.pagination || {};
      if (loadMore) setOrgs(prev => [...prev, ...data]);
      else setOrgs(data);
      setCursor(pag.next_cursor);
      setHasMore(pag.has_more || false);
    } catch {}
    if (loadMore) setLoadingMore(false);
    else setLoading(false);
  };

  useEffect(() => {
    fetchOrganizations();
    api.get('/api/v1/admin/organizations/pending-upgrade-requests')
      .then((res) => setPendingRequests(res.data?.data || []))
      .catch(() => setPendingRequests([]));
  }, [isSuperAdmin]);

  if (!isSuperAdmin) {
    return <div className="text-center py-20 text-dark-400">Only super admins can manage organizations.</div>;
  }

  if (loading) return <div className="text-center py-20 text-dark-400">Loading...</div>;

  return (
    <div>
      <PageHeader
        eyebrow="Platform Tenants"
        title="Organizations"
        description="Manage the organizations that exist on the platform and provision new tenants with a bootstrap admin."
        actions={
          <button onClick={() => navigate('/organizations/new')} className="btn-primary">
            <PlusIcon className="h-4 w-4" />
            Create organization
          </button>
        }
      />

      <div className="card overflow-hidden p-0">
        {pendingRequests.length ? (
          <div className="border-b border-amber-200 bg-amber-50 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-800">Pending upgrade requests</p>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {pendingRequests.slice(0, 6).map((request) => (
                <button
                  key={request.org_id}
                  type="button"
                  onClick={() => navigate(`/organizations/${request.org_id}`)}
                  className="rounded-xl border border-amber-200 bg-white px-4 py-3 text-left transition hover:border-amber-300 hover:bg-amber-100/40"
                >
                  <p className="text-sm font-semibold text-slate-900">{request.org_name}</p>
                  <p className="mt-1 text-xs text-slate-600">{request.submitted_by_email || 'Unknown requester'}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Submitted {request.submitted_at ? new Date(request.submitted_at).toLocaleString() : 'recently'}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="text-left py-3 px-6 text-xs font-semibold text-slate-500 uppercase">Name</th>
              <th className="text-left py-3 px-6 text-xs font-semibold text-slate-500 uppercase">Slug</th>
              <th className="text-left py-3 px-6 text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th className="text-left py-3 px-6 text-xs font-semibold text-slate-500 uppercase">Created</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map(org => (
              <tr key={org.id} className="table-row">
                <td className="py-3 px-6">
                  <Link to={`/organizations/${org.id}`} className="font-medium text-blue-700 hover:text-blue-800">
                    {org.display_name || org.name}
                  </Link>
                </td>
                <td className="py-3 px-6 font-mono text-sm text-slate-500">{org.slug}</td>
                <td className="py-3 px-6">
                  <span className={org.status === 'active' ? 'badge-green' : org.status === 'suspended' ? 'badge-yellow' : 'badge-red'}>
                    {org.status}
                  </span>
                </td>
                <td className="py-3 px-6 text-sm text-slate-500">{new Date(org.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="mt-6 text-center">
          <button onClick={() => fetchOrganizations(true)} className="btn-secondary" disabled={loadingMore}>
            {loadingMore ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}
