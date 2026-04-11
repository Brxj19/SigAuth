const LearningEvent = require('../models/mongo/LearningEvent');
const ActivityLog = require('../models/mongo/ActivityLog');
const AuthLog = require('../models/mongo/AuthLog');

class LogService {
  static logLearningEvent(data) { return LearningEvent.create(data); }
  static logActivity(data) { return ActivityLog.create(data); }
  static logAuth(data) { return AuthLog.create(data); }

  static getLearningEvents(filter = {}) { return LearningEvent.find(filter).sort({ timestamp: -1 }); }
  static getActivityLogs(filter = {}) { return ActivityLog.find(filter).sort({ timestamp: -1 }); }
  static getAuthLogs(filter = {}) { return AuthLog.find(filter).sort({ timestamp: -1 }); }
}

module.exports = LogService;
