const dashboardService = require('../services/dashboard.service');
const ApiResponse = require('../utils/apiResponse');

class DashboardController {
  async getDashboard(req, res, next) {
    try {
      const result = await dashboardService.getDashboard(req.user.workspaceId);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();
