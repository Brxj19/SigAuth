const { sendSuccess, sendError } = require('../utils/response');
const LogService = require('../services/LogService');
const UserService = require('../services/UserService');
const BootstrapService = require('../services/BootstrapService');
const { resolveSigVerseSessionUserFromClaims } = require('../utils/sessionUser');
const {
  buildIdpSessionState,
  buildClearSessionCookie,
  buildIdpLogoutUrl,
  buildSessionCookie,
  createSessionToken,
  exchangeAuthorizationCode,
  fetchUserInfo,
  readSessionFromRequest,
} = require('../../../shared/sessionAuth');

const IDP_ISSUER_URL = process.env.IDP_ISSUER_URL || 'http://localhost:8000';
const IDP_CLIENT_ID = process.env.IDP_CLIENT_ID || '';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3101';
const IDP_REDIRECT_URI = process.env.IDP_REDIRECT_URI || `${FRONTEND_URL}/auth/callback`;
const POST_LOGOUT_REDIRECT_URI = process.env.POST_LOGOUT_REDIRECT_URI || FRONTEND_URL;
const SESSION_COOKIE_NAME = process.env.APP_SESSION_COOKIE_NAME || 'sigverse_session';
const SESSION_SECRET = process.env.APP_SESSION_SECRET || 'sigverse-dev-session-secret';
const SESSION_TTL_SECONDS = Number(process.env.APP_SESSION_TTL_SECONDS || 60 * 60 * 8);
const SECURE_COOKIE = process.env.APP_SESSION_COOKIE_SECURE === 'true';

function sessionCookieOptions() {
  return {
    cookieName: SESSION_COOKIE_NAME,
    maxAge: SESSION_TTL_SECONDS,
    secure: SECURE_COOKIE,
  };
}

function sendIdpOnly(res) {
  return sendError(
    res,
    410,
    'SigVerse now uses SigAuth only. Sign in through the IdP flow.',
    ['Use /login in the SigVerse frontend and continue with SigAuth.']
  );
}

exports.idpOnlyUnavailable = async (req, res) => sendIdpOnly(res);

exports.githubAuth = (req, res) => sendIdpOnly(res);

exports.githubCallback = (req, res) => {
  return sendIdpOnly(res);
};

exports.localLogin = async (req, res) => {
  return sendIdpOnly(res);
};

exports.localSignup = async (req, res) => {
  return sendIdpOnly(res);
};

exports.verifyLoginOtp = async (req, res) => {
  return sendIdpOnly(res);
};

exports.verifySignupOtp = async (req, res) => {
  return sendIdpOnly(res);
};

exports.forgotPassword = async (req, res) => {
  return sendIdpOnly(res);
};

exports.resetPassword = async (req, res) => {
  return sendIdpOnly(res);
};

exports.demoUsers = async (req, res, next) => {
  try {
    sendSuccess(res, 200, BootstrapService.getDemoAccounts());
  } catch (err) { next(err); }
};

exports.idpExchange = async (req, res, next) => {
  try {
    const { code, codeVerifier } = req.body || {};
    if (!code) return sendError(res, 400, 'Authorization code is required');

    const tokenSet = await exchangeAuthorizationCode({
      issuerUrl: IDP_ISSUER_URL,
      clientId: IDP_CLIENT_ID,
      redirectUri: IDP_REDIRECT_URI,
      code,
      codeVerifier,
    });
    const accessToken = tokenSet.access_token || tokenSet.id_token;
    const claims = await fetchUserInfo({
      issuerUrl: IDP_ISSUER_URL,
      accessToken,
    });

    const sessionUser = await resolveSigVerseSessionUserFromClaims(claims);
    const sessionToken = createSessionToken(
      {
        user: sessionUser,
        idp: buildIdpSessionState(tokenSet),
      },
      SESSION_SECRET,
      SESSION_TTL_SECONDS
    );
    res.setHeader('Set-Cookie', buildSessionCookie(sessionToken, sessionCookieOptions()));
    sendSuccess(res, 200, sessionUser, 'SigAuth session established');
  } catch (err) {
    next(err);
  }
};

exports.logoutUrl = async (req, res, next) => {
  try {
    const session = readSessionFromRequest(req, {
      secret: SESSION_SECRET,
      cookieName: SESSION_COOKIE_NAME,
    });
    sendSuccess(res, 200, {
      logoutUrl: buildIdpLogoutUrl({
        issuerUrl: IDP_ISSUER_URL,
        clientId: IDP_CLIENT_ID,
        postLogoutRedirectUri: POST_LOGOUT_REDIRECT_URI,
        idTokenHint: session?.idp?.idTokenHint || null,
      }),
    });
  } catch (err) { next(err); }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await UserService.getById(req.user.sub);
    if (!user) return sendError(res, 404, 'User not found');
    sendSuccess(res, 200, user);
  } catch (err) { next(err); }
};

exports.logout = async (req, res, next) => {
  try {
    if (req.user?.sub) {
      await LogService.logActivity({
        user_id: req.user.sub,
        action: 'logout',
        module: 'auth',
        metadata: {},
        timestamp: new Date()
      });
    }
    res.setHeader('Set-Cookie', buildClearSessionCookie(sessionCookieOptions()));
    sendSuccess(res, 200, null, 'Logged out successfully');
  } catch (err) { next(err); }
};
