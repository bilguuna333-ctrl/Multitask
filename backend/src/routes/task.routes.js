const router = require('express').Router();
const taskController = require('../controllers/task.controller');
const { authenticate } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { createTaskValidator, updateTaskValidator, reorderTasksValidator } = require('../validators/task.validators');

const { requireMinRole } = require('../middlewares/roles');

router.use(authenticate);

router.post('/', requireMinRole('MANAGER'), createTaskValidator, validate, taskController.createTask);
router.get('/', taskController.getTasks);
router.post('/reorder', requireMinRole('MANAGER'), reorderTasksValidator, validate, taskController.reorderTasks);
router.get('/:id', taskController.getTask);
router.put('/:id', requireMinRole('MANAGER'), updateTaskValidator, validate, taskController.updateTask);
router.post('/:id/archive', requireMinRole('MANAGER'), taskController.archiveTask);
router.delete('/:id', requireMinRole('MANAGER'), taskController.deleteTask);

module.exports = router;
