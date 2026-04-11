import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';

export default function OrgSelector() {
  const { orgId, setOrgId, isSuperAdmin } = useAuth();
  const [orgs, setOrgs] = useState([]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    api.get('/api/v1/admin/organizations?limit=100')
      .then(res => setOrgs(res.data.data || []))
      .catch(() => {});
  }, [isSuperAdmin]);

  if (!isSuperAdmin) {
    return (
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">Organization Scope</p>
        <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">Tenant-scoped session</div>
      </div>
    );
  }

  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">Organization</label>
      <select
        value={orgId || ''}
        onChange={e => setOrgId(e.target.value)}
        className="input-field mt-2 text-sm"
      >
        <option value="" disabled>Select organization</option>
        {orgs.length === 0 && orgId && (
          <option value={orgId}>Current organization</option>
        )}
        {orgs.map(org => (
          <option key={org.id} value={org.id}>
            {org.display_name || org.name}
          </option>
        ))}
      </select>
    </div>
  );
}
