const router = require('express').Router();
const CourseController = require('../controllers/CourseController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const logger = require('../middlewares/logger');
const { courseCreateSchema, coursePatchSchema } = require('../utils/validators/courseValidator');

router.post('/', authenticate, authorize('instructor', 'admin'), validate(courseCreateSchema), logger, CourseController.create);
router.get('/', authenticate, logger, CourseController.getAll);
router.get('/:id', authenticate, logger, CourseController.getById);
router.put('/:id', authenticate, authorize('instructor', 'admin'), validate(courseCreateSchema), logger, CourseController.update);
router.patch('/:id', authenticate, authorize('instructor', 'admin'), validate(coursePatchSchema), logger, CourseController.patch);
router.delete('/:id', authenticate, authorize('admin', 'instructor'), logger, CourseController.remove);

module.exports = router;
