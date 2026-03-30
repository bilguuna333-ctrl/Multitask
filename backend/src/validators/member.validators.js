const { body, param } = require('express-validator');

const updateRoleValidator = [
  param('id').isUUID().withMessage('Invalid member ID'),
  body('role').isIn(['ADMIN', 'MEMBER']).withMessage('Role must be ADMIN or MEMBER'),
];

module.exports = { updateRoleValidator };
