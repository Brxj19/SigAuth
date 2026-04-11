const mongoose = require('mongoose');

const learningEventSchema = new mongoose.Schema({
  user_id: { type: Number, required: true },
  course_id: { type: Number, required: true },
  lesson_id: { type: Number, required: true },
  action: { type: String, enum: ['start', 'complete'], required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LearningEvent', learningEventSchema, 'learning_events');
