const workspaceService = require('../services/workspace.service');
const ApiResponse = require('../utils/apiResponse');

class WorkspaceController {
  async getWorkspace(req, res, next) {
    try {
      const result = await workspaceService.getWorkspace(req.user.workspaceId);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updateWorkspace(req, res, next) {
    try {
      const result = await workspaceService.updateWorkspace(req.user.workspaceId, req.body);
      return ApiResponse.success(res, result, 'Workspace updated');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WorkspaceController();
