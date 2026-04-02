const projectService = require('../services/project.service');
const ApiResponse = require('../utils/apiResponse');

class ProjectController {
  async createProject(req, res, next) {
    try {
      const result = await projectService.createProject(req.user.workspaceId, req.user.id, req.body);
      return ApiResponse.created(res, result, 'Project created');
    } catch (error) {
      next(error);
    }
  }

  async getProjects(req, res, next) {
    try {
      const result = await projectService.getProjects(req.user.workspaceId, {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        search: req.query.search || '',
        status: req.query.status || '',
        isArchived: req.query.isArchived || false,
      });
      return ApiResponse.paginated(res, result.projects, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async getProject(req, res, next) {
    try {
      const result = await projectService.getProject(req.params.id, req.user.workspaceId);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updateProject(req, res, next) {
    try {
      const result = await projectService.updateProject(
        req.params.id, req.user.workspaceId, req.user.id, req.body
      );
      return ApiResponse.success(res, result, 'Project updated');
    } catch (error) {
      next(error);
    }
  }

  async archiveProject(req, res, next) {
    try {
      const result = await projectService.archiveProject(req.params.id, req.user.workspaceId, req.user.id);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async deleteProject(req, res, next) {
    try {
      const result = await projectService.deleteProject(req.params.id, req.user.workspaceId, req.user.id);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async addProjectMember(req, res, next) {
    try {
      const result = await projectService.addProjectMember(
        req.params.id, req.user.workspaceId, req.body.userId, req.user.id
      );
      return ApiResponse.created(res, result, 'Member added to project');
    } catch (error) {
      next(error);
    }
  }

  async removeProjectMember(req, res, next) {
    try {
      const result = await projectService.removeProjectMember(
        req.params.id, req.user.workspaceId, req.params.userId, req.user.id
      );
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProjectController();
