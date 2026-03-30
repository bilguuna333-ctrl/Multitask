const invitationService = require('../services/invitation.service');
const ApiResponse = require('../utils/apiResponse');

class InvitationController {
  async createInvitation(req, res, next) {
    try {
      const result = await invitationService.createInvitation(
        req.user.workspaceId, req.user.id, req.body
      );
      return ApiResponse.created(res, result, 'Invitation sent');
    } catch (error) {
      next(error);
    }
  }

  async getInvitations(req, res, next) {
    try {
      const result = await invitationService.getInvitations(req.user.workspaceId, {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        status: req.query.status,
      });
      return ApiResponse.paginated(res, result.invitations, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async acceptInvitation(req, res, next) {
    try {
      const result = await invitationService.acceptInvitation(req.body);
      return ApiResponse.success(res, result, 'Invitation accepted');
    } catch (error) {
      next(error);
    }
  }

  async cancelInvitation(req, res, next) {
    try {
      const result = await invitationService.cancelInvitation(req.params.id, req.user.workspaceId);
      return ApiResponse.success(res, result, 'Invitation cancelled');
    } catch (error) {
      next(error);
    }
  }

  async resendInvitation(req, res, next) {
    try {
      const result = await invitationService.resendInvitation(req.params.id, req.user.workspaceId);
      return ApiResponse.success(res, result, 'Invitation resent');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new InvitationController();
