const CourseService = require('../services/CourseService');
const ApprovalService = require('../services/ApprovalService');
const InstructorScopeService = require('../services/InstructorScopeService');
const { sendSuccess, sendError } = require('../utils/response');

exports.create = async (req, res, next) => {
  try {
    // Instructors submit an approval request; admins can create directly.
    if (req.user.role === 'instructor') {
      const data = await ApprovalService.createRequest({
        requester_id: req.user.sub,
        request_type: 'course',
        action: 'create',
        payload: { ...req.body, instructor_id: req.user.sub }
      });
      return sendSuccess(res, 202, data, 'Course creation request submitted for admin approval');
    }

    const data = await CourseService.create(req.body);
    sendSuccess(res, 201, data, 'Course created');
  } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
  try {
    const data = await CourseService.getAll();
    sendSuccess(res, 200, data);
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const data = await CourseService.getById(req.params.id);
    // Return a clear 404 instead of an empty success payload.
    if (!data) return sendError(res, 404, 'Course not found');
    sendSuccess(res, 200, data);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    // Instructors can only request updates for courses they own.
    if (req.user.role === 'instructor') {
      await InstructorScopeService.assertCourseOwnership(req.user.sub, Number(req.params.id));
      const data = await ApprovalService.createRequest({
        requester_id: req.user.sub,
        request_type: 'course',
        action: 'update',
        entity_id: Number(req.params.id),
        payload: { ...req.body, instructor_id: req.user.sub }
      });
      return sendSuccess(res, 202, data, 'Course update request submitted for admin approval');
    }

    const data = await CourseService.update(req.params.id, req.body);
    sendSuccess(res, 200, data, 'Course updated');
  } catch (err) { next(err); }
};

exports.patch = async (req, res, next) => {
  try {
    // PATCH follows the same approval path for instructor-made changes.
    if (req.user.role === 'instructor') {
      await InstructorScopeService.assertCourseOwnership(req.user.sub, Number(req.params.id));
      const data = await ApprovalService.createRequest({
        requester_id: req.user.sub,
        request_type: 'course',
        action: 'update',
        entity_id: Number(req.params.id),
        payload: req.body
      });
      return sendSuccess(res, 202, data, 'Course update request submitted for admin approval');
    }

    const data = await CourseService.patch(req.params.id, req.body);
    sendSuccess(res, 200, data, 'Course updated');
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    // Instructors cannot hard-delete directly; deletion also goes through approval.
    if (req.user.role === 'instructor') {
      await InstructorScopeService.assertCourseOwnership(req.user.sub, Number(req.params.id));
      const data = await ApprovalService.createRequest({
        requester_id: req.user.sub,
        request_type: 'course',
        action: 'delete',
        entity_id: Number(req.params.id),
        payload: {}
      });
      return sendSuccess(res, 202, data, 'Course deletion request submitted for admin approval');
    }

    await CourseService.remove(req.params.id);
    sendSuccess(res, 200, null, 'Course deleted');
  } catch (err) { next(err); }
};
