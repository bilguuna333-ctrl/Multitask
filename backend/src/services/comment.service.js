const prisma = require('../prisma/client');
const AppError = require('../utils/AppError');

class CommentService {
  async createComment(workspaceId, userId, { taskId, content }) {
    const task = await prisma.task.findFirst({ where: { id: taskId, workspaceId } });
    if (!task) throw new AppError('Task not found', 404);

    const comment = await prisma.taskComment.create({
      data: { content, taskId, userId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'COMMENT_ADDED',
        entityType: 'TASK',
        entityId: taskId,
        details: JSON.stringify({ commentId: comment.id }),
        workspaceId,
        userId,
      },
    });

    if (task.assigneeId && task.assigneeId !== userId) {
      await prisma.notification.create({
        data: {
          type: 'COMMENT_ADDED',
          title: 'New Comment',
          message: `New comment on "${task.title}"`,
          link: `/projects/${task.projectId}/tasks/${task.id}`,
          workspaceId,
          userId: task.assigneeId,
        },
      });
    }

    if (task.creatorId !== userId && task.creatorId !== task.assigneeId) {
      await prisma.notification.create({
        data: {
          type: 'COMMENT_ADDED',
          title: 'New Comment',
          message: `New comment on "${task.title}"`,
          link: `/projects/${task.projectId}/tasks/${task.id}`,
          workspaceId,
          userId: task.creatorId,
        },
      });
    }

    return comment;
  }

  async getComments(taskId, workspaceId) {
    const task = await prisma.task.findFirst({ where: { id: taskId, workspaceId } });
    if (!task) throw new AppError('Task not found', 404);

    return prisma.taskComment.findMany({
      where: { taskId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateComment(commentId, userId, content) {
    const comment = await prisma.taskComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new AppError('Comment not found', 404);
    if (comment.userId !== userId) throw new AppError('Not authorized to edit this comment', 403);

    return prisma.taskComment.update({
      where: { id: commentId },
      data: { content },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });
  }

  async deleteComment(commentId, userId, userRole) {
    const comment = await prisma.taskComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new AppError('Comment not found', 404);
    if (comment.userId !== userId && userRole === 'MEMBER') {
      throw new AppError('Not authorized to delete this comment', 403);
    }

    await prisma.taskComment.delete({ where: { id: commentId } });
    return { message: 'Comment deleted' };
  }
}

module.exports = new CommentService();
