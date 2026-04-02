const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const {
  registerValidator,
  loginValidator,
  googleLoginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  refreshTokenValidator,
} = require('../validators/auth.validators');

router.post('/register', registerValidator, validate, authController.register);
router.post('/google', googleLoginValidator, validate, authController.googleLogin);
router.post('/login', loginValidator, validate, authController.login);
router.post('/refresh-token', refreshTokenValidator, validate, authController.refreshToken);
router.post('/forgot-password', forgotPasswordValidator, validate, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidator, validate, authController.resetPassword);

router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.post('/change-password', authenticate, authController.changePassword);
router.post('/switch-workspace', authenticate, authController.switchWorkspace);

module.exports = router;
