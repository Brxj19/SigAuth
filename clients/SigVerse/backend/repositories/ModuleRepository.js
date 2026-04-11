const Module = require('../models/mysql/Module');

class ModuleRepository {
  static findAll() { return Module.findAll(); }
  static findById(id) { return Module.findById(id); }
  static findByIdWithLessons(id) { return Module.findByIdWithLessons(id); }
  static findByCourseId(courseId) { return Module.findByCourseId(courseId); }
  static create(data) { return Module.create(data); }
  static update(id, data) { return Module.update(id, data); }
  static patch(id, data) { return Module.patch(id, data); }
  static delete(id) { return Module.delete(id); }
}

module.exports = ModuleRepository;
