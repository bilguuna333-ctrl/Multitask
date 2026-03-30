const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../prisma/client');
const AppError = require('../utils/AppError');
const { generateTokenPair, verifyRefreshToken } = require('../utils/jwt');
const { sendPasswordResetEmail } = require('../utils/email');

class AuthService {
  async register({ workspaceName, firstName, lastName, email, password }) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError('Email already registered', 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const slug = workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + uuidv4().slice(0, 6);

    const result = await prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: { name: workspaceName, slug },
      });

      const user = await tx.user.create({
        data: { email, passwordHash, firstName, lastName },
      });

      const membership = await tx.membership.create({
        data: { userId: user.id, workspaceId: workspace.id, role: 'OWNER' },
      });

      return { workspace, user, membership };
    });

    const tokens = generateTokenPair(result.user, result.membership);

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
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

  async login({ email, password }) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const membership = await prisma.membership.findFirst({
      where: { userId: user.id, isActive: true },
      include: { workspace: true },
    });

    if (!membership) {
      throw new AppError('No active workspace found', 404);
    }

    const tokens = generateTokenPair(user, membership);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
      },
      workspace: {
        id: membership.workspace.id,
        name: membership.workspace.name,
        slug: membership.workspace.slug,
      },
      membership: {
        id: membership.id,
        role: membership.role,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken) {
    const decoded = verifyRefreshToken(refreshToken);

    const membership = await prisma.membership.findUnique({
      where: { id: decoded.membershipId },
      include: { user: true, workspace: true },
    });

    if (!membership || !membership.isActive || !membership.user.isActive) {
      throw new AppError('Invalid refresh token', 401);
    }

    const tokens = generateTokenPair(membership.user, membership);

    return {
      user: {
        id: membership.user.id,
        email: membership.user.email,
        firstName: membership.user.firstName,
        lastName: membership.user.lastName,
      },
      workspace: {
        id: membership.workspace.id,
        name: membership.workspace.name,
        slug: membership.workspace.slug,
      },
      membership: {
        id: membership.id,
        role: membership.role,
      },
      ...tokens,
    };
  }

  async forgotPassword(email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { message: 'If an account with that email exists, a reset link has been sent.' };
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    await sendPasswordResetEmail(email, token);

    return { message: 'If an account with that email exists, a reset link has been sent.' };
  }

  async resetPassword(token, newPassword) {
    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    return { message: 'Password reset successfully' };
  }

  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        avatarUrl: true, createdAt: true,
        memberships: {
          where: { isActive: true },
          include: { workspace: { select: { id: true, name: true, slug: true } } },
        },
      },
    });
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  async updateProfile(userId, data) {
    const updateData = {};
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true },
    });
    return user;
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) throw new AppError('Current password is incorrect', 400);

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { message: 'Password changed successfully' };
  }

  async switchWorkspace(userId, workspaceId) {
    const membership = await prisma.membership.findFirst({
      where: { userId, workspaceId, isActive: true },
      include: { workspace: true, user: true },
    });
    if (!membership) throw new AppError('Workspace not found or access denied', 404);

    const tokens = generateTokenPair(membership.user, membership);
    return {
      workspace: {
        id: membership.workspace.id,
        name: membership.workspace.name,
        slug: membership.workspace.slug,
      },
      membership: { id: membership.id, role: membership.role },
      ...tokens,
    };
  }
}

module.exports = new AuthService();
