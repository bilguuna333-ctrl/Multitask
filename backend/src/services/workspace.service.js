const prisma = require('../prisma/client');
const AppError = require('../utils/AppError');

class WorkspaceService {
  async getWorkspace(workspaceId) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        _count: { select: { memberships: true, projects: true, tasks: true } },
      },
    });
    if (!workspace) throw new AppError('Workspace not found', 404);
    return workspace;
  }

  async updateWorkspace(workspaceId, data) {
    const updateData = {};
    if (data.name) updateData.name = data.name;
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
    if (data.themeColor) updateData.themeColor = data.themeColor;

    const workspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: updateData,
    });
    return workspace;
  }
}

module.exports = new WorkspaceService();
