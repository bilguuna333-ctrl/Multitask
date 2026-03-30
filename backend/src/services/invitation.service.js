const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const prisma = require('../prisma/client');
const AppError = require('../utils/AppError');
const { sendInvitationEmail } = require('../utils/email');
const { generateTokenPair } = require('../utils/jwt');

class InvitationService {
  async createInvitation(workspaceId, invitedBy, { email, role = 'MEMBER' }) {
    const existingMember = await prisma.membership.findFirst({
      where: { workspaceId, user: { email }, isActive: true },
    });
    if (existingMember) throw new AppError('User is already a member of this workspace', 409);

    const existingInvite = await prisma.invitation.findFirst({
      where: { workspaceId, email, status: 'PENDING' },
    });
    if (existingInvite) throw new AppError('An invitation has already been sent to this email', 409);

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = await prisma.invitation.create({
      data: { email, role, token, workspaceId, invitedBy, expiresAt },
    });

    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    await sendInvitationEmail(email, workspace.name, token);

    await prisma.notification.create({
      data: {
        type: 'INVITE_SENT',
        title: 'Invitation Sent',
        message: `Invitation sent to ${email}`,
        workspaceId,
        userId: invitedBy,
      },
    });

    return invitation;
  }

  async getInvitations(workspaceId, { page = 1, limit = 20, status }) {
    const skip = (page - 1) * limit;
    const where = { workspaceId, ...(status && { status }) };

    const [invitations, total] = await Promise.all([
      prisma.invitation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.invitation.count({ where }),
    ]);

    return {
      invitations,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async acceptInvitation({ token, firstName, lastName, password }) {
    const invitation = await prisma.invitation.findUnique({ where: { token } });
    if (!invitation || invitation.status !== 'PENDING') {
      throw new AppError('Invalid or already used invitation', 400);
    }
    if (invitation.expiresAt < new Date()) {
      throw new AppError('Invitation has expired', 400);
    }

    let user = await prisma.user.findUnique({ where: { email: invitation.email } });

    const result = await prisma.$transaction(async (tx) => {
      if (!user) {
        if (!firstName || !lastName || !password) {
          throw new AppError('First name, last name, and password are required for new users', 400);
        }
        const passwordHash = await bcrypt.hash(password, 12);
        user = await tx.user.create({
          data: { email: invitation.email, passwordHash, firstName, lastName },
        });
      }

      const existingMembership = await tx.membership.findFirst({
        where: { userId: user.id, workspaceId: invitation.workspaceId },
      });

      let membership;
      if (existingMembership) {
        membership = await tx.membership.update({
          where: { id: existingMembership.id },
          data: { isActive: true, role: invitation.role },
        });
      } else {
        membership = await tx.membership.create({
          data: {
            userId: user.id,
            workspaceId: invitation.workspaceId,
            role: invitation.role,
          },
        });
      }

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      });

      return { user, membership };
    });

    const tokens = generateTokenPair(result.user, result.membership);
    const workspace = await prisma.workspace.findUnique({ where: { id: invitation.workspaceId } });

    return {
      user: { id: result.user.id, email: result.user.email, firstName: result.user.firstName, lastName: result.user.lastName },
      workspace: { id: workspace.id, name: workspace.name, slug: workspace.slug },
      membership: { id: result.membership.id, role: result.membership.role },
      ...tokens,
    };
  }

  async cancelInvitation(invitationId, workspaceId) {
    const invitation = await prisma.invitation.findFirst({
      where: { id: invitationId, workspaceId, status: 'PENDING' },
    });
    if (!invitation) throw new AppError('Invitation not found', 404);

    return prisma.invitation.update({
      where: { id: invitationId },
      data: { status: 'CANCELLED' },
    });
  }

  async resendInvitation(invitationId, workspaceId) {
    const invitation = await prisma.invitation.findFirst({
      where: { id: invitationId, workspaceId, status: 'PENDING' },
    });
    if (!invitation) throw new AppError('Invitation not found', 404);

    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    await sendInvitationEmail(invitation.email, workspace.name, invitation.token);
    return invitation;
  }
}

module.exports = new InvitationService();
