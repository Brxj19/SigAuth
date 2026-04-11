import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/PageHeader';
import { ArrowLeftIcon } from '../components/Icons';
import CopyButton from '../components/CopyButton';

function formatLabel(key) {
  return String(key)
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function isPrimitive(value) {
  return value === null || ['string', 'number', 'boolean'].includes(typeof value);
}

function MetadataValue({ value }) {
  if (value === null) return <span className="text-slate-400">null</span>;
  if (typeof value === 'boolean') {
    return (
      <span className={value ? 'badge-green' : 'badge-gray'}>
        {String(value)}
      </span>
    );
  }
  if (typeof value === 'number') return <span className="font-mono text-slate-800">{value}</span>;
  if (typeof value === 'string') {
    const looksLikeId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
    return (
      <div className="flex items-center gap-2 break-all">
        <span className={looksLikeId ? 'font-mono text-xs text-slate-700' : 'text-slate-800'}>{value}</span>
        {(looksLikeId || value.includes('@')) ? <CopyButton value={value} label="Copy value" /> : null}
      </div>
    );
  }
  return null;
}

function MetadataNode({ label, value, depth = 0 }) {
  if (isPrimitive(value)) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{formatLabel(label)}</dt>
        <dd className="mt-1 text-sm"><MetadataValue value={value} /></dd>
      </div>
    );
  }

  if (Array.isArray(value)) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            {formatLabel(label)}
          </p>
          <span className="badge-gray">{value.length} items</span>
        </div>
        {value.length === 0 ? (
          <p className="text-xs text-slate-500">No entries</p>
        ) : (
          <div className="space-y-2">
            {value.map((item, index) => (
              <div key={`${label}-${index}`} className={depth > 1 ? '' : 'rounded-md border border-slate-200 bg-slate-50 p-2'}>
                {isPrimitive(item)
                  ? <MetadataValue value={item} />
                  : <MetadataBlock value={item} depth={depth + 1} />}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{formatLabel(label)}</p>
      <MetadataBlock value={value} depth={depth + 1} />
    </div>
  );
}

function MetadataBlock({ value, depth = 0 }) {
  const entries = Object.entries(value || {});
  if (entries.length === 0) {
    return <p className="text-xs text-slate-500">No metadata fields</p>;
  }
  return (
    <dl className={depth === 0 ? 'grid grid-cols-1 gap-3 md:grid-cols-2' : 'space-y-2'}>
      {entries.map(([key, fieldValue]) => (
        <MetadataNode key={`${key}-${depth}`} label={key} value={fieldValue} depth={depth} />
      ))}
    </dl>
  );
}

export default function AuditLogDetail() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { orgId } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orgId || !eventId) return;
    setLoading(true);
    setError('');
    api.get(`/api/v1/organizations/${orgId}/audit-log/${eventId}`)
      .then(res => setEvent(res.data))
      .catch(err => {
        setError(err.response?.data?.detail?.error_description || 'Failed to load audit event.');
      })
      .finally(() => setLoading(false));
  }, [orgId, eventId]);

  if (loading) return <div className="text-center py-20 text-dark-400">Loading...</div>;

  if (!event) {
    return (
      <div>
        <button onClick={() => navigate('/audit-log')} className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800">
          <ArrowLeftIcon className="h-4 w-4" />
          Back to audit log
        </button>
        <div className="card">
          <p className="text-sm text-red-700">{error || 'Audit event not found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => navigate('/audit-log')} className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeftIcon className="h-4 w-4" />
        Back to audit log
      </button>

      <PageHeader
        eyebrow="Audit Event"
        title={event.event_type}
        description={`Event #${event.id} • ${new Date(event.created_at).toLocaleString()}`}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Event Details</h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-xs uppercase text-slate-500">Event ID</dt>
              <dd className="mt-1 flex items-center gap-2 text-slate-900">
                {event.id}
                <CopyButton value={event.id} label="Copy event id" />
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">Timestamp</dt>
              <dd className="mt-1 text-slate-900">{new Date(event.created_at).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">Actor Type</dt>
              <dd className="mt-1 text-slate-900">{event.actor_type || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">Actor ID</dt>
              <dd className="mt-1 flex items-center gap-2 break-all font-mono text-sm text-slate-700">
                {event.actor_id || '—'}
                {event.actor_id ? <CopyButton value={event.actor_id} label="Copy actor id" /> : null}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">Resource Type</dt>
              <dd className="mt-1 text-slate-900">{event.resource_type || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">Resource ID</dt>
              <dd className="mt-1 flex items-center gap-2 break-all font-mono text-sm text-slate-700">
                {event.resource_id || '—'}
                {event.resource_id ? <CopyButton value={event.resource_id} label="Copy resource id" /> : null}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">Organization ID</dt>
              <dd className="mt-1 flex items-center gap-2 break-all font-mono text-sm text-slate-700">
                {event.org_id || '—'}
                {event.org_id ? <CopyButton value={event.org_id} label="Copy organization id" /> : null}
              </dd>
            </div>
          </dl>
        </div>

        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Metadata</h2>
            <CopyButton value={JSON.stringify(event.metadata || {}, null, 2)} label="Copy metadata JSON" />
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <MetadataBlock value={event.metadata || {}} />
          </div>
        </div>
      </div>
    </div>
  );
}
