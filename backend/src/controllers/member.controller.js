const memberService = require('../services/member.service');
const ApiResponse = require('../utils/apiResponse');

class MemberController {
  async getMembers(req, res, next) {
    try {
      const result = await memberService.getMembers(req.user.workspaceId, {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        search: req.query.search || '',
      });
      return ApiResponse.paginated(res, result.members, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async updateRole(req, res, next) {
    try {
      const result = await memberService.updateRole(
        req.params.id, req.body.role, req.user.workspaceId, req.user.role
      );
      return ApiResponse.success(res, result, 'Role updated');
    } catch (error) {
      next(error);
    }
  }

  async removeMember(req, res, next) {
    try {
      const result = await memberService.removeMember(
        req.params.id, req.user.workspaceId, req.user.id
      );
      return ApiResponse.success(res, result, 'Member removed');
    } catch (error) {
      next(error);
    }
  }

  async reactivateMember(req, res, next) {
    try {
      const result = await memberService.reactivateMember(req.params.id, req.user.workspaceId);
      return ApiResponse.success(res, result, 'Member reactivated');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MemberController();
