const router = require('express').Router();
const LessonController = require('../controllers/LessonController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const logger = require('../middlewares/logger');
const { lessonCreateSchema, lessonPatchSchema } = require('../utils/validators/lessonValidator');

router.post('/', authenticate, authorize('instructor', 'admin'), validate(lessonCreateSchema), logger, LessonController.create);
router.get('/', authenticate, logger, LessonController.getAll);
router.get('/:id', authenticate, logger, LessonController.getById);
router.put('/:id', authenticate, authorize('instructor', 'admin'), validate(lessonCreateSchema), logger, LessonController.update);
router.patch('/:id', authenticate, authorize('instructor', 'admin'), validate(lessonPatchSchema), logger, LessonController.patch);
router.delete('/:id', authenticate, authorize('admin', 'instructor'), logger, LessonController.remove);

module.exports = router;
