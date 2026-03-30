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

  async updateRole(membershipId, role, workspaceId, currentUserRole) {
    const membership = await prisma.membership.findFirst({
      where: { id: membershipId, workspaceId },
    });
    if (!membership) throw new AppError('Member not found', 404);
    if (membership.role === 'OWNER') throw new AppError('Cannot change owner role', 403);
    if (currentUserRole !== 'OWNER' && currentUserRole !== 'ADMIN') {
      throw new AppError('Insufficient permissions', 403);
    }

    return prisma.membership.update({
      where: { id: membershipId },
      data: { role },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async removeMember(membershipId, workspaceId, currentUserId) {
    const membership = await prisma.membership.findFirst({
      where: { id: membershipId, workspaceId },
    });
    if (!membership) throw new AppError('Member not found', 404);
    if (membership.role === 'OWNER') throw new AppError('Cannot remove workspace owner', 403);
    if (membership.userId === currentUserId) throw new AppError('Cannot remove yourself', 400);

    return prisma.membership.update({
      where: { id: membershipId },
      data: { isActive: false },
    });
  }

  async reactivateMember(membershipId, workspaceId) {
    const membership = await prisma.membership.findFirst({
      where: { id: membershipId, workspaceId },
    });
    if (!membership) throw new AppError('Member not found', 404);

    return prisma.membership.update({
      where: { id: membershipId },
      data: { isActive: true },
    });
  }
}

module.exports = new MemberService();
