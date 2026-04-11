const mongoose = require('mongoose');

const localCredentialSchema = new mongoose.Schema({
  user_id: { type: Number, default: null },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  status: { type: String, enum: ['active', 'pending', 'disabled'], default: 'active' },
  requested_role: { type: String, enum: ['learner', 'instructor', 'admin'], default: 'learner' },
  provider: { type: String, enum: ['local'], default: 'local' },
  demo_account: { type: Boolean, default: false }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('LocalCredential', localCredentialSchema, 'local_credentials');
