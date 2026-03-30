const router = require('express').Router();
const invitationController = require('../controllers/invitation.controller');
const { authenticate } = require('../middlewares/auth');
const { requireMinRole } = require('../middlewares/roles');
const { validate } = require('../middlewares/validate');
const { createInvitationValidator, acceptInvitationValidator } = require('../validators/invitation.validators');

// Public route - accept invitation
router.post('/accept', acceptInvitationValidator, validate, invitationController.acceptInvitation);

// Protected routes
router.use(authenticate);
router.post('/', requireMinRole('ADMIN'), createInvitationValidator, validate, invitationController.createInvitation);
router.get('/', invitationController.getInvitations);
router.delete('/:id', requireMinRole('ADMIN'), invitationController.cancelInvitation);
router.post('/:id/resend', requireMinRole('ADMIN'), invitationController.resendInvitation);

module.exports = router;
