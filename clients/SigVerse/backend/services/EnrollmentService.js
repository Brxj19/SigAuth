const EnrollmentRepository = require('../repositories/EnrollmentRepository');

class EnrollmentService {
  static getAll() { return EnrollmentRepository.findAll(); }
  static getById(id) { return EnrollmentRepository.findById(id); }
  static getByUserId(userId) { return EnrollmentRepository.findByUserId(userId); }

  static async create(data) {
    const existing = await EnrollmentRepository.findByUserAndCourse(data.user_id, data.course_id);
    if (existing) {
      const err = new Error('User is already enrolled in this course');
      err.status = 409;
      throw err;
    }
    return EnrollmentRepository.create(data);
  }

  static update(id, data) { return EnrollmentRepository.update(id, data); }
  static patch(id, data) { return EnrollmentRepository.patch(id, data); }

  static async remove(id) {
    const enrollment = await EnrollmentRepository.findById(id);
    if (!enrollment) { const err = new Error('Enrollment not found'); err.status = 404; throw err; }
    return EnrollmentRepository.delete(id);
  }
}

module.exports = EnrollmentService;
