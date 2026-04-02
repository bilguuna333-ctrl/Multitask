const notificationService = require('../services/notification.service');
const ApiResponse = require('../utils/apiResponse');

class NotificationController {
  async getNotifications(req, res, next) {
    try {
      const result = await notificationService.getNotifications(req.user.id, req.user.workspaceId || null, {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        unreadOnly: req.query.unreadOnly === 'true',
      });
      return res.status(200).json({
        success: true,
        message: 'Success',
        data: result.notifications,
        pagination: result.pagination,
        unreadCount: result.unreadCount,
      });
    } catch (err) {
      next(err);
    }
  }

  async getUnreadCount(req, res, next) {
    try {
      const count = await notificationService.getUnreadCount(req.user.id, req.user.workspaceId || null);
      return ApiResponse.success(res, { count }, 'Success');
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const result = await notificationService.markAsRead(req.params.id, req.user.id);
      return ApiResponse.success(res, result, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      const result = await notificationService.markAllAsRead(req.user.id, req.user.workspaceId);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  async deleteNotification(req, res, next) {
    try {
      const result = await notificationService.deleteNotification(req.params.id, req.user.id);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();
