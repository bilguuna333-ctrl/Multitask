const { v4: uuidv4 } = require('uuid');
const prisma = require('../prisma/client');
const AppError = require('../utils/AppError');
const { generateTokenPair } = require('../utils/jwt');

class ApplicationService {
  // List all public workspaces (for users to browse and apply)
  async listWorkspaces({ search, page = 1, limit = 20 }) {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const where = { isActive: true };
    if (search) {
      where.name = { contains: search };
    }

    const [workspaces, total] = await Promise.all([
      prisma.workspace.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          createdAt: true,
          _count: { select: { memberships: true } },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limitNum,
      }),
      prisma.workspace.count({ where }),
    ]);

    return {
      workspaces,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    };
  }

  // Create a new company (workspace) for the current user
  async createCompany(userId, { name, logoUrl }) {
    if (!name || !name.trim()) {
      throw new AppError('Company name is required', 400);
    }
    if (!logoUrl) {
      throw new AppError('Company logo is required', 400);
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + uuidv4().slice(0, 6);

    const result = await prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: { name: name.trim(), slug, logoUrl },
      });

      const membership = await tx.membership.create({
        data: { userId, workspaceId: workspace.id, role: 'OWNER' },
      });

      return { workspace, membership };
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const tokens = generateTokenPair(user, result.membership);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
      },
      workspace: {
        id: result.workspace.id,
        name: result.workspace.name,
        slug: result.workspace.slug,
      },
      membership: {
        id: result.membership.id,
        role: result.membership.role,
      },
      ...tokens,
    };
  }

  // Apply to a company with CV
  async applyToCompany(userId, workspaceId, { coverLetter, cvFileUrl, cvFileName, cvFileSize }) {
    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace || !workspace.isActive) {
      throw new AppError('Company not found', 404);
    }

    // Check if already a member
    const existingMembership = await prisma.membership.findFirst({
      where: { userId, workspaceId, isActive: true },
    });
    if (existingMembership) {
      throw new AppError('You are already a member of this company', 409);
    }

    // Check if already has a pending application
    const existingApp = await prisma.companyApplication.findFirst({
      where: { userId, workspaceId, status: 'PENDING' },
    });
    if (existingApp) {
      throw new AppError('You already have a pending application for this company', 409);
    }

    const application = await prisma.companyApplication.create({
      data: {
        userId,
        workspaceId,
        coverLetter: coverLetter || null,
        cvFileUrl: cvFileUrl || null,
        cvFileName: cvFileName || null,
        cvFileSize: cvFileSize ? parseInt(cvFileSize) : null,
      },
      include: {
        workspace: { select: { id: true, name: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    // Notify managers of the workspace
    const managers = await prisma.membership.findMany({
      where: {
        workspaceId,
        isActive: true,
        role: { in: ['OWNER', 'MANAGER'] },
      },
    });

    const notifications = managers.map((m) => ({
      type: 'APPLICATION_RECEIVED',
      title: 'New Application Received',
      message: `${application.user.firstName} ${application.user.lastName} applied to join ${application.workspace.name}`,
      link: '/applications',
      workspaceId,
      userId: m.userId,
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
    }

    return application;
  }

  // Get my applications (for the applicant user)
  async getMyApplications(userId) {
    const applications = await prisma.companyApplication.findMany({
      where: { userId },
      include: {
        workspace: { select: { id: true, name: true, slug: true, logoUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return applications;
  }

  // Get applications for a workspace (for OWNER/ADMIN)
  async getWorkspaceApplications(workspaceId, { status, page = 1, limit = 20 }) {
    const skip = (page - 1) * limit;
    const where = { workspaceId };
    if (status) where.status = status;

    const [applications, total] = await Promise.all([
      prisma.companyApplication.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.companyApplication.count({ where }),
    ]);

    return {
      applications,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // Accept application (OWNER/ADMIN)
  async acceptApplication(applicationId, workspaceId, note) {
    const application = await prisma.companyApplication.findFirst({
      where: { id: applicationId, workspaceId, status: 'PENDING' },
      include: { workspace: { select: { name: true } } }
    });
    if (!application) throw new AppError('Application not found', 404);

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.companyApplication.update({
        where: { id: applicationId },
        data: { status: 'ACCEPTED', note: note || null },
      });

      // Check for existing inactive membership
      const existingMembership = await tx.membership.findFirst({
        where: { userId: application.userId, workspaceId },
      });

      let membership;
      if (existingMembership) {
        membership = await tx.membership.update({
          where: { id: existingMembership.id },
          data: { isActive: true, role: 'MEMBER' },
        });
      } else {
        membership = await tx.membership.create({
          data: { userId: application.userId, workspaceId, role: 'MEMBER' },
        });
      }

      return { application: updated, membership };
    });

    // Notify the applicant
    await prisma.notification.create({
      data: {
        type: 'APPLICATION_ACCEPTED',
        title: 'Application Accepted',
        message: `Your application to join ${application.workspace.name} has been accepted!`,
        link: '/company-select',
        workspaceId,
        userId: application.userId,
      },
    });

    return result.application;
  }

  // Reject application (OWNER/ADMIN)
  async rejectApplication(applicationId, workspaceId, note) {
    const application = await prisma.companyApplication.findFirst({
      where: { id: applicationId, workspaceId, status: 'PENDING' },
      include: { workspace: { select: { name: true } } }
    });
    if (!application) throw new AppError('Application not found', 404);

    const updated = await prisma.companyApplication.update({
      where: { id: applicationId },
      data: { status: 'REJECTED', note: note || null },
    });

    // Notify the applicant
    await prisma.notification.create({
      data: {
        type: 'APPLICATION_REJECTED',
        title: 'Application Update',
        message: `Your application to join ${application.workspace.name} was not accepted at this time.`,
        workspaceId,
        userId: application.userId,
      },
    });

    return updated;
  }
}

module.exports = new ApplicationService();
