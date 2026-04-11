const CourseRepository = require('../repositories/CourseRepository');
const ModuleRepository = require('../repositories/ModuleRepository');
const LessonRepository = require('../repositories/LessonRepository');

class InstructorScopeService {
  static async assertCourseOwnership(userId, courseId) {
    const course = await CourseRepository.findById(courseId);
    if (!course) {
      const err = new Error('Course not found');
      err.status = 404;
      throw err;
    }

    if (course.instructor_id !== userId) {
      const err = new Error('You can only manage your own courses');
      err.status = 403;
      throw err;
    }

    return course;
  }

  static async assertModuleOwnership(userId, moduleId) {
    const moduleItem = await ModuleRepository.findById(moduleId);
    if (!moduleItem) {
      const err = new Error('Module not found');
      err.status = 404;
      throw err;
    }

    await this.assertCourseOwnership(userId, moduleItem.course_id);
    return moduleItem;
  }

  static async assertLessonOwnership(userId, lessonId) {
    const lesson = await LessonRepository.findById(lessonId);
    if (!lesson) {
      const err = new Error('Lesson not found');
      err.status = 404;
      throw err;
    }

    const moduleItem = await ModuleRepository.findById(lesson.module_id);
    if (!moduleItem) {
      const err = new Error('Module not found');
      err.status = 404;
      throw err;
    }

    await this.assertCourseOwnership(userId, moduleItem.course_id);
    return lesson;
  }
}

module.exports = InstructorScopeService;
