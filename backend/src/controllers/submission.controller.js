const submissionService = require('../services/submission.service');
const ApiResponse = require('../utils/apiResponse');

class SubmissionController {
  async createSubmission(req, res, next) {
    try {
      const data = { ...req.body };
      // If a file was uploaded via multer
      if (req.file) {
        data.fileUrl = `/uploads/${req.file.filename}`;
        data.fileName = req.file.originalname;
        data.fileSize = req.file.size;
      }
      const result = await submissionService.createSubmission(
        req.params.taskId, req.user.workspaceId, req.user.id, data
      );
      return ApiResponse.created(res, result, 'Submission created');
    } catch (error) {
      next(error);
    }
  }

  async getSubmissions(req, res, next) {
    try {
      const result = await submissionService.getSubmissions(
        req.params.taskId, req.user.workspaceId
      );
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async approveTask(req, res, next) {
    try {
      const result = await submissionService.approveTask(
        req.params.taskId, req.user.workspaceId, req.user.id, req.body.note
      );
      return ApiResponse.success(res, result, 'Task approved');
    } catch (error) {
      next(error);
    }
  }

  async cancelTask(req, res, next) {
    try {
      const result = await submissionService.cancelTask(
        req.params.taskId, req.user.workspaceId, req.user.id, req.body.note
      );
      return ApiResponse.success(res, result, 'Task returned for revision');
    } catch (error) {
      next(error);
    }
  }

  async getReviewQueue(req, res, next) {
    try {
      const result = await submissionService.getReviewQueue(req.user.workspaceId, {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50,
      });
      return ApiResponse.paginated(res, result.tasks, result.pagination);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SubmissionController();
