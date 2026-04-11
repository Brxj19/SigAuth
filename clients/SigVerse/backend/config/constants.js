module.exports = {
  ROLES: {
    LEARNER: 'learner',
    INSTRUCTOR: 'instructor',
    ADMIN: 'admin'
  },
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CACHE_KEYS: {
    COURSE_LIST: 'course_list',
    MODULE_LIST: 'module_list'
  },
  CACHE_TTL: 300
};
