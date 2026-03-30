const { body, param } = require('express-validator');

const createTaskValidator = [
  body('title').trim().notEmpty().withMessage('Task title is required').isLength({ min: 1, max: 500 }),
  body('description').optional().isString(),
  body('projectId').isUUID().withMessage('Valid project ID is required'),
  body('assigneeId').optional({ nullable: true }).isUUID().withMessage('Valid assignee ID required'),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority'),
  body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).withMessage('Invalid status'),
  body('dueDate').optional({ nullable: true }).isISO8601().withMessage('Invalid date format'),
  body('tags').optional().isString(),
];

const updateTaskValidator = [
  param('id').isUUID().withMessage('Invalid task ID'),
  body('title').optional().trim().isLength({ min: 1, max: 500 }),
  body('description').optional().isString(),
  body('assigneeId').optional({ nullable: true }),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']),
  body('dueDate').optional({ nullable: true }),
  body('tags').optional().isString(),
  body('position').optional().isInt(),
];

const reorderTasksValidator = [
  body('tasks').isArray().withMessage('Tasks array is required'),
  body('tasks.*.id').isUUID(),
  body('tasks.*.status').isIn(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']),
  body('tasks.*.position').isInt(),
];

module.exports = { createTaskValidator, updateTaskValidator, reorderTasksValidator };
