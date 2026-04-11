import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function AuditLogViewer() {
  const { orgId } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [filters, setFilters] = useState({ event_type: '', from_date: '', to_date: '' });
  const [loading, setLoading] = useState(false);

  const fetchEvents = async (loadMore = false) => {
    if (!orgId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '50');
      if (loadMore && cursor) params.set('cursor', cursor);
      if (filters.event_type) params.set('event_type', filters.event_type);
      if (filters.from_date) params.set('from_date', filters.from_date);
      if (filters.to_date) params.set('to_date', filters.to_date);

      const res = await api.get(`/api/v1/organizations/${orgId}/audit-log?${params}`);
      const data = res.data.data || [];
      const pag = res.data.pagination || {};
      if (loadMore) setEvents(prev => [...prev, ...data]);
      else setEvents(data);
      setCursor(pag.next_cursor);
      setHasMore(pag.has_more || false);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, [orgId, filters]);

  const eventColors = {
    'user.login.success': 'badge-green',
    'user.login.failure': 'badge-red',
    'user.created': 'badge-blue',
    'user.suspended': 'badge-yellow',
    'user.password_reset': 'badge-orange',
    'id_token.issued': 'badge-teal',
    'token.revoked': 'badge-red',
    'app.created': 'badge-purple',
    'app.secret_rotated': 'badge-orange',
    'group.member_added': 'badge-blue',
    'group.role_assigned': 'badge-purple',
  };

  return (
    <div>
      <div className="flex gap-4 mb-6">
        <select
          value={filters.event_type}
          onChange={e => setFilters(f => ({ ...f, event_type: e.target.value }))}
          className="input-field max-w-xs"
        >
          <option value="">All Events</option>
          {Object.keys(eventColors).map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <input
          type="date"
          value={filters.from_date}
          onChange={e => setFilters(f => ({ ...f, from_date: e.target.value }))}
          className="input-field max-w-xs"
          placeholder="From"
        />
        <input
          type="date"
          value={filters.to_date}
          onChange={e => setFilters(f => ({ ...f, to_date: e.target.value }))}
          className="input-field max-w-xs"
          placeholder="To"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-600">
              <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Timestamp</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Event</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Actor</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Resource</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-dark-400 uppercase">Details</th>
            </tr>
          </thead>
          <tbody>
            {events.map(e => (
              <tr
                key={e.id}
                className="table-row cursor-pointer"
                onClick={() => navigate(`/audit-log/${e.id}`)}
                title="Open event details"
              >
                <td className="py-3 px-4 text-xs text-dark-400 whitespace-nowrap">
                  {new Date(e.created_at).toLocaleString()}
                </td>
                <td className="py-3 px-4">
                  <span className={eventColors[e.event_type] || 'badge-gray'}>{e.event_type}</span>
                </td>
                <td className="py-3 px-4 text-xs text-dark-300 font-mono">{e.actor_id?.substring(0, 8) || '—'}</td>
                <td className="py-3 px-4 text-xs text-dark-300">{e.resource_type} {e.resource_id?.substring(0, 8)}</td>
                <td className="py-3 px-4 text-xs text-dark-400 max-w-[200px] truncate">
                  {JSON.stringify(e.metadata).substring(0, 80)}
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-dark-500">No audit events found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="mt-4 text-center">
          <button onClick={() => fetchEvents(true)} disabled={loading} className="btn-secondary">
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
