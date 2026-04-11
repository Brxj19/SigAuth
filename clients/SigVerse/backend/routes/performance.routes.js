const router = require('express').Router();
const PerformanceController = require('../controllers/PerformanceController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const logger = require('../middlewares/logger');
const { performanceCreateSchema, performancePatchSchema } = require('../utils/validators/performanceValidator');

router.post('/', authenticate, authorize('instructor', 'admin'), validate(performanceCreateSchema), logger, PerformanceController.create);
router.get('/', authenticate, logger, PerformanceController.getAll);
router.get('/:id', authenticate, logger, PerformanceController.getById);
router.put('/:id', authenticate, authorize('instructor', 'admin'), validate(performanceCreateSchema), logger, PerformanceController.update);
router.patch('/:id', authenticate, authorize('instructor', 'admin'), validate(performancePatchSchema), logger, PerformanceController.patch);
router.delete('/:id', authenticate, authorize('admin'), logger, PerformanceController.remove);

module.exports = router;
