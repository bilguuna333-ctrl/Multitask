const prisma = require('../prisma/client');
const AppError = require('../utils/AppError');

class ProjectService {
  async createProject(workspaceId, userId, { name, description, memberIds = [] }) {
    const project = await prisma.$transaction(async (tx) => {
      const proj = await tx.project.create({
        data: { name, description, workspaceId },
      });

      // Add creator as project member
      const allMemberIds = [...new Set([userId, ...memberIds])];
      await tx.projectMember.createMany({
        data: allMemberIds.map(uid => ({ projectId: proj.id, userId: uid })),
        skipDuplicates: true,
      });

      await tx.activityLog.create({
        data: {
          action: 'PROJECT_CREATED',
          entityType: 'PROJECT',
          entityId: proj.id,
          details: JSON.stringify({ name }),
          workspaceId,
          userId,
        },
      });

      return proj;
    });

    return this.getProject(project.id, workspaceId);
  }

  async getProjects(workspaceId, { page = 1, limit = 20, search = '', status = '', isArchived = false }) {
    const skip = (page - 1) * limit;
    const where = {
      workspaceId,
      isArchived: isArchived === 'true' || isArchived === true,
      ...(search && { name: { contains: search } }),
      ...(status && { status }),
    };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          _count: { select: { tasks: true, projectMembers: true } },
          projectMembers: {
            include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
            take: 5,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.project.count({ where }),
    ]);

    return {
      projects,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getProject(projectId, workspaceId) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, workspaceId },
      include: {
        _count: { select: { tasks: true, projectMembers: true } },
        projectMembers: {
          include: { user: { select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true } } },
        },
        tasks: {
          where: { isArchived: false },
          orderBy: [{ status: 'asc' }, { position: 'asc' }],
          include: {
            assignee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          },
        },
      },
    });
    if (!project) throw new AppError('Project not found', 404);
    return project;
  }

  async updateProject(projectId, workspaceId, userId, data) {
    const project = await prisma.project.findFirst({ where: { id: projectId, workspaceId } });
    if (!project) throw new AppError('Project not found', 404);

    const updateData = {};
    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status) updateData.status = data.status;

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
    });

    await prisma.activityLog.create({
      data: {
        action: 'PROJECT_UPDATED',
        entityType: 'PROJECT',
        entityId: projectId,
        details: JSON.stringify(updateData),
        workspaceId,
        userId,
      },
    });

    return this.getProject(projectId, workspaceId);
  }

  async archiveProject(projectId, workspaceId, userId) {
    const project = await prisma.project.findFirst({ where: { id: projectId, workspaceId } });
    if (!project) throw new AppError('Project not found', 404);

    await prisma.project.update({ where: { id: projectId }, data: { isArchived: true } });

    await prisma.activityLog.create({
      data: {
        action: 'PROJECT_ARCHIVED',
        entityType: 'PROJECT',
        entityId: projectId,
        workspaceId,
        userId,
      },
    });

    return { message: 'Project archived' };
  }

  async deleteProject(projectId, workspaceId, userId) {
    const project = await prisma.project.findFirst({ where: { id: projectId, workspaceId } });
    if (!project) throw new AppError('Project not found', 404);

    await prisma.project.delete({ where: { id: projectId } });
    return { message: 'Project deleted' };
  }

  async addProjectMember(projectId, workspaceId, userId) {
    const project = await prisma.project.findFirst({ where: { id: projectId, workspaceId } });
    if (!project) throw new AppError('Project not found', 404);

    const membership = await prisma.membership.findFirst({
      where: { userId, workspaceId, isActive: true },
    });
    if (!membership) throw new AppError('User is not a workspace member', 400);

    return prisma.projectMember.create({
      data: { projectId, userId },
    });
  }

  async removeProjectMember(projectId, workspaceId, userId) {
    const pm = await prisma.projectMember.findFirst({
      where: { projectId, userId, project: { workspaceId } },
    });
    if (!pm) throw new AppError('Project member not found', 404);

    await prisma.projectMember.delete({ where: { id: pm.id } });
    return { message: 'Member removed from project' };
  }
}

module.exports = new ProjectService();
