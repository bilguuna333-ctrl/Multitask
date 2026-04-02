const { body } = require('express-validator');

const registerValidator = [
  body('firstName').trim().notEmpty().withMessage('First name is required').isLength({ min: 1, max: 50 }),
  body('lastName').trim().notEmpty().withMessage('Last name is required').isLength({ min: 1, max: 50 }),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

const loginValidator = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const googleLoginValidator = [
  body('credential').notEmpty().withMessage('Google credential is required'),
];

const forgotPasswordValidator = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
];

const resetPasswordValidator = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

const refreshTokenValidator = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
];

module.exports = {
  registerValidator,
  loginValidator,
  googleLoginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  refreshTokenValidator,
};
