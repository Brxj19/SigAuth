const { sendError } = require('../utils/response');

module.exports = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return sendError(res, 401, 'Authentication required');
  }
  if (!allowedRoles.includes(req.user.role)) {
    return sendError(res, 403, 'Access denied: insufficient role');
  }
  next();
};
