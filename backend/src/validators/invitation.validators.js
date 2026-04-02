const { body, param } = require('express-validator');

const createInvitationValidator = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('role').optional().isIn(['MANAGER', 'MEMBER']).withMessage('Role must be MANAGER or MEMBER'),
];

const acceptInvitationValidator = [
  body('token').notEmpty().withMessage('Invitation token is required'),
  body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
  body('password').optional().isLength({ min: 8 }),
];

module.exports = { createInvitationValidator, acceptInvitationValidator };
