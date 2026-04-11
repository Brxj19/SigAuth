exports.sendSuccess = (res, statusCode = 200, data = null, message = 'Success') =>
  res.status(statusCode).json({ success: true, data, message, errors: null });

exports.sendError = (res, statusCode = 500, message = 'Error', errors = null) =>
  res.status(statusCode).json({ success: false, data: null, message, errors });
