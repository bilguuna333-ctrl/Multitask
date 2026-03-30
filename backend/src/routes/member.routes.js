const router = require('express').Router();
const memberController = require('../controllers/member.controller');
const { authenticate } = require('../middlewares/auth');
const { requireMinRole } = require('../middlewares/roles');
const { validate } = require('../middlewares/validate');
const { updateRoleValidator } = require('../validators/member.validators');

router.use(authenticate);

router.get('/', memberController.getMembers);
router.put('/:id/role', requireMinRole('ADMIN'), updateRoleValidator, validate, memberController.updateRole);
router.delete('/:id', requireMinRole('ADMIN'), memberController.removeMember);
router.post('/:id/reactivate', requireMinRole('ADMIN'), memberController.reactivateMember);

module.exports = router;
