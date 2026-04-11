const router = require('express').Router();
const UserController = require('../controllers/UserController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const logger = require('../middlewares/logger');
const { userUpdateSchema, userPatchSchema } = require('../utils/validators/userValidator');


// User routes for managing user accounts
router.post('/', authenticate, authorize('admin'), logger, UserController.create);
router.get('/', authenticate, authorize('admin', 'instructor'), logger, UserController.getAll);
router.get('/:id', authenticate, logger, UserController.getById);
router.put('/:id', authenticate, authorize('admin'), validate(userUpdateSchema), logger, UserController.update);
router.patch('/:id', authenticate, validate(userPatchSchema), logger, UserController.patch);
router.delete('/:id', authenticate, authorize('admin'), logger, UserController.remove);

module.exports = router;
