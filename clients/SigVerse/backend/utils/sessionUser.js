const UserRepository = require('../repositories/UserRepository');
const { deriveSigVerseRole } = require('./idpAuth');

async function resolveSigVerseSessionUserFromClaims(claims) {
  const role = deriveSigVerseRole(claims);
  const email = String(claims.email || '').trim().toLowerCase();
  const name = claims.name || email || 'SigVerse User';

  if (!email) {
    const error = new Error('IDP token does not include an email');
    error.status = 401;
    throw error;
  }

  if (!role) {
    const error = new Error('No recognized SigVerse application role was issued for this account. Ask your SigAuth administrator to configure an application role mapping.');
    error.status = 403;
    throw error;
  }

  let localUser = await UserRepository.findByEmail(email);
  if (!localUser) {
    localUser = await UserRepository.create({
      name,
      email,
      role,
    });
  } else if (localUser.role !== role || localUser.name !== name) {
    localUser = await UserRepository.patch(localUser.id, { role, name });
  }

  return {
    sub: localUser.id,
    external_sub: claims.sub,
    email,
    role: localUser.role,
    name: localUser.name,
    app_roles: claims.app_roles || [],
    groups: claims.groups || [],
    app_groups: claims.app_groups || [],
  };
}

module.exports = {
  resolveSigVerseSessionUserFromClaims,
};
