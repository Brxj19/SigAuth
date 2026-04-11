const Enrollment = require('../models/mysql/Enrollment');

class EnrollmentRepository {
  static findAll() { return Enrollment.findAll(); }
  static findById(id) { return Enrollment.findById(id); }
  static findByUserId(userId) { return Enrollment.findByUserId(userId); }
  static findByUserAndCourse(userId, courseId) { return Enrollment.findByUserAndCourse(userId, courseId); }
  static create(data) { return Enrollment.create(data); }
  static update(id, data) { return Enrollment.update(id, data); }
  static patch(id, data) { return Enrollment.patch(id, data); }
  static delete(id) { return Enrollment.delete(id); }
}

module.exports = EnrollmentRepository;
