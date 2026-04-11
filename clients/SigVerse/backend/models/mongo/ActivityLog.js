const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user_id: { type: Number, required: true },
  action: { type: String, required: true },
  module: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema, 'activity_logs');
