const { buildSessionUserFromClaims } = require('../utils/sessionUser');
const {
  buildClearSessionCookie,
  buildSessionCookie,
  createSessionToken,
  fetchUserInfo,
  maybeRefreshIdpSession,
  readSessionFromRequest,
} = require('../../../../shared/sessionAuth');

const IDP_ISSUER_URL = process.env.IDP_ISSUER_URL || 'http://localhost:8000';
const IDP_CLIENT_ID = process.env.IDP_CLIENT_ID || '';
const SESSION_COOKIE_NAME = process.env.APP_SESSION_COOKIE_NAME || 'logistica_session';
const SESSION_SECRET = process.env.APP_SESSION_SECRET || 'logistica-dev-session-secret';
const SESSION_TTL_SECONDS = Number(process.env.APP_SESSION_TTL_SECONDS || 60 * 60 * 8);

function sessionCookieOptions() {
  return {
    cookieName: SESSION_COOKIE_NAME,
    maxAge: SESSION_TTL_SECONDS,
    secure: process.env.APP_SESSION_COOKIE_SECURE === 'true',
  };
}

async function authenticateRequest(req, res, next) {
  const session = readSessionFromRequest(req, {
    secret: SESSION_SECRET,
    cookieName: SESSION_COOKIE_NAME,
  });

  if (!session?.user) {
    return res.status(401).json({
      error: 'Unauthorized',
    });
  }

  try {
    const refreshed = await maybeRefreshIdpSession({
      session,
      issuerUrl: IDP_ISSUER_URL,
      clientId: IDP_CLIENT_ID,
    });

    let nextUser = refreshed.session.user;
    if (refreshed.refreshed) {
      const claims = await fetchUserInfo({
        issuerUrl: IDP_ISSUER_URL,
        accessToken: refreshed.session.idp.accessToken,
      });
      nextUser = buildSessionUserFromClaims(claims);
      const nextSessionToken = createSessionToken(
        {
          user: nextUser,
          idp: refreshed.session.idp,
        },
        SESSION_SECRET,
        SESSION_TTL_SECONDS
      );
      res.setHeader('Set-Cookie', buildSessionCookie(nextSessionToken, sessionCookieOptions()));
    }

    if (!nextUser.clientRole) {
      return res.status(403).json({
        error: 'No recognized application role is attached to this session.',
      });
    }

    req.user = nextUser;
    req.clientRole = nextUser.clientRole;
    next();
  } catch (error) {
    res.setHeader('Set-Cookie', buildClearSessionCookie(sessionCookieOptions()));
    return res.status(401).json({
      error: 'Session expired. Please sign in again.',
    });
  }
}

module.exports = {
  authenticateRequest,
};
