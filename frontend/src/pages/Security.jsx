import React from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import { AuditIcon, BellIcon, SecurityIcon } from '../components/Icons';

const implementedControls = [
  'PKCE is supported for SPA/native client sign-in flows.',
  'Redirect URIs are validated as exact registered matches.',
  'Invite-first onboarding and password expiry logic are enforced.',
  'Password reset invalidates existing sessions across tabs.',
  'TOTP MFA with QR setup and recovery codes is live.',
];

const nextLayerControls = [
  'Make MFA enrollment policy-driven at first login for selected org tiers.',
  'Add real risk-based sign-in scoring before authentication is completed.',
  'Add session anomaly detection for suspicious device, geo, or IP drift.',
];

export default function Security() {
  return (
    <div>
      <PageHeader
        eyebrow="Security"
        title="Security Center"
        description="Monitor sign-ins, review audit events, and control operational safeguards for your tenant."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Authentication" subtitle="Track access and suspicious behavior.">
          <div className="space-y-3">
            <Link to="/audit-log" className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
              <span className="flex items-center gap-2"><AuditIcon className="h-4 w-4 text-indigo-600" /> Audit logs</span>
              <span className="text-xs text-gray-500">Open</span>
            </Link>
            <Link to="/email-deliveries" className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
              <span className="flex items-center gap-2"><BellIcon className="h-4 w-4 text-indigo-600" /> Email queue</span>
              <span className="text-xs text-gray-500">Open</span>
            </Link>
          </div>
        </Card>

        <Card title="Controls" subtitle="Security controls already implemented in this Mini Okta build.">
          <ul className="space-y-2 text-sm text-gray-700">
            {implementedControls.map((item) => (
              <li key={item} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                <div className="flex items-start gap-2">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-black" />
                  <span>{item}</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Next Layer" subtitle="Useful follow-up hardening work before calling the platform enterprise-ready.">
          <div className="space-y-2">
            {nextLayerControls.map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700">
                <SecurityIcon className="h-4 w-4 text-indigo-600" />
                {item}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
