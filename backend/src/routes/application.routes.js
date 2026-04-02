const router = require('express').Router();
const applicationController = require('../controllers/application.controller');
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/roles');
const upload = require('../middlewares/upload');

function maybeUploadCv(req, res, next) {
  if (req.is('multipart/form-data')) {
    return upload.single('cvFile')(req, res, next);
  }
  return next();
}

// Public-ish: list workspaces (authenticated but no workspace needed)
router.get('/workspaces', authenticate, applicationController.listWorkspaces);

// Create a new company
router.post('/create-company', authenticate, upload.single('logo'), applicationController.createCompany);

// Apply to a company (with optional CV upload)
router.post(
  '/apply/:workspaceId',
  authenticate,
  maybeUploadCv,
  applicationController.applyToCompany
);

// My applications
router.get('/my-applications', authenticate, applicationController.getMyApplications);

// Workspace admin: get applications for their workspace
router.get(
  '/workspace-applications',
  authenticate,
  requireRole('OWNER', 'MANAGER'),
  applicationController.getWorkspaceApplications
);

// Accept/reject
router.post(
  '/:applicationId/accept',
  authenticate,
  requireRole('OWNER', 'MANAGER'),
  applicationController.acceptApplication
);
router.post(
  '/:applicationId/reject',
  authenticate,
  requireRole('OWNER', 'MANAGER'),
  applicationController.rejectApplication
);

module.exports = router;
