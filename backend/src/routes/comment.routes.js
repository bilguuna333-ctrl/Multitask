const router = require('express').Router();
const commentController = require('../controllers/comment.controller');
const { authenticate } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { createCommentValidator, updateCommentValidator } = require('../validators/comment.validators');

router.use(authenticate);

router.post('/', createCommentValidator, validate, commentController.createComment);
router.get('/task/:taskId', commentController.getComments);
router.put('/:id', updateCommentValidator, validate, commentController.updateComment);
router.delete('/:id', commentController.deleteComment);

module.exports = router;
