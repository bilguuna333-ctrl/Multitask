const router = require('express').Router();
const taskController = require('../controllers/task.controller');
const { authenticate } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { createTaskValidator, updateTaskValidator, reorderTasksValidator } = require('../validators/task.validators');

router.use(authenticate);

router.post('/', createTaskValidator, validate, taskController.createTask);
router.get('/', taskController.getTasks);
router.post('/reorder', reorderTasksValidator, validate, taskController.reorderTasks);
router.get('/:id', taskController.getTask);
router.put('/:id', updateTaskValidator, validate, taskController.updateTask);
router.post('/:id/archive', taskController.archiveTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
