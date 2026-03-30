const prisma = require('../prisma/client');

class DashboardService {
  async getDashboard(workspaceId) {
    const now = new Date();

    const [
      totalProjects,
      totalTasks,
      completedTasks,
      overdueTasks,
      todoTasks,
      inProgressTasks,
      reviewTasks,
      doneTasks,
      recentActivity,
      tasksByPriority,
    ] = await Promise.all([
      prisma.project.count({ where: { workspaceId, isArchived: false } }),
      prisma.task.count({ where: { workspaceId, isArchived: false } }),
      prisma.task.count({ where: { workspaceId, status: 'DONE', isArchived: false } }),
      prisma.task.count({
        where: {
          workspaceId,
          isArchived: false,
          status: { not: 'DONE' },
          dueDate: { lt: now },
        },
      }),
      prisma.task.count({ where: { workspaceId, status: 'TODO', isArchived: false } }),
      prisma.task.count({ where: { workspaceId, status: 'IN_PROGRESS', isArchived: false } }),
      prisma.task.count({ where: { workspaceId, status: 'REVIEW', isArchived: false } }),
      prisma.task.count({ where: { workspaceId, status: 'DONE', isArchived: false } }),
      prisma.activityLog.findMany({
        where: { workspaceId },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),
      Promise.all([
        prisma.task.count({ where: { workspaceId, priority: 'LOW', isArchived: false } }),
        prisma.task.count({ where: { workspaceId, priority: 'MEDIUM', isArchived: false } }),
        prisma.task.count({ where: { workspaceId, priority: 'HIGH', isArchived: false } }),
        prisma.task.count({ where: { workspaceId, priority: 'URGENT', isArchived: false } }),
      ]),
    ]);

    return {
      metrics: {
        totalProjects,
        totalTasks,
        completedTasks,
        overdueTasks,
      },
      tasksByStatus: {
        todo: todoTasks,
        inProgress: inProgressTasks,
        review: reviewTasks,
        done: doneTasks,
      },
      tasksByPriority: {
        low: tasksByPriority[0],
        medium: tasksByPriority[1],
        high: tasksByPriority[2],
        urgent: tasksByPriority[3],
      },
      recentActivity,
    };
  }
}

module.exports = new DashboardService();
