const Performance = require('../models/mysql/Performance');

class PerformanceRepository {
  static findAll() { return Performance.findAll(); }
  static findById(id) { return Performance.findById(id); }
  static findByUserId(userId) { return Performance.findByUserId(userId); }
  static findByUserAndCourse(userId, courseId) { return Performance.findByUserAndCourse(userId, courseId); }
  static create(data) { return Performance.create(data); }
  static upsertByUserAndCourse(data) { return Performance.upsertByUserAndCourse(data); }
  static update(id, data) { return Performance.update(id, data); }
  static patch(id, data) { return Performance.patch(id, data); }
  static delete(id) { return Performance.delete(id); }
}

module.exports = PerformanceRepository;
