const { deriveClientRole, verifyIdpToken } = require('../utils/idpAuth');

function extractBearerToken(header = '') {
  if (!header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim();
}

function authenticateRequest(req, res, next) {
  try {
    const token = extractBearerToken(req.headers.authorization || '');

    if (!token) {
      const err = new Error('Missing bearer token');
      err.status = 401;
      throw err;
    }

    const claims = verifyIdpToken(token);
    req.user = claims;
    req.clientRole = deriveClientRole(claims);
    next();
  } catch (error) {
    const status = error.status || 401;
    res.status(status).json({
      error: error.message || 'Unauthorized'
    });
  }
}

module.exports = {
  authenticateRequest
};

