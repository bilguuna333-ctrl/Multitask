const { body, param } = require('express-validator');

const createCommentValidator = [
  body('content').trim().notEmpty().withMessage('Comment content is required'),
  body('taskId').isUUID().withMessage('Valid task ID is required'),
];

const updateCommentValidator = [
  param('id').isUUID().withMessage('Invalid comment ID'),
  body('content').trim().notEmpty().withMessage('Comment content is required'),
];

module.exports = { createCommentValidator, updateCommentValidator };
