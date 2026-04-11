const Lesson = require('../models/mysql/Lesson');

class LessonRepository {
  static findAll() { return Lesson.findAll(); }
  static findById(id) { return Lesson.findById(id); }
  static findByModuleId(moduleId) { return Lesson.findByModuleId(moduleId); }
  static create(data) { return Lesson.create(data); }
  static update(id, data) { return Lesson.update(id, data); }
  static patch(id, data) { return Lesson.patch(id, data); }
  static delete(id) { return Lesson.delete(id); }
}

module.exports = LessonRepository;
