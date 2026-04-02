const prisma = require('../prisma/client');
const AppError = require('../utils/AppError');

const SUBMISSION_TYPES = ['CODE', 'DOC', 'SHEET', 'QUIZ', 'FILE_UPLOAD'];

class SubmissionService {
  async createSubmission(taskId, workspaceId, userId, data) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, workspaceId },
    });
    if (!task) throw new AppError('Task not found', 404);
    if (task.assigneeId !== userId) {
      throw new AppError('Only the assigned member can submit work', 403);
    }
    if (!SUBMISSION_TYPES.includes(data.type)) {
      throw new AppError(`Invalid submission type. Must be one of: ${SUBMISSION_TYPES.join(', ')}`, 400);
    }

    const submission = await prisma.taskSubmission.create({
      data: {
        type: data.type,
        title: data.title,
        content: data.content || null,
        fileUrl: data.fileUrl || null,
        fileName: data.fileName || null,
        fileSize: data.fileSize || null,
        taskId,
        userId,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });

    // Move task to REVIEW status and set reviewStatus to PENDING
    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'REVIEW',
        reviewStatus: 'PENDING',
        reviewedById: null,
        reviewedAt: null,
        reviewNote: null,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'SUBMISSION_CREATED',
        entityType: 'TASK',
        entityId: taskId,
        details: JSON.stringify({ type: data.type, title: data.title }),
        workspaceId,
        userId,
      },
    });

    // Notify managers/admins/owner in the workspace
    const managers = await prisma.membership.findMany({
      where: {
        workspaceId,
        isActive: true,
        role: { in: ['OWNER', 'MANAGER'] },
      },
    });

    const notifications = managers
      .filter((m) => m.userId !== userId)
      .map((m) => ({
        type: 'SUBMISSION_REVIEW',
        title: 'New Submission for Review',
        message: `A submission has been added to "${task.title}" and needs your review`,
        link: `/tasks?reviewStatus=PENDING`,
        workspaceId,
        userId: m.userId,
      }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
    }

    return submission;
  }

  async getSubmissions(taskId, workspaceId) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, workspaceId },
    });
    if (!task) throw new AppError('Task not found', 404);

    return prisma.taskSubmission.findMany({
      where: { taskId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveTask(taskId, workspaceId, reviewerId, note) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, workspaceId },
    });
    if (!task) throw new AppError('Task not found', 404);
    if (task.reviewStatus !== 'PENDING') {
      throw new AppError('Task is not pending review', 400);
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'DONE',
        reviewStatus: 'APPROVED',
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        reviewNote: note || null,
      },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        creator: { select: { id: true, firstName: true, lastName: true } },
        project: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, firstName: true, lastName: true } },
        submissions: {
          include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { comments: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'TASK_APPROVED',
        entityType: 'TASK',
        entityId: taskId,
        details: JSON.stringify({ note }),
        workspaceId,
        userId: reviewerId,
      },
    });

    if (task.assigneeId && task.assigneeId !== reviewerId) {
      await prisma.notification.create({
        data: {
          type: 'TASK_APPROVED',
          title: 'Task Approved',
          message: `Your task "${task.title}" has been approved${note ? `: ${note}` : ''}`,
          link: `/tasks`,
          workspaceId,
          userId: task.assigneeId,
        },
      });
    }

    return updated;
  }

  async cancelTask(taskId, workspaceId, reviewerId, note) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, workspaceId },
    });
    if (!task) throw new AppError('Task not found', 404);
    if (task.reviewStatus !== 'PENDING') {
      throw new AppError('Task is not pending review', 400);
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'IN_PROGRESS',
        reviewStatus: 'REJECTED',
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        reviewNote: note || null,
      },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        creator: { select: { id: true, firstName: true, lastName: true } },
        project: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, firstName: true, lastName: true } },
        submissions: {
          include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { comments: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'TASK_REJECTED',
        entityType: 'TASK',
        entityId: taskId,
        details: JSON.stringify({ note }),
        workspaceId,
        userId: reviewerId,
      },
    });

    if (task.assigneeId && task.assigneeId !== reviewerId) {
      await prisma.notification.create({
        data: {
          type: 'TASK_REJECTED',
          title: 'Task Returned',
          message: `Your task "${task.title}" has been returned for revision${note ? `: ${note}` : ''}`,
          link: `/tasks`,
          workspaceId,
          userId: task.assigneeId,
        },
      });
    }

    return updated;
  }

  async getReviewQueue(workspaceId, { page = 1, limit = 50 }) {
    const skip = (page - 1) * limit;
    const where = {
      workspaceId,
      reviewStatus: 'PENDING',
      status: 'REVIEW',
    };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          creator: { select: { id: true, firstName: true, lastName: true } },
          project: { select: { id: true, name: true } },
          submissions: {
            include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
            orderBy: { createdAt: 'desc' },
          },
          _count: { select: { comments: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    return {
      tasks,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}

module.exports = new SubmissionService();
