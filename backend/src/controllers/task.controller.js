const taskService = require('../services/task.service');
const ApiResponse = require('../utils/apiResponse');

class TaskController {
  async createTask(req, res, next) {
    try {
      const result = await taskService.createTask(req.user.workspaceId, req.user.id, req.body);
      return ApiResponse.created(res, result, 'Task created');
    } catch (error) {
      next(error);
    }
  }

  async getTasks(req, res, next) {
    try {
      const result = await taskService.getTasks(req.user.workspaceId, {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50,
        projectId: req.query.projectId,
        status: req.query.status,
        priority: req.query.priority,
        assigneeId: req.query.assigneeId,
        search: req.query.search,
        dueDate: req.query.dueDate,
        isArchived: req.query.isArchived || false,
      });
      return ApiResponse.paginated(res, result.tasks, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getTask(req, res, next) {
    try {
      const result = await taskService.getTask(req.params.id, req.user.workspaceId);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updateTask(req, res, next) {
    try {
      const result = await taskService.updateTask(
        req.params.id, req.user.workspaceId, req.user.id, req.body
      );
      return ApiResponse.success(res, result, 'Task updated');
    } catch (error) {
      next(error);
    }
  }

  async reorderTasks(req, res, next) {
    try {
      const result = await taskService.reorderTasks(req.user.workspaceId, req.user.id, req.body.tasks);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async deleteTask(req, res, next) {
    try {
      const result = await taskService.deleteTask(req.params.id, req.user.workspaceId, req.user.id);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async archiveTask(req, res, next) {
    try {
      const result = await taskService.archiveTask(req.params.id, req.user.workspaceId, req.user.id);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TaskController();
