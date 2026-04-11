const ActivityLog = require('../models/mongo/ActivityLog');

module.exports = async (req, res, next) => {
  try {
    await ActivityLog.create({
      user_id: req.user?.sub || 0,
      action: `${req.method} ${req.path}`,
      module: req.path.split('/')[1],
      metadata: { body: req.body, params: req.params, query: req.query },
      timestamp: new Date()
    });
  } catch (err) {
    console.error('Logger middleware error:', err.message);
  }
  next();
};
