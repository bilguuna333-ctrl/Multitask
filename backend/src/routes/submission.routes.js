const router = require('express').Router();
const submissionController = require('../controllers/submission.controller');
const { authenticate } = require('../middlewares/auth');
const { requireMinRole } = require('../middlewares/roles');
const { body, param } = require('express-validator');
const { validate } = require('../middlewares/validate');
const upload = require('../middlewares/upload');

router.use(authenticate);

// Get review queue (managers+)
router.get(
  '/review-queue',
  requireMinRole('MANAGER'),
  submissionController.getReviewQueue
);

// Get submissions for a task
router.get(
  '/task/:taskId',
  [param('taskId').isUUID()],
  validate,
  submissionController.getSubmissions
);

// Create submission with optional file upload
router.post(
  '/task/:taskId',
  upload.single('file'),
  submissionController.createSubmission
);

// Approve task (manager+)
router.post(
  '/task/:taskId/approve',
  requireMinRole('MANAGER'),
  [
    param('taskId').isUUID(),
    body('note').optional().isString(),
  ],
  validate,
  submissionController.approveTask
);

// Cancel/reject task (manager+)
router.post(
  '/task/:taskId/cancel',
  requireMinRole('MANAGER'),
  [
    param('taskId').isUUID(),
    body('note').optional().isString(),
  ],
  validate,
  submissionController.cancelTask
);

module.exports = router;
