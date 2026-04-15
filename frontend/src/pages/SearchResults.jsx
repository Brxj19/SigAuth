import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import UserAvatar from '../components/UserAvatar';
import { getDisplayName } from '../utils/profile';
import { hasPermission } from '../utils/permissions';

function normalize(value) {
  return String(value || '').toLowerCase();
}

function includesQuery(value, query) {
  return normalize(value).includes(normalize(query));
}

export default function SearchResults() {
  const { orgId, claims } = useAuth();
  const [searchParams] = useSearchParams();
  const query = (searchParams.get('q') || '').trim();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({
    users: [],
    applications: [],
    groups: [],
    events: [],
  });

  const canReadUsers = hasPermission(claims, 'user:read');
  const canReadApps = hasPermission(claims, 'app:read');
  const canReadGroups = hasPermission(claims, 'group:read');
  const canReadAudit = hasPermission(claims, 'audit:read');

  useEffect(() => {
    if (!orgId || !query) {
      setResults({ users: [], applications: [], groups: [], events: [] });
      return;
    }

    let active = true;
    setLoading(true);

    Promise.allSettled([
      canReadUsers
        ? api.get(`/api/v1/organizations/${orgId}/users?filter[email_contains]=${encodeURIComponent(query)}&limit=12`)
        : Promise.resolve({ data: { data: [] } }),
      canReadApps
        ? api.get(`/api/v1/organizations/${orgId}/applications?limit=100`)
        : Promise.resolve({ data: { data: [] } }),
      canReadGroups
        ? api.get(`/api/v1/organizations/${orgId}/groups?limit=100`)
        : Promise.resolve({ data: { data: [] } }),
      canReadAudit
        ? api.get(`/api/v1/organizations/${orgId}/audit-log?limit=80`)
        : Promise.resolve({ data: { data: [] } }),
    ]).then(([usersRes, appsRes, groupsRes, auditRes]) => {
      if (!active) return;

      const users = usersRes.value?.data?.data || [];
      const applications = (appsRes.value?.data?.data || []).filter((app) => (
        includesQuery(app.name, query) ||
        includesQuery(app.client_id, query) ||
        includesQuery(app.app_type, query)
      )).slice(0, 12);
      const groups = (groupsRes.value?.data?.data || []).filter((group) => (
        includesQuery(group.name, query) ||
        includesQuery(group.description, query)
      )).slice(0, 12);
      const events = (auditRes.value?.data?.data || []).filter((event) => (
        includesQuery(event.event_type, query) ||
        includesQuery(event.resource_type, query) ||
        includesQuery(event.resource_id, query)
      )).slice(0, 12);

      setResults({ users, applications, groups, events });
      setLoading(false);
    }).catch(() => {
      if (!active) return;
      setResults({ users: [], applications: [], groups: [], events: [] });
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [orgId, query, canReadUsers, canReadApps, canReadGroups, canReadAudit]);

  const total = useMemo(
    () => results.users.length + results.applications.length + results.groups.length + results.events.length,
    [results],
  );

  return (
    <div>
      <PageHeader
        eyebrow="Search"
        title={query ? `Results for "${query}"` : 'Global Search'}
        description="Search across users, applications, groups, and audit events from one place."
      />

      {!query ? (
        <div className="surface p-8 text-sm text-gray-500">
          Enter a term in the top search bar to search your organization.
        </div>
      ) : loading ? (
        <div className="surface p-8 text-sm text-gray-500">Searching your organization...</div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 shadow-sm">
            Found <span className="font-semibold text-gray-900">{total}</span> result{total === 1 ? '' : 's'}.
          </div>

          <section className="surface">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="text-base font-semibold text-gray-900">Users</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {results.users.length ? results.users.map((user) => (
                <Link key={user.id} to={`/users/${user.id}`} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50">
                  <UserAvatar user={user} className="h-10 w-10" textClassName="text-xs" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{user.email}</p>
                    <p className="mt-1 truncate text-xs text-gray-500">{getDisplayName(user, 'No name set')}</p>
                  </div>
                </Link>
              )) : <p className="px-5 py-4 text-sm text-gray-500">No matching users.</p>}
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="surface">
              <div className="border-b border-gray-200 px-5 py-4">
                <h2 className="text-base font-semibold text-gray-900">Applications</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {results.applications.length ? results.applications.map((app) => (
                  <Link key={app.id} to={`/applications/${app.id}`} className="block px-5 py-4 hover:bg-gray-50">
                    <p className="text-sm font-medium text-gray-900">{app.name}</p>
                    <p className="mt-1 text-xs text-gray-500">{app.app_type} • {app.client_id}</p>
                  </Link>
                )) : <p className="px-5 py-4 text-sm text-gray-500">No matching applications.</p>}
              </div>
            </div>

            <div className="surface">
              <div className="border-b border-gray-200 px-5 py-4">
                <h2 className="text-base font-semibold text-gray-900">Groups</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {results.groups.length ? results.groups.map((group) => (
                  <Link key={group.id} to={`/groups/${group.id}`} className="block px-5 py-4 hover:bg-gray-50">
                    <p className="text-sm font-medium text-gray-900">{group.name}</p>
                    <p className="mt-1 text-xs text-gray-500">{group.description || `${group.member_count || 0} members`}</p>
                  </Link>
                )) : <p className="px-5 py-4 text-sm text-gray-500">No matching groups.</p>}
              </div>
            </div>
          </section>

          <section className="surface">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="text-base font-semibold text-gray-900">Audit Events</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {results.events.length ? results.events.map((event) => (
                <Link key={event.id} to={`/audit-log/${event.id}`} className="block px-5 py-4 hover:bg-gray-50">
                  <p className="text-sm font-medium text-gray-900">{event.event_type}</p>
                  <p className="mt-1 text-xs text-gray-500">{new Date(event.created_at).toLocaleString()}</p>
                </Link>
              )) : <p className="px-5 py-4 text-sm text-gray-500">No matching audit events.</p>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
