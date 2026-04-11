const ApprovalService = require('../services/ApprovalService');
const { sendSuccess } = require('../utils/response');

// handel approval requests for instructor signups, course/module/lesson creation, updates, and deletions.
exports.getAll = async (req, res, next) => {
  try {
    const data = await ApprovalService.listForUser(req.user);
    sendSuccess(res, 200, data);
  } catch (err) { next(err); }
};

// approve an approval request
exports.approve = async (req, res, next) => {
  try {
    const data = await ApprovalService.approve(req.params.id, req.user.sub);
    sendSuccess(res, 200, data, 'Request approved');
  } catch (err) { next(err); }
};

// reject an approval request with an optional note
exports.reject = async (req, res, next) => {
  try {
    const data = await ApprovalService.reject(req.params.id, req.user.sub, req.body?.note || '');
    sendSuccess(res, 200, data, 'Request rejected');
  } catch (err) { next(err); }
};
