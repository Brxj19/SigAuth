const { sendSuccess, sendError } = require('../utils/response');
const LogService = require('../services/LogService');
const UserService = require('../services/UserService');
const BootstrapService = require('../services/BootstrapService');

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

exports.getMe = async (req, res, next) => {
  try {
    const user = await UserService.getById(req.user.sub);
    if (!user) return sendError(res, 404, 'User not found');
    sendSuccess(res, 200, user);
  } catch (err) { next(err); }
};

exports.logout = async (req, res, next) => {
  try {
    await LogService.logActivity({
      user_id: req.user.sub,
      action: 'logout',
      module: 'auth',
      metadata: {},
      timestamp: new Date()
    });
    sendSuccess(res, 200, null, 'Logged out successfully');
  } catch (err) { next(err); }
};
