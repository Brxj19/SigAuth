export const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
};

export const formatPercentage = (val) => {
  return parseFloat(val || 0).toFixed(1) + '%';
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
};

export const getRoleColor = (role) => {
  switch (role) {
    case 'admin': return '#ef4444';
    case 'instructor': return '#8b5cf6';
    case 'learner': return '#06b6d4';
    default: return '#6b7280';
  }
};
