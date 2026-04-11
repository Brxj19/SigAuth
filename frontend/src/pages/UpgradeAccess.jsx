import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import PageHeader from '../components/PageHeader';

const INITIAL_FORM = {
  company_name: '',
  company_website: '',
  company_size: '',
  primary_use_case: '',
  expected_monthly_users: '',
  requested_features: '',
  billing_contact_name: '',
  billing_contact_email: '',
  notes: '',
  agree_to_terms: false,
};

export default function UpgradeAccess() {
  const { orgId, isSuperAdmin } = useAuth();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState(INITIAL_FORM);

  useEffect(() => {
    if (!orgId || isSuperAdmin) {
      setLoading(false);
      return;
    }
    api.get(`/api/v1/organizations/${orgId}/plan-status`)
      .then((res) => {
        setPlan(res.data);
        const payload = res.data?.upgrade_request?.payload;
        if (payload) {
          setForm((current) => ({
            ...current,
            ...payload,
            expected_monthly_users: payload.expected_monthly_users ?? '',
          }));
        }
      })
      .catch((err) => setError(err.response?.data?.detail?.error_description || 'Unable to load organization tier info.'))
      .finally(() => setLoading(false));
  }, [orgId, isSuperAdmin]);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!orgId) return;
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        expected_monthly_users: form.expected_monthly_users === '' ? null : Number(form.expected_monthly_users),
      };
      const res = await api.post(`/api/v1/organizations/${orgId}/upgrade-request`, payload);
      setPlan(res.data);
      setSuccess('Upgrade request submitted. Your organization will get full access once this request is approved.');
    } catch (err) {
      setError(err.response?.data?.detail?.error_description || 'Unable to submit upgrade request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="py-20 text-center text-dark-400">Loading plan details...</div>;
  if (isSuperAdmin) return <div className="py-20 text-center text-dark-400">Super admins already have full access.</div>;
  if (!plan) return <div className="py-20 text-center text-dark-400">No plan information available for this organization.</div>;

  const isLimited = plan.access_tier === 'limited';
  const requestStatus = plan?.upgrade_request?.status || 'not_submitted';

  return (
    <div>
      <PageHeader
        eyebrow="Organization Plan"
        title="Upgrade To Full Access"
        description="Submit your organization details to replace payment collection in this project and request verified enterprise access."
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className={isLimited ? 'badge-yellow' : 'badge-green'}>
          {isLimited ? 'Free Tier (Limited)' : 'Verified Enterprise'}
        </span>
        <span className={plan.verification_status === 'approved' ? 'badge-green' : 'badge-orange'}>
          verification: {plan.verification_status}
        </span>
        <span className="badge-gray">request: {requestStatus}</span>
      </div>

      {!isLimited ? (
        <div className="card">
          <p className="text-sm text-slate-600">Your organization already has full enterprise access. No upgrade request is needed.</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="card space-y-5">
          {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
          {success ? <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</div> : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Company Name</label>
              <input className="input-field" value={form.company_name} onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))} required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Company Website</label>
              <input className="input-field" value={form.company_website} onChange={(e) => setForm((f) => ({ ...f, company_website: e.target.value }))} placeholder="https://example.com" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Company Size</label>
              <input className="input-field" value={form.company_size} onChange={(e) => setForm((f) => ({ ...f, company_size: e.target.value }))} placeholder="1-50 employees" required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Expected Monthly Users</label>
              <input type="number" min="0" className="input-field" value={form.expected_monthly_users} onChange={(e) => setForm((f) => ({ ...f, expected_monthly_users: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Primary Use Case</label>
            <textarea className="input-field min-h-[92px]" value={form.primary_use_case} onChange={(e) => setForm((f) => ({ ...f, primary_use_case: e.target.value }))} required />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Requested Features</label>
            <textarea className="input-field min-h-[92px]" value={form.requested_features} onChange={(e) => setForm((f) => ({ ...f, requested_features: e.target.value }))} placeholder="SSO for production apps, higher limits, advanced audit exports..." />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Billing/Owner Contact Name</label>
              <input className="input-field" value={form.billing_contact_name} onChange={(e) => setForm((f) => ({ ...f, billing_contact_name: e.target.value }))} required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Billing/Owner Contact Email</label>
              <input type="email" className="input-field" value={form.billing_contact_email} onChange={(e) => setForm((f) => ({ ...f, billing_contact_email: e.target.value }))} required />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Additional Notes</label>
            <textarea className="input-field min-h-[100px]" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>

          <label className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4"
              checked={form.agree_to_terms}
              onChange={(e) => setForm((f) => ({ ...f, agree_to_terms: e.target.checked }))}
            />
            <span className="text-sm text-gray-700">
              I confirm these details are accurate and understand this submission replaces payment collection for this demo environment.
            </span>
          </label>

          <div className="flex justify-end">
            <button className="btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Upgrade Request'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
