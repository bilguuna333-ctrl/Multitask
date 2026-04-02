const prisma = require('../prisma/client');
const AppError = require('../utils/AppError');

class TaskService {
  async checkManagerRole(workspaceId, userId) {
    const membership = await prisma.membership.findFirst({
      where: { userId, workspaceId, isActive: true },
    });
    if (!membership || !['OWNER', 'MANAGER'].includes(membership.role)) {
      throw new AppError('Only managers can perform this action', 403);
    }
  }

  async createTask(workspaceId, userId, data) {
    await this.checkManagerRole(workspaceId, userId);
    const project = await prisma.project.findFirst({
      where: { id: data.projectId, workspaceId },
    });
    if (!project) throw new AppError('Project not found', 404);

    const maxPosition = await prisma.task.aggregate({
      where: { projectId: data.projectId, status: data.status || 'TODO' },
      _max: { position: true },
    });

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description || null,
        status: data.status || 'TODO',
        priority: data.priority || 'MEDIUM',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        tags: data.tags || null,
        position: (maxPosition._max.position || 0) + 1,
        workspaceId,
        projectId: data.projectId,
        assigneeId: data.assigneeId || null,
        creatorId: userId,
      },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        creator: { select: { id: true, firstName: true, lastName: true } },
        project: { select: { id: true, name: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'TASK_CREATED',
        entityType: 'TASK',
        entityId: task.id,
        details: JSON.stringify({ title: task.title }),
        workspaceId,
        userId,
      },
    });

    if (data.assigneeId && data.assigneeId !== userId) {
      await prisma.notification.create({
        data: {
          type: 'TASK_ASSIGNED',
          title: 'Task Assigned',
          message: `You have been assigned to "${task.title}"`,
          link: `/projects/${data.projectId}/tasks/${task.id}`,
          workspaceId,
          userId: data.assigneeId,
        },
      });
    }

    return task;
  }

  async getTasks(workspaceId, { page = 1, limit = 50, projectId, status, priority, assigneeId, search, dueDate, isArchived = false }) {
    const skip = (page - 1) * limit;
    const where = {
      workspaceId,
      isArchived: isArchived === 'true' || isArchived === true,
      ...(projectId && { projectId }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(assigneeId && { assigneeId }),
      ...(search && { title: { contains: search } }),
      ...(dueDate && {
        dueDate: {
          lte: new Date(dueDate),
        },
      }),
    };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          creator: { select: { id: true, firstName: true, lastName: true } },
          project: { select: { id: true, name: true } },
          reviewedBy: { select: { id: true, firstName: true, lastName: true } },
          submissions: {
            include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
            orderBy: { createdAt: 'desc' },
          },
          _count: { select: { comments: true, submissions: true } },
        },
        orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
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

  async getTask(taskId, workspaceId) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, workspaceId },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, email: true } },
        creator: { select: { id: true, firstName: true, lastName: true } },
        project: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, firstName: true, lastName: true } },
        comments: {
          include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
        },
        submissions: {
          include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
        },
        attachments: true,
      },
    });
    if (!task) throw new AppError('Task not found', 404);
    return task;
  }

  async updateTask(taskId, workspaceId, userId, data) {
    const task = await prisma.task.findFirst({ where: { id: taskId, workspaceId } });
    if (!task) throw new AppError('Task not found', 404);

    // Check if user is MANAGER/OWNER
    const membership = await prisma.membership.findFirst({
      where: { userId, workspaceId, isActive: true },
    });
    if (!membership || !['OWNER', 'MANAGER'].includes(membership.role)) {
      throw new AppError('Only managers can update tasks directly', 403);
    }

    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId || null;
    if (data.position !== undefined) updateData.position = data.position;

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        creator: { select: { id: true, firstName: true, lastName: true } },
        project: { select: { id: true, name: true } },
        _count: { select: { comments: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'TASK_UPDATED',
        entityType: 'TASK',
        entityId: taskId,
        details: JSON.stringify(updateData),
        workspaceId,
        userId,
      },
    });

    if (data.assigneeId && data.assigneeId !== task.assigneeId && data.assigneeId !== userId) {
      await prisma.notification.create({
        data: {
          type: 'TASK_ASSIGNED',
          title: 'Task Assigned',
          message: `You have been assigned to "${updated.title}"`,
          link: `/projects/${updated.projectId}/tasks/${updated.id}`,
          workspaceId,
          userId: data.assigneeId,
        },
      });
    }

    if (data.dueDate && data.dueDate !== task.dueDate?.toISOString() && task.assigneeId) {
      await prisma.notification.create({
        data: {
          type: 'DUE_DATE_CHANGED',
          title: 'Due Date Changed',
          message: `Due date for "${updated.title}" has been updated`,
          link: `/projects/${updated.projectId}/tasks/${updated.id}`,
          workspaceId,
          userId: task.assigneeId,
        },
      });
    }

    return updated;
  }

  async reorderTasks(workspaceId, userId, tasks) {
    await this.checkManagerRole(workspaceId, userId);
    const updates = tasks.map(t =>
      prisma.task.updateMany({
        where: { id: t.id, workspaceId },
        data: { status: t.status, position: t.position },
      })
    );
    await prisma.$transaction(updates);
    return { message: 'Tasks reordered' };
  }

  async deleteTask(taskId, workspaceId, userId) {
    await this.checkManagerRole(workspaceId, userId);
    const task = await prisma.task.findFirst({ where: { id: taskId, workspaceId } });
    if (!task) throw new AppError('Task not found', 404);

    await prisma.task.delete({ where: { id: taskId } });

    await prisma.activityLog.create({
      data: {
        action: 'TASK_DELETED',
        entityType: 'TASK',
        entityId: taskId,
        details: JSON.stringify({ title: task.title }),
        workspaceId,
        userId,
      },
    });

    return { message: 'Task deleted' };
  }

  async archiveTask(taskId, workspaceId, userId) {
    await this.checkManagerRole(workspaceId, userId);
    const task = await prisma.task.findFirst({ where: { id: taskId, workspaceId } });
    if (!task) throw new AppError('Task not found', 404);

    await prisma.task.update({ where: { id: taskId }, data: { isArchived: true } });

    await prisma.activityLog.create({
      data: {
        action: 'TASK_ARCHIVED',
        entityType: 'TASK',
        entityId: taskId,
        details: JSON.stringify({ title: task.title }),
        workspaceId,
        userId,
      },
    });

    return { message: 'Task archived' };
  }
}

module.exports = new TaskService();
