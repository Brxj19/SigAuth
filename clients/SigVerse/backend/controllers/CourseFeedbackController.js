const CourseFeedbackService = require('../services/CourseFeedbackService');
const { sendSuccess } = require('../utils/response');

exports.upsert = async (req, res, next) => {
  try {
    const data = await CourseFeedbackService.upsertForLearner(req.user.sub, req.body);
    sendSuccess(res, 200, data, 'Feedback saved');
  } catch (err) { next(err); }
};

exports.getMyCourseFeedback = async (req, res, next) => {
  try {
    const data = await CourseFeedbackService.getLearnerCourseFeedback(req.user.sub, Number(req.params.courseId));
    sendSuccess(res, 200, data);
  } catch (err) { next(err); }
};

exports.getInstructorFeedback = async (req, res, next) => {
  try {
    const data = await CourseFeedbackService.getInstructorFeedback(req.user.sub, req.query.course_id);
    sendSuccess(res, 200, data);
  } catch (err) { next(err); }
};

exports.getCourseFeedback = async (req, res, next) => {
  try {
    const data = await CourseFeedbackService.getCourseFeedback(Number(req.params.courseId));
    sendSuccess(res, 200, data);
  } catch (err) { next(err); }
};

exports.replyToFeedback = async (req, res, next) => {
  try {
    const { reply } = req.body;
    if (!reply || !reply.trim()) {
      return res.status(400).json({ success: false, message: 'Reply text is required' });
    }
    const data = await CourseFeedbackService.addInstructorReply(req.user.sub, Number(req.params.feedbackId), reply.trim());
    sendSuccess(res, 200, data, 'Reply posted');
  } catch (err) { next(err); }
};
