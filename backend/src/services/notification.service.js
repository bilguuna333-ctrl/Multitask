const prisma = require('../prisma/client');
const AppError = require('../utils/AppError');

class NotificationService {
  async getNotifications(userId, workspaceId, { page = 1, limit = 20, unreadOnly = false }) {
    const skip = (page - 1) * limit;
    const where = {
      userId,
      ...(workspaceId ? { workspaceId } : {}),
      ...(unreadOnly && { isRead: false }),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { ...where, isRead: false } }),
    ]);

    return {
      notifications,
      unreadCount,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUnreadCount(userId, workspaceId) {
    return prisma.notification.count({
      where: {
        userId,
        ...(workspaceId ? { workspaceId } : {}),
        isRead: false,
      },
    });
  }

  async markAsRead(notificationId, userId) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notification) throw new AppError('Notification not found', 404);

    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId, workspaceId) {
    await prisma.notification.updateMany({
      where: { userId, ...(workspaceId ? { workspaceId } : {}), isRead: false },
      data: { isRead: true },
    });
    return { message: 'All notifications marked as read' };
  }

  async deleteNotification(notificationId, userId) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notification) throw new AppError('Notification not found', 404);

    await prisma.notification.delete({ where: { id: notificationId } });
    return { message: 'Notification deleted' };
  }
}

module.exports = new NotificationService();
