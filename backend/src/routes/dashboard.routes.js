const router = require('express').Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', dashboardController.getDashboard);

module.exports = router;
