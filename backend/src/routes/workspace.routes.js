const router = require('express').Router();
const workspaceController = require('../controllers/workspace.controller');
const { authenticate } = require('../middlewares/auth');
const { requireMinRole } = require('../middlewares/roles');

router.use(authenticate);

router.get('/', workspaceController.getWorkspace);
router.put('/', requireMinRole('MANAGER'), workspaceController.updateWorkspace);

module.exports = router;
