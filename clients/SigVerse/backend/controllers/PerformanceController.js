const PerformanceService = require('../services/PerformanceService');
const { sendSuccess, sendError } = require('../utils/response');

exports.create = async (req, res, next) => {
  try {
    const data = await PerformanceService.create(req.body);
    sendSuccess(res, 201, data, 'Performance recorded');
  } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
  try {
    const data = req.user.role === 'learner'
      ? await PerformanceService.getByUserId(req.user.sub)
      : await PerformanceService.getAll();
    sendSuccess(res, 200, data);
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const data = await PerformanceService.getById(req.params.id);
    if (!data) return sendError(res, 404, 'Performance record not found');
    sendSuccess(res, 200, data);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const data = await PerformanceService.update(req.params.id, req.body);
    sendSuccess(res, 200, data, 'Performance updated');
  } catch (err) { next(err); }
};

exports.patch = async (req, res, next) => {
  try {
    const data = await PerformanceService.patch(req.params.id, req.body);
    sendSuccess(res, 200, data, 'Performance updated');
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await PerformanceService.remove(req.params.id);
    sendSuccess(res, 200, null, 'Performance deleted');
  } catch (err) { next(err); }
};
