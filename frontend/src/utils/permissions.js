export function getPermissions(claims) {
  return claims?.permissions || [];
}

export function getRoles(claims) {
  return claims?.roles || [];
}

export function hasPermission(claims, permission) {
  const permissions = getPermissions(claims);
  return permissions.includes('*') || permissions.includes(permission);
}

export function hasAnyPermission(claims, requiredPermissions = []) {
  if (!requiredPermissions.length) return true;
  return requiredPermissions.some((permission) => hasPermission(claims, permission));
}

export function hasRole(claims, role) {
  const roles = getRoles(claims);
  return roles.includes(role);
}
