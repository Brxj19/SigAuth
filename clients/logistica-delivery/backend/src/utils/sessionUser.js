const { deriveClientRole } = require('./idpAuth');

function buildSessionUserFromClaims(userInfo) {
  const clientRole = deriveClientRole(userInfo);
  if (!clientRole) {
    const error = new Error('No recognized application role was issued for this account. Ask your SigAuth administrator to configure an application role mapping.');
    error.status = 403;
    throw error;
  }

  const organization = userInfo.org_name || userInfo.organization || userInfo.tenant || userInfo.org_id || null;
  return {
    sub: userInfo.sub,
    name: userInfo.name || userInfo.email || 'User',
    email: userInfo.email || null,
    organization,
    roles: Array.isArray(userInfo.roles) ? userInfo.roles : [],
    permissions: Array.isArray(userInfo.permissions) ? userInfo.permissions : [],
    appRoles: Array.isArray(userInfo.app_roles) ? userInfo.app_roles : [],
    clientRole,
  };
}

module.exports = {
  buildSessionUserFromClaims,
};
