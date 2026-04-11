import React from 'react';

const colorMap = {
  'org:admin': 'bg-red-500/20 text-red-400',
  'app:manager': 'bg-orange-500/20 text-orange-400',
  'user:manager': 'bg-blue-500/20 text-blue-400',
  'group:manager': 'bg-purple-500/20 text-purple-400',
  'viewer': 'bg-dark-600/50 text-dark-300',
  'member': 'bg-emerald-500/20 text-emerald-400',
};

export default function RoleBadge({ role }) {
  const color = colorMap[role] || 'bg-teal-500/20 text-teal-400';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {role}
    </span>
  );
}
