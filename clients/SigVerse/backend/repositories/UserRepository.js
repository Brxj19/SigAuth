const User = require('../models/mysql/User');

// UserRepository provides an abstraction layer for user data access and manipulation using the User model for MySQL database operations. 
class UserRepository {
  static findAll() { return User.findAll(); }
  static findById(id) { return User.findById(id); }
  static findByGithubId(github_id) { return User.findByGithubId(github_id); }
  static findByEmail(email) { return User.findByEmail(email); }
  static create(data) { return User.create(data); }
  static update(id, data) { return User.update(id, data); }
  static patch(id, data) { return User.patch(id, data); }
  static delete(id) { return User.delete(id); }
}

module.exports = UserRepository;
