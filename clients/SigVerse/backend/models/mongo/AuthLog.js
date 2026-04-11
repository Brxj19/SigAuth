const mongoose = require('mongoose');

const authLogSchema = new mongoose.Schema({
  user_id: { type: Number },
  provider: { type: String, default: 'github' },
  status: { type: String, enum: ['success', 'failure'], required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuthLog', authLogSchema, 'auth_logs');
