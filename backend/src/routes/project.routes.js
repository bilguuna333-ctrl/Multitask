const router = require('express').Router();
const projectController = require('../controllers/project.controller');
const { authenticate } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { createProjectValidator, updateProjectValidator } = require('../validators/project.validators');

router.use(authenticate);

router.post('/', createProjectValidator, validate, projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProject);
router.put('/:id', updateProjectValidator, validate, projectController.updateProject);
router.post('/:id/archive', projectController.archiveProject);
router.delete('/:id', projectController.deleteProject);
router.post('/:id/members', projectController.addProjectMember);
router.delete('/:id/members/:userId', projectController.removeProjectMember);

module.exports = router;
