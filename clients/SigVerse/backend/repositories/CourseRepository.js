const Course = require('../models/mysql/Course');

class CourseRepository {
  static findAll() { return Course.findAll(); }
  static findById(id) { return Course.findById(id); }
  static findByIdWithModules(id) { return Course.findByIdWithModules(id); }
  static create(data) { return Course.create(data); }
  static update(id, data) { return Course.update(id, data); }
  static patch(id, data) { return Course.patch(id, data); }
  static delete(id) { return Course.delete(id); }
}

module.exports = CourseRepository;
