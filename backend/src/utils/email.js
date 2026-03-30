const nodemailer = require('nodemailer');
const logger = require('./logger');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return transporter;
  }

  logger.warn('SMTP not configured. Emails will be logged to console.');
  return null;
}

async function sendEmail({ to, subject, html }) {
  const transport = getTransporter();

  if (!transport) {
    logger.info(`[EMAIL FALLBACK] To: ${to} | Subject: ${subject}`);
    logger.debug(`[EMAIL FALLBACK] Body: ${html}`);
    return { fallback: true };
  }

  try {
    const info = await transport.sendMail({
      from: process.env.SMTP_FROM || '"MultiTask" <noreply@multitask.com>',
      to,
      subject,
      html,
    });
    logger.info(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('Email send failed:', error);
    logger.info(`[EMAIL FALLBACK] To: ${to} | Subject: ${subject}`);
    return { fallback: true, error: error.message };
  }
}

async function sendInvitationEmail(email, workspaceName, inviteToken) {
  const link = `${process.env.FRONTEND_URL}/invitations/accept?token=${inviteToken}`;
  return sendEmail({
    to: email,
    subject: `You've been invited to ${workspaceName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You're Invited!</h2>
        <p>You've been invited to join <strong>${workspaceName}</strong> on MultiTask.</p>
        <a href="${link}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;text-decoration:none;border-radius:8px;margin:16px 0;">Accept Invitation</a>
        <p style="color:#6B7280;font-size:14px;">Or copy this link: ${link}</p>
      </div>
    `,
  });
}

async function sendPasswordResetEmail(email, resetToken) {
  const link = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  return sendEmail({
    to: email,
    subject: 'Reset your password - MultiTask',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset Your Password</h2>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <a href="${link}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;text-decoration:none;border-radius:8px;margin:16px 0;">Reset Password</a>
        <p style="color:#6B7280;font-size:14px;">Or copy this link: ${link}</p>
        <p style="color:#9CA3AF;font-size:12px;">If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
}

module.exports = { sendEmail, sendInvitationEmail, sendPasswordResetEmail };
