const UserRepository = require('../repositories/UserRepository');
const LocalCredential = require('../models/mongo/LocalCredential');
const ActivityLog = require('../models/mongo/ActivityLog');
const AuthLog = require('../models/mongo/AuthLog');
const LearningEvent = require('../models/mongo/LearningEvent');
const EmailOtp = require('../models/mongo/EmailOtp');
const ApprovalRequest = require('../models/mongo/ApprovalRequest');
const EmailService = require('./EmailService');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// UserService provides business logic for user-related operations, acting as an intermediary between the UserRepository (data access layer) and the controllers (presentation layer). 
// It includes methods for retrieving all users, getting a user by ID, creating a new user, updating an existing user, partially updating a user, and deleting a user. The delete method also handles cleanup of related data in MongoDB before removing the user from MySQL.
class UserService {
  static getAll() { return UserRepository.findAll(); }
  static getById(id) { return UserRepository.findById(id); }

  static async create(data) {
    const { name, email, role } = data;
    const normalizedEmail = email.trim().toLowerCase();

    // Check for duplicate email in both MySQL and MongoDB
    const existingUser = await UserRepository.findByEmail(normalizedEmail);
    const existingCredential = await LocalCredential.findOne({ email: normalizedEmail });
    if (existingUser || existingCredential) {
      const err = new Error('An account with this email already exists');
      err.status = 409;
      throw err;
    }

    // Create user in MySQL
    const user = await UserRepository.create({ name, email: normalizedEmail, role });

    // Generate a secure temporary password and hash it
    const tempPassword = crypto.randomBytes(9).toString('base64url').slice(0, 12);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Create LocalCredential in MongoDB
    await LocalCredential.create({
      user_id: user.id,
      name,
      email: normalizedEmail,
      password_hash: passwordHash,
      status: 'active',
      requested_role: role
    });

    // Send welcome email with temp password (non-blocking — don't fail user creation if email fails)
    EmailService.sendWelcomeEmail(normalizedEmail, { name, role, tempPassword }).catch((err) => {
      console.error(`[UserService] Failed to send welcome email to ${normalizedEmail}:`, err.message);
    });

    return user;
  }

  static update(id, data) { return UserRepository.update(id, data); }
  static patch(id, data) { return UserRepository.patch(id, data); }
  static async remove(id) {
    const user = await UserRepository.findById(id);
    if (!user) { const err = new Error('User not found'); err.status = 404; throw err; }

    // Clean up MongoDB data first
    await Promise.all([
      LocalCredential.deleteMany({ user_id: id }),
      ActivityLog.deleteMany({ user_id: id }),
      AuthLog.deleteMany({ user_id: id }),
      LearningEvent.deleteMany({ user_id: id }),
      EmailOtp.deleteMany({ user_id: id }),
      ApprovalRequest.deleteMany({ user_id: id })
    ]);

    // Then delete from MySQL (this will cascade delete related MySQL records)
    return UserRepository.delete(id);
  }
}

module.exports = UserService;
