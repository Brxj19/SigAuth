const http = require('http');
const { URL } = require('url');
const {
  buildIdpSessionState,
  buildClearSessionCookie,
  buildIdpLogoutUrl,
  buildSessionCookie,
  createSessionToken,
  exchangeAuthorizationCode,
  fetchUserInfo,
  maybeRefreshIdpSession,
  readSessionFromRequest,
} = require('../../shared/sessionAuth');

const PORT = Number(process.env.PORT || 4002);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4001';
const IDP_ISSUER_URL = process.env.IDP_ISSUER_URL || 'http://localhost:8000';
const IDP_CLIENT_ID = process.env.IDP_CLIENT_ID || 'project-tracker-client-id';
const IDP_REDIRECT_URI = process.env.IDP_REDIRECT_URI || `${FRONTEND_URL}/callback`;
const POST_LOGOUT_REDIRECT_URI = process.env.POST_LOGOUT_REDIRECT_URI || FRONTEND_URL;
const SESSION_COOKIE_NAME = process.env.APP_SESSION_COOKIE_NAME || 'project_tracker_session';
const SESSION_SECRET = process.env.APP_SESSION_SECRET || 'project-tracker-dev-session-secret';
const SESSION_TTL_SECONDS = Number(process.env.APP_SESSION_TTL_SECONDS || 60 * 60 * 8);
const SECURE_COOKIE = process.env.APP_SESSION_COOKIE_SECURE === 'true';

function sendJson(res, status, payload, extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': FRONTEND_URL,
    'Access-Control-Allow-Credentials': 'true',
    ...extraHeaders,
  });
  res.end(JSON.stringify(payload));
}

function sessionCookieOptions() {
  return {
    cookieName: SESSION_COOKIE_NAME,
    maxAge: SESSION_TTL_SECONDS,
    secure: SECURE_COOKIE,
  };
}

function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function getSessionUser(req) {
  const session = readSessionFromRequest(req, {
    secret: SESSION_SECRET,
    cookieName: SESSION_COOKIE_NAME,
  });
  return session || null;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': FRONTEND_URL,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    });
    res.end();
    return;
  }

  try {
    if (req.method === 'GET' && url.pathname === '/health') {
      sendJson(res, 200, { ok: true, service: 'project-tracker-backend' });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/auth/idp/exchange') {
      const body = await getRequestBody(req);
      if (!body.code) {
        sendJson(res, 400, { error: 'Authorization code is required' });
        return;
      }

      const tokenSet = await exchangeAuthorizationCode({
        issuerUrl: IDP_ISSUER_URL,
        clientId: IDP_CLIENT_ID,
        redirectUri: IDP_REDIRECT_URI,
        code: body.code,
        codeVerifier: body.codeVerifier,
      });
      const accessToken = tokenSet.access_token || tokenSet.id_token;
      const userInfo = await fetchUserInfo({
        issuerUrl: IDP_ISSUER_URL,
        accessToken,
      });

      const user = {
        name: userInfo.name || userInfo.email || 'Project Tracker User',
        email: userInfo.email || null,
        email_verified: !!userInfo.email_verified,
        roles: Array.isArray(userInfo.roles) ? userInfo.roles : [],
        permissions: Array.isArray(userInfo.permissions) ? userInfo.permissions : [],
        claims: userInfo,
      };

      const sessionToken = createSessionToken(
        {
          user,
          idp: buildIdpSessionState(tokenSet),
        },
        SESSION_SECRET,
        SESSION_TTL_SECONDS
      );
      sendJson(
        res,
        200,
        { user },
        { 'Set-Cookie': buildSessionCookie(sessionToken, sessionCookieOptions()) }
      );
      return;
    }

    if (req.method === 'GET' && url.pathname === '/auth/session') {
      const session = getSessionUser(req);
      if (!session?.user) {
        sendJson(res, 401, { error: 'Unauthorized' });
        return;
      }

      let nextSession = session;
      let nextUser = session.user;
      try {
        const refreshed = await maybeRefreshIdpSession({
          session,
          issuerUrl: IDP_ISSUER_URL,
          clientId: IDP_CLIENT_ID,
        });
        if (refreshed.refreshed) {
          const claims = await fetchUserInfo({
            issuerUrl: IDP_ISSUER_URL,
            accessToken: refreshed.session.idp.accessToken,
          });
          nextUser = {
            name: claims.name || claims.email || 'Project Tracker User',
            email: claims.email || null,
            email_verified: !!claims.email_verified,
            roles: Array.isArray(claims.roles) ? claims.roles : [],
            permissions: Array.isArray(claims.permissions) ? claims.permissions : [],
            claims,
          };
          nextSession = { ...refreshed.session, user: nextUser };
          const nextSessionToken = createSessionToken(nextSession, SESSION_SECRET, SESSION_TTL_SECONDS);
          sendJson(
            res,
            200,
            { user: nextUser },
            { 'Set-Cookie': buildSessionCookie(nextSessionToken, sessionCookieOptions()) }
          );
          return;
        }
      } catch (_error) {
        sendJson(
          res,
          401,
          { error: 'Session expired. Please sign in again.' },
          { 'Set-Cookie': buildClearSessionCookie(sessionCookieOptions()) }
        );
        return;
      }

      sendJson(res, 200, { user: nextUser });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/auth/logout') {
      sendJson(
        res,
        204,
        {},
        { 'Set-Cookie': buildClearSessionCookie(sessionCookieOptions()) }
      );
      return;
    }

    if (req.method === 'GET' && url.pathname === '/auth/logout-url') {
      const session = getSessionUser(req);
      sendJson(res, 200, {
        logoutUrl: buildIdpLogoutUrl({
          issuerUrl: IDP_ISSUER_URL,
          clientId: IDP_CLIENT_ID,
          postLogoutRedirectUri: POST_LOGOUT_REDIRECT_URI,
          idTokenHint: session?.idp?.idTokenHint || null,
        }),
      });
      return;
    }

    sendJson(res, 404, { error: 'Not found' });
  } catch (error) {
    sendJson(res, 500, { error: error.message || 'Unexpected server error' });
  }
});

server.listen(PORT, () => {
  console.log(`Project Tracker backend listening on http://localhost:${PORT}`);
});
