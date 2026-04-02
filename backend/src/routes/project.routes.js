const router = require('express').Router();
const projectController = require('../controllers/project.controller');
const { authenticate } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { createProjectValidator, updateProjectValidator } = require('../validators/project.validators');

const { requireMinRole } = require('../middlewares/roles');

router.use(authenticate);

router.post('/', requireMinRole('MANAGER'), createProjectValidator, validate, projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProject);
router.put('/:id', requireMinRole('MANAGER'), updateProjectValidator, validate, projectController.updateProject);
router.post('/:id/archive', requireMinRole('MANAGER'), projectController.archiveProject);
router.delete('/:id', requireMinRole('MANAGER'), projectController.deleteProject);
router.post('/:id/members', requireMinRole('MANAGER'), projectController.addProjectMember);
router.delete('/:id/members/:userId', requireMinRole('MANAGER'), projectController.removeProjectMember);

module.exports = router;
