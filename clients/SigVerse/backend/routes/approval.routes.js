const router = require('express').Router();
const ApprovalController = require('../controllers/ApprovalController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const logger = require('../middlewares/logger');

// Approval routes for managing approval requests
router.get('/', authenticate, logger, ApprovalController.getAll);
router.post('/:id/approve', authenticate, authorize('admin'), logger, ApprovalController.approve);
router.post('/:id/reject', authenticate, authorize('admin'), logger, ApprovalController.reject);

module.exports = router;
