const router = require('express').Router();
const CourseFeedbackController = require('../controllers/CourseFeedbackController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const logger = require('../middlewares/logger');
const { courseFeedbackUpsertSchema } = require('../utils/validators/courseFeedbackValidator');

router.post('/', authenticate, authorize('learner'), validate(courseFeedbackUpsertSchema), logger, CourseFeedbackController.upsert);
router.get('/mine/:courseId', authenticate, authorize('learner'), logger, CourseFeedbackController.getMyCourseFeedback);
router.get('/instructor', authenticate, authorize('instructor'), logger, CourseFeedbackController.getInstructorFeedback);
router.get('/course/:courseId', authenticate, logger, CourseFeedbackController.getCourseFeedback);
router.post('/:feedbackId/reply', authenticate, authorize('instructor'), logger, CourseFeedbackController.replyToFeedback);

module.exports = router;
