const PerformanceRepository = require('../repositories/PerformanceRepository');

class PerformanceService {
  static getAll() { return PerformanceRepository.findAll(); }
  static getById(id) { return PerformanceRepository.findById(id); }
  static getByUserId(userId) { return PerformanceRepository.findByUserId(userId); }
  static getByUserAndCourse(userId, courseId) { return PerformanceRepository.findByUserAndCourse(userId, courseId); }

  static create(data) { return PerformanceRepository.create(data); }
  static upsertByUserAndCourse(data) { return PerformanceRepository.upsertByUserAndCourse(data); }
  static update(id, data) { return PerformanceRepository.update(id, data); }
  static patch(id, data) { return PerformanceRepository.patch(id, data); }

  static async remove(id) {
    const perf = await PerformanceRepository.findById(id);
    if (!perf) { const err = new Error('Performance record not found'); err.status = 404; throw err; }
    return PerformanceRepository.delete(id);
  }
}

module.exports = PerformanceService;
