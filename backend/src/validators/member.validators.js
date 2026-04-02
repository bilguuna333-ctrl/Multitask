const { body, param } = require('express-validator');

const updateRoleValidator = [
  param('id').isUUID().withMessage('Invalid member ID'),
  body('role').isIn(['MANAGER', 'MEMBER']).withMessage('Role must be MANAGER or MEMBER'),
];

module.exports = { updateRoleValidator };
