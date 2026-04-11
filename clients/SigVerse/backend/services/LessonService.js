const LessonRepository = require('../repositories/LessonRepository');

class LessonService {
  static getAll() { return LessonRepository.findAll(); }
  static getById(id) { return LessonRepository.findById(id); }

  static create(data) { return LessonRepository.create(data); }
  static update(id, data) { return LessonRepository.update(id, data); }
  static patch(id, data) { return LessonRepository.patch(id, data); }

  static async remove(id) {
    const lesson = await LessonRepository.findById(id);
    if (!lesson) { const err = new Error('Lesson not found'); err.status = 404; throw err; }
    return LessonRepository.delete(id);
  }
}

module.exports = LessonService;
