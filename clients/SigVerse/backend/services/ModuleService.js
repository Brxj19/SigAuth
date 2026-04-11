const ModuleRepository = require('../repositories/ModuleRepository');
const cache = require('../config/cache');

class ModuleService {
  static async getAll() {
    // Cache the list response so repeated reads avoid an extra repository call.
    const cached = cache.get('module_list');
    if (cached) return cached;
    const modules = await ModuleRepository.findAll();
    cache.set('module_list', modules);
    return modules;
  }

  // Detail lookups include related lessons for views that render the full module contents.
  static getById(id) { return ModuleRepository.findByIdWithLessons(id); }
  static getByCourseId(courseId) { return ModuleRepository.findByCourseId(courseId); }

  // Any write can make the cached module list stale, so all mutations clear it.
  static async create(data) {
    const mod = await ModuleRepository.create(data);
    cache.del('module_list');
    return mod;
  }

  static async update(id, data) {
    const mod = await ModuleRepository.update(id, data);
    cache.del('module_list');
    return mod;
  }

  static async patch(id, data) {
    const mod = await ModuleRepository.patch(id, data);
    cache.del('module_list');
    return mod;
  }

  static async remove(id) {
    const mod = await ModuleRepository.findById(id);
    // Surface a consistent 404 instead of treating a missing module as a successful delete.
    if (!mod) { const err = new Error('Module not found'); err.status = 404; throw err; }
    await ModuleRepository.delete(id);
    cache.del('module_list');
    return true;
  }
}

module.exports = ModuleService;
