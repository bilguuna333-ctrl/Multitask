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
router.get('/my-invitations', invitationController.getMyInvitations);
router.post('/my-invitations/:id/accept', invitationController.acceptInvitationById);
router.post('/my-invitations/:id/reject', invitationController.rejectInvitationById);
router.get('/search-users', requireMinRole('MANAGER'), invitationController.searchUsers);
router.post('/', requireMinRole('MANAGER'), createInvitationValidator, validate, invitationController.createInvitation);
router.get('/', invitationController.getInvitations);
router.delete('/:id', requireMinRole('MANAGER'), invitationController.cancelInvitation);
router.post('/:id/resend', requireMinRole('MANAGER'), invitationController.resendInvitation);

module.exports = router;
