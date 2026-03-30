const commentService = require('../services/comment.service');
const ApiResponse = require('../utils/apiResponse');

class CommentController {
  async createComment(req, res, next) {
    try {
      const result = await commentService.createComment(req.user.workspaceId, req.user.id, req.body);
      return ApiResponse.created(res, result, 'Comment added');
    } catch (error) {
      next(error);
    }
  }

  async getComments(req, res, next) {
    try {
      const result = await commentService.getComments(req.params.taskId, req.user.workspaceId);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updateComment(req, res, next) {
    try {
      const result = await commentService.updateComment(req.params.id, req.user.id, req.body.content);
      return ApiResponse.success(res, result, 'Comment updated');
    } catch (error) {
      next(error);
    }
  }

  async deleteComment(req, res, next) {
    try {
      const result = await commentService.deleteComment(req.params.id, req.user.id, req.user.role);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CommentController();
