import nodemailer from 'nodemailer';
import { env } from '../config/env';

export const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: false,
  ignoreTLS: true,
});

export const sendPasswordResetEmail = async (
  toEmail: string,
  userName: string,
  resetToken: string,
  resetUrl: string,
): Promise<void> => {
  const subject = 'Password Reset Request - Habit Shaper';

  const text = `Hi ${userName || 'there'},

We received a request to reset your password for your Habit Shaper account.

Your password reset token is:
${resetToken}

Or click the link below to set your new password directly:
${resetUrl}

This token will expire in 15 minutes and can only be used once.
If you did not request a password reset, you can safely ignore this email.

Best regards,
The Habit Shaper Team`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .logo { display: inline-block; font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 20px; }
    .logo span { color: #4f46e5; }
    h1 { font-size: 20px; font-weight: 600; color: #0f172a; margin-top: 0; margin-bottom: 16px; }
    p { font-size: 14px; line-height: 1.6; color: #475569; margin: 12px 0; }
    .token-box { background: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 10px; padding: 14px; font-family: monospace; font-size: 13px; font-weight: 600; color: #1e293b; word-break: break-all; text-align: center; margin: 20px 0; user-select: all; }
    .btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; font-size: 14px; text-align: center; margin: 16px 0; }
    .footer { font-size: 12px; color: #94a3b8; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Habit<span>Shaper</span></div>
    <h1>Password Reset Request</h1>
    <p>Hi <strong>${userName || 'there'}</strong>,</p>
    <p>We received a request to reset your password. Use the token below on the password reset screen or click the button to set a new password directly:</p>

    <div style="text-align: center;">
      <a href="${resetUrl}" class="btn" target="_blank" rel="noopener noreferrer">Reset Your Password</a>
    </div>

    <p style="font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 4px;">Your Reset Token:</p>
    <div class="token-box">${resetToken}</div>

    <p style="font-size: 12px; color: #64748b;">
      ⏱️ This token will expire in <strong>15 minutes</strong> and can only be used once.<br>
      If you did not request this reset, you can safely ignore this email.
    </p>

    <div class="footer">
      Habit Shaper · Building positive habits, one day at a time.
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: env.smtp.from,
    to: toEmail,
    subject,
    text,
    html,
  });
};
