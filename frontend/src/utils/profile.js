export function getDisplayName(user, fallback = 'Account') {
  if (!user) return fallback;
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  return fullName || user.name || user.email || fallback;
}

export function getShortDisplayName(user, fallback = 'Account') {
  if (!user) return fallback;
  const preferred = (user.first_name || '').trim();
  if (preferred) return preferred;
  const displayName = getDisplayName(user, fallback);
  return displayName.split(/\s+/)[0] || fallback;
}
