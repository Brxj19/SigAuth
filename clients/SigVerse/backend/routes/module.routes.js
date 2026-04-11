const router = require('express').Router();
const ModuleController = require('../controllers/ModuleController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const logger = require('../middlewares/logger');
const { moduleCreateSchema, modulePatchSchema } = require('../utils/validators/moduleValidator');

router.post('/', authenticate, authorize('instructor', 'admin'), validate(moduleCreateSchema), logger, ModuleController.create);
router.get('/', authenticate, logger, ModuleController.getAll);
router.get('/:id', authenticate, logger, ModuleController.getById);
router.put('/:id', authenticate, authorize('instructor', 'admin'), validate(moduleCreateSchema), logger, ModuleController.update);
router.patch('/:id', authenticate, authorize('instructor', 'admin'), validate(modulePatchSchema), logger, ModuleController.patch);
router.delete('/:id', authenticate, authorize('admin', 'instructor'), logger, ModuleController.remove);

module.exports = router;
