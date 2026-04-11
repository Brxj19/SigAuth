const Progress = require('../models/mysql/Progress');

class ProgressRepository {
  static findAll() { return Progress.findAll(); }
  static findById(id) { return Progress.findById(id); }
  static findByUserId(userId) { return Progress.findByUserId(userId); }
  static findByUserAndCourse(userId, courseId) { return Progress.findByUserAndCourse(userId, courseId); }
  static create(data) { return Progress.create(data); }
  static update(id, data) { return Progress.update(id, data); }
  static patch(id, data) { return Progress.patch(id, data); }
  static delete(id) { return Progress.delete(id); }
}

module.exports = ProgressRepository;
