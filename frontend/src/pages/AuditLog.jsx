import React from 'react';
import AuditLogViewer from '../components/AuditLogViewer';

export default function AuditLog() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <p className="text-dark-400 mt-1">View all system events (append-only)</p>
      </div>
      <div className="card">
        <AuditLogViewer />
      </div>
    </div>
  );
}
