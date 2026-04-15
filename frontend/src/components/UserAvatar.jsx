import React, { useEffect, useMemo, useState } from 'react';
import { getDisplayName } from '../utils/profile';

function getInitials({ name, email }) {
  const source = String(name || email || '').trim();
  if (!source) return '?';

  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export default function UserAvatar({
  user,
  name,
  email,
  imageUrl,
  className = 'h-10 w-10',
  textClassName = 'text-sm',
}) {
  const resolvedName = name || getDisplayName(user, '');
  const resolvedEmail = email || user?.email || '';
  const resolvedImageUrl = imageUrl ?? user?.profile_image_url ?? '';
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [resolvedImageUrl]);

  const initials = useMemo(
    () => getInitials({ name: resolvedName, email: resolvedEmail }),
    [resolvedEmail, resolvedName],
  );

  if (resolvedImageUrl && !failed) {
    return (
      <img
        src={resolvedImageUrl}
        alt={resolvedName || resolvedEmail || 'Profile picture'}
        className={`rounded-full border border-gray-200 bg-gray-100 object-cover ${className}`.trim()}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span
      className={`flex items-center justify-center rounded-full border border-gray-200 bg-gray-100 font-semibold text-gray-700 ${className} ${textClassName}`.trim()}
      aria-label={resolvedName || resolvedEmail || 'Profile avatar'}
    >
      {initials}
    </span>
  );
}
