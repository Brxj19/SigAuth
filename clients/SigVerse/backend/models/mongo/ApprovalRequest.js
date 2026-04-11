const mongoose = require('mongoose');

// ApprovalRequest model for MongoDB database
const approvalRequestSchema = new mongoose.Schema({
  requester_id: { type: Number, default: null },
  reviewer_id: { type: Number, default: null },
  request_type: { type: String, enum: ['instructor_signup', 'course', 'module', 'lesson'], required: true },
  action: { type: String, enum: ['create', 'update', 'delete'], required: true },
  entity_id: { type: mongoose.Schema.Types.Mixed, default: null },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  processing_lock: { type: Boolean, default: false },
  payload: { type: mongoose.Schema.Types.Mixed, default: {} },
  note: { type: String, default: '' },
  reviewed_at: { type: Date, default: null }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('ApprovalRequest', approvalRequestSchema, 'approval_requests');
