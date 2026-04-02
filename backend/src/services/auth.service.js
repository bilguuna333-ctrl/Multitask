const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { OAuth2Client } = require('google-auth-library');
const prisma = require('../prisma/client');
const AppError = require('../utils/AppError');
const { generateTokenPair, verifyRefreshToken } = require('../utils/jwt');
const { sendPasswordResetEmail } = require('../utils/email');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class AuthService {
  async register({ firstName, lastName, email, password }) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError('Email already registered', 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { email, passwordHash, firstName, lastName },
    });

    const tokens = generateTokenPair(user, null);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      workspace: null,
      membership: null,
      needsWorkspace: true,
      ...tokens,
    };
  }

  async googleLogin({ credential }) {
    if (!process.env.GOOGLE_CLIENT_ID) {
      throw new AppError('Google login is not configured', 500);
    }
    if (!credential) {
      throw new AppError('Google credential is required', 400);
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email || !payload.sub) {
      throw new AppError('Invalid Google credential', 401);
    }

    const email = payload.email.toLowerCase();
    const googleId = payload.sub;
    const firstName = payload.given_name || 'User';
    const lastName = payload.family_name || '';
    const avatarUrl = payload.picture || null;

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          googleId,
          authProvider: 'GOOGLE',
          firstName,
          lastName,
          avatarUrl,
          passwordHash: null,
        },
      });
    } else {
      const updateData = {};
      if (!user.googleId) updateData.googleId = googleId;
      if (user.authProvider !== 'GOOGLE') updateData.authProvider = 'GOOGLE';
      if (!user.avatarUrl && avatarUrl) updateData.avatarUrl = avatarUrl;
      if (Object.keys(updateData).length) {
        user = await prisma.user.update({ where: { id: user.id }, data: updateData });
      }
    }

    if (!user.isActive) {
      throw new AppError('Account is disabled', 403);
    }

    const membership = await prisma.membership.findFirst({
      where: { userId: user.id, isActive: true },
      include: { workspace: true },
    });

    if (!membership) {
      const tokens = generateTokenPair(user, null);
      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl,
        },
        workspace: null,
        membership: null,
        needsWorkspace: true,
        ...tokens,
      };
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

  async login({ email, password }) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.passwordHash) {
      throw new AppError('This account uses Google Sign-In. Please continue with Google.', 400);
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
      // User exists but has no workspace — return partial auth so frontend can redirect
      const tokens = generateTokenPair(user, null);
      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl,
        },
        workspace: null,
        membership: null,
        needsWorkspace: true,
        ...tokens,
      };
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
        avatarUrl: true, createdAt: true, authProvider: true, googleId: true,
        passwordHash: true,
        memberships: {
          where: { isActive: true },
          include: { workspace: { select: { id: true, name: true, slug: true } } },
        },
      },
    });
    if (!user) throw new AppError('User not found', 404);
    
    const { passwordHash, ...safeUser } = user;
    return { ...safeUser, hasPassword: !!passwordHash };
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
    
    if (user.passwordHash) {
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) throw new AppError('Current password is incorrect', 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { message: user.passwordHash ? 'Password changed successfully' : 'Password set successfully' };
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
