const UserService = require('../services/UserService');
const { sendSuccess, sendError } = require('../utils/response');


// Creates a new user with admin privileges
exports.create = async (req, res, next) => {
  try {
    const { name, email, role } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ success: false, message: 'name, email, and role are required' });
    }
    const data = await UserService.create({ name, email, role });
    sendSuccess(res, 201, data, 'User created — login credentials emailed to ' + email);
  } catch (err) { next(err); }
};

// Retrieves all users, filtering out self from results
exports.getAll = async (req, res, next) => {
  try {
    const data = await UserService.getAll();
    const filtered = req.user.role === 'admin'
      ? data.filter((item) => item.id !== req.user.sub)
      : data;
    sendSuccess(res, 200, filtered);
  } catch (err) { next(err); }
};

// Fetches a single user record by their ID
exports.getById = async (req, res, next) => {
  try {
    const data = await UserService.getById(req.params.id);
    if (!data) return sendError(res, 404, 'User not found');
    sendSuccess(res, 200, data);
  } catch (err) { next(err); }
};

// Updates user information with full validation
exports.update = async (req, res, next) => {
  try {
    if (req.user.role === 'admin' && Number(req.params.id) === req.user.sub) {
      return sendError(res, 403, 'Admin cannot edit their own account from the admin panel');
    }
    const data = await UserService.update(req.params.id, req.body);
    sendSuccess(res, 200, data, 'User updated');
  } catch (err) { next(err); }
};

// Partially updates user fields with change validation
exports.patch = async (req, res, next) => {
  try {
    if (req.user.role === 'admin' && Number(req.params.id) === req.user.sub) {
      return sendError(res, 403, 'Admin cannot edit their own account from the admin panel');
    }
    const data = await UserService.patch(req.params.id, req.body);
    sendSuccess(res, 200, data, 'User updated');
  } catch (err) { next(err); }
};

// Deletes a user account with role validation
exports.remove = async (req, res, next) => {
  try {
    if (req.user.role === 'admin' && Number(req.params.id) === req.user.sub) {
      return sendError(res, 403, 'Admin cannot delete their own account');
    }
    await UserService.remove(req.params.id);
    sendSuccess(res, 200, null, 'User deleted');
  } catch (err) { next(err); }
};
