const applicationService = require('../services/application.service');
const ApiResponse = require('../utils/apiResponse');

class ApplicationController {
  async listWorkspaces(req, res, next) {
    try {
      const result = await applicationService.listWorkspaces(req.query);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async createCompany(req, res, next) {
    try {
      const data = { ...req.body };
      if (req.file) {
        data.logoUrl = `/uploads/${req.file.filename}`;
      }
      const result = await applicationService.createCompany(req.user.id, data);
      return ApiResponse.created(res, result, 'Company created');
    } catch (error) {
      next(error);
    }
  }

  async applyToCompany(req, res, next) {
    try {
      const data = { ...req.body };
      if (req.file) {
        data.cvFileUrl = `/uploads/${req.file.filename}`;
        data.cvFileName = req.file.originalname;
        data.cvFileSize = req.file.size;
      }
      const result = await applicationService.applyToCompany(req.user.id, req.params.workspaceId, data);
      return ApiResponse.created(res, result, 'Application submitted');
    } catch (error) {
      next(error);
    }
  }

  async getMyApplications(req, res, next) {
    try {
      const result = await applicationService.getMyApplications(req.user.id);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getWorkspaceApplications(req, res, next) {
    try {
      const result = await applicationService.getWorkspaceApplications(req.user.workspaceId, req.query);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async acceptApplication(req, res, next) {
    try {
      const result = await applicationService.acceptApplication(req.params.applicationId, req.user.workspaceId, req.body.note);
      return ApiResponse.success(res, result, 'Application accepted');
    } catch (error) {
      next(error);
    }
  }

  async rejectApplication(req, res, next) {
    try {
      const result = await applicationService.rejectApplication(req.params.applicationId, req.user.workspaceId, req.body.note);
      return ApiResponse.success(res, result, 'Application rejected');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ApplicationController();
