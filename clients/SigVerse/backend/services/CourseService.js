const CourseRepository = require('../repositories/CourseRepository');
const cache = require('../config/cache');

class CourseService {
  static async getAll() {
    // Cache the list response so repeated reads avoid an extra repository call.
    const cached = cache.get('course_list');
    if (cached) return cached;
    const courses = await CourseRepository.findAll();
    cache.set('course_list', courses);
    return courses;
  }

  // Detail lookups include related modules for screens that need the full course structure.
  static getById(id) { return CourseRepository.findByIdWithModules(id); }

  // Any write can make the cached course list stale, so all mutations clear it.
  static async create(data) {
    const course = await CourseRepository.create(data);
    cache.del('course_list');
    return course;
  }

  static async update(id, data) {
    const course = await CourseRepository.update(id, data);
    cache.del('course_list');
    return course;
  }

  static async patch(id, data) {
    const course = await CourseRepository.patch(id, data);
    cache.del('course_list');
    return course;
  }

  static async remove(id) {
    const course = await CourseRepository.findById(id);
    // Surface a consistent 404 instead of treating a missing course as a successful delete.
    if (!course) { const err = new Error('Course not found'); err.status = 404; throw err; }
    await CourseRepository.delete(id);
    cache.del('course_list');
    return true;
  }
}

module.exports = CourseService;
