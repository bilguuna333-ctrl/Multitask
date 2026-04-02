const prisma = require('../prisma/client');
const AppError = require('../utils/AppError');

class MemberService {
  async getMembers(workspaceId, { page = 1, limit = 20, search = '' }) {
    const skip = (page - 1) * limit;
    const where = {
      workspaceId,
      ...(search && {
        user: {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { email: { contains: search } },
          ],
        },
      }),
    };

    const [members, total] = await Promise.all([
      prisma.membership.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true, isActive: true },
          },
        },
        orderBy: { joinedAt: 'asc' },
        skip,
        take: limit,
      }),
      prisma.membership.count({ where }),
    ]);

    return {
      members,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateRole(membershipId, role, workspaceId, currentUserId, currentUserRole) {
    const membership = await prisma.membership.findFirst({
      where: { id: membershipId, workspaceId },
      include: { user: true },
    });
    if (!membership) throw new AppError('Member not found', 404);
    if (membership.role === 'OWNER') throw new AppError('Cannot change owner role', 403);
    if (currentUserRole !== 'OWNER' && currentUserRole !== 'MANAGER') {
      throw new AppError('Insufficient permissions', 403);
    }

    const updated = await prisma.membership.update({
      where: { id: membershipId },
      data: { role },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'MEMBER_ROLE_UPDATED',
        entityType: 'MEMBER',
        entityId: membershipId,
        details: JSON.stringify({ userId: membership.userId, email: membership.user.email, oldRole: membership.role, newRole: role }),
        workspaceId,
        userId: currentUserId,
      },
    });

    if (membership.userId !== currentUserId) {
      await prisma.notification.create({
        data: {
          type: 'MEMBER_ROLE_UPDATED',
          title: 'Role Updated',
          message: `Your role in the workspace has been updated to ${role}`,
          workspaceId,
          userId: membership.userId,
        },
      });
    }

    return updated;
  }

  async removeMember(membershipId, workspaceId, currentUserId) {
    const membership = await prisma.membership.findFirst({
      where: { id: membershipId, workspaceId },
      include: { user: true },
    });
    if (!membership) throw new AppError('Member not found', 404);
    if (membership.role === 'OWNER') throw new AppError('Cannot remove workspace owner', 403);
    if (membership.userId === currentUserId) throw new AppError('Cannot remove yourself', 400);

    const result = await prisma.membership.update({
      where: { id: membershipId },
      data: { isActive: false },
    });

    await prisma.activityLog.create({
      data: {
        action: 'MEMBER_REMOVED',
        entityType: 'MEMBER',
        entityId: membershipId,
        details: JSON.stringify({ userId: membership.userId, email: membership.user.email }),
        workspaceId,
        userId: currentUserId,
      },
    });

    return result;
  }

  async reactivateMember(membershipId, workspaceId, currentUserId) {
    const membership = await prisma.membership.findFirst({
      where: { id: membershipId, workspaceId },
      include: { user: true },
    });
    if (!membership) throw new AppError('Member not found', 404);

    const result = await prisma.membership.update({
      where: { id: membershipId },
      data: { isActive: true },
    });

    await prisma.activityLog.create({
      data: {
        action: 'MEMBER_REACTIVATED',
        entityType: 'MEMBER',
        entityId: membershipId,
        details: JSON.stringify({ userId: membership.userId, email: membership.user.email }),
        workspaceId,
        userId: currentUserId,
      },
    });

    if (membership.userId !== currentUserId) {
      await prisma.notification.create({
        data: {
          type: 'MEMBER_REACTIVATED',
          title: 'Account Reactivated',
          message: `Your access to the workspace has been reactivated`,
          workspaceId,
          userId: membership.userId,
        },
      });
    }

    return result;
  }
}

module.exports = new MemberService();
