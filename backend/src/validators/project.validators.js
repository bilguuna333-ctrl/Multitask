const { body, param, query } = require('express-validator');

const createProjectValidator = [
  body('name').trim().notEmpty().withMessage('Project name is required').isLength({ min: 1, max: 200 }),
  body('description').optional().isString(),
  body('memberIds').optional().isArray(),
];

const updateProjectValidator = [
  param('id').isUUID().withMessage('Invalid project ID'),
  body('name').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().isString(),
  body('status').optional().isIn(['ACTIVE', 'ON_HOLD', 'COMPLETED']).withMessage('Invalid status'),
];

module.exports = { createProjectValidator, updateProjectValidator };
