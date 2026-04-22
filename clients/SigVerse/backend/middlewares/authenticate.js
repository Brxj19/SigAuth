const { sendError } = require('../utils/response');
const { verifyIdpToken } = require('../utils/idpAuth');
const { resolveSigVerseSessionUserFromClaims } = require('../utils/sessionUser');
const {
  buildClearSessionCookie,
  buildIdpSessionState,
  buildSessionCookie,
  createSessionToken,
  fetchUserInfo,
  maybeRefreshIdpSession,
  readSessionFromRequest,
} = require('../../../shared/sessionAuth');

const IDP_ISSUER_URL = process.env.IDP_ISSUER_URL || 'http://localhost:8000';
const IDP_CLIENT_ID = process.env.IDP_CLIENT_ID || '';
const SESSION_COOKIE_NAME = process.env.APP_SESSION_COOKIE_NAME || 'sigverse_session';
const SESSION_SECRET = process.env.APP_SESSION_SECRET || 'sigverse-dev-session-secret';
const SESSION_TTL_SECONDS = Number(process.env.APP_SESSION_TTL_SECONDS || 60 * 60 * 8);

function sessionCookieOptions() {
  return {
    cookieName: SESSION_COOKIE_NAME,
    maxAge: SESSION_TTL_SECONDS,
    secure: process.env.APP_SESSION_COOKIE_SECURE === 'true',
  };
}

module.exports = async (req, res, next) => {
  const cookieSession = readSessionFromRequest(req, {
    secret: SESSION_SECRET,
    cookieName: SESSION_COOKIE_NAME,
  });
  if (cookieSession?.user) {
    try {
      const refreshed = await maybeRefreshIdpSession({
        session: cookieSession,
        issuerUrl: IDP_ISSUER_URL,
        clientId: IDP_CLIENT_ID,
      });

      let sessionUser = refreshed.session.user;
      if (refreshed.refreshed) {
        const claims = await fetchUserInfo({
          issuerUrl: IDP_ISSUER_URL,
          accessToken: refreshed.session.idp.accessToken,
        });
        sessionUser = await resolveSigVerseSessionUserFromClaims(claims);
        const nextSessionToken = createSessionToken(
          {
            user: sessionUser,
            idp: buildIdpSessionState(refreshed.tokenSet, refreshed.session.idp),
          },
          SESSION_SECRET,
          SESSION_TTL_SECONDS
        );
        res.setHeader('Set-Cookie', buildSessionCookie(nextSessionToken, sessionCookieOptions()));
      }

      req.user = sessionUser;
      return next();
    } catch (error) {
      res.setHeader('Set-Cookie', buildClearSessionCookie(sessionCookieOptions()));
      return sendError(res, 401, 'Session expired. Please sign in again.');
    }
  }

  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 401, 'No token provided');
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyIdpToken(token);
    req.user = await resolveSigVerseSessionUserFromClaims(decoded);
    return next();
  } catch (err) {
    return sendError(res, 401, 'Invalid or expired token');
  }
};
