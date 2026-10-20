import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { env } from '../config/env';
import { User } from '../models';
import { AppError } from '../utils/AppError';
import { sendPasswordResetEmail } from '../utils/mailer';
import type {
  AuthResponse,
  AuthTokenPayload,
  ChangePasswordPayload,
  ForgotPasswordResponse,
  LoginPayload,
  MessageResponse,
  RegisterPayload,
  ResetPasswordPayload,
  UserProfile,
} from '../types';

const SALT_ROUNDS = 10;
const RESET_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const toUserProfile = (user: User): UserProfile => ({
  id: user.id,
  name: user.name,
  email: user.email,
  last_login_at: user.last_login_at,
  created_at: user.created_at,
  updated_at: user.updated_at,
});

export const signToken = (user: Pick<User, 'id' | 'email'>): string => {
  const payload: AuthTokenPayload = { id: user.id, email: user.email };
  return jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
};

/** Creates an account (no email verification) and returns a session token. */
export const register = async ({ name, email, password }: RegisterPayload): Promise<AuthResponse> => {
  const normalizedEmail = normalizeEmail(email);

  const existing = await User.findOne({ where: { email: normalizedEmail } });
  if (existing) {
    throw AppError.conflict('Email is already registered');
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password_hash,
    last_login_at: new Date(),
  });

  return { token: signToken(user), user: toUserProfile(user) };
};

/** Verifies credentials, stamps last_login_at and returns a session token. */
export const login = async ({ email, password }: LoginPayload): Promise<AuthResponse> => {
  const user = await User.findOne({ where: { email: normalizeEmail(email) } });

  // Same message for unknown email / wrong password to avoid account enumeration.
  const valid = user ? await bcrypt.compare(password, user.password_hash) : false;
  if (!user || !valid) {
    throw AppError.unauthorized('Invalid email or password');
  }

  user.last_login_at = new Date();
  await user.save();

  return { token: signToken(user), user: toUserProfile(user) };
};

/** Loads the profile of the authenticated user. */
export const getProfile = async (userId: string): Promise<UserProfile> => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw AppError.unauthorized('User no longer exists');
  }
  return toUserProfile(user);
};

/**
 * Initiates an out-of-band password reset flow: generates a single-use SHA-256 hashed
 * token expiring in 15 minutes, stores it in MySQL, and sends it via SMTP to Mailpit.
 */
export const forgotPassword = async (email: string): Promise<ForgotPasswordResponse> => {
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ where: { email: normalizedEmail } });

  if (!user) {
    throw AppError.notFound('Email address not found. Please check your email or register a new account.');
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

  user.reset_password_token_hash = tokenHash;
  user.reset_password_expires_at = expiresAt;
  await user.save();

  // Log raw reset token as a stdout fallback
  console.log(`[SECURITY/DEV] Password reset token for ${normalizedEmail}: ${rawToken}`);

  // Send out-of-band email via Mailpit SMTP
  const resetUrl = `${env.frontendUrl}/?mode=reset&token=${rawToken}`;
  await sendPasswordResetEmail(user.email, user.name, rawToken, resetUrl);

  return {
    message: 'Password reset email has been sent! Please check your inbox (Mailpit at http://localhost:8025) to retrieve your reset token.',
  };
};

/**
 * Verifies single-use reset token and updates password.
 */
export const resetPassword = async ({
  token,
  newPassword,
}: ResetPasswordPayload): Promise<MessageResponse> => {
  const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

  const user = await User.findOne({
    where: {
      reset_password_token_hash: tokenHash,
      reset_password_expires_at: {
        [Op.gt]: new Date(),
      },
    },
  });

  if (!user) {
    throw AppError.badRequest('Invalid or expired password reset token');
  }

  user.password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  user.reset_password_token_hash = null;
  user.reset_password_expires_at = null;
  await user.save();

  return {
    message: 'Password has been reset successfully. You can now sign in with your new password.',
  };
};

/**
 * Authenticated password change for currently signed-in user.
 */
export const changePassword = async (
  userId: string,
  { currentPassword, newPassword }: ChangePasswordPayload,
): Promise<MessageResponse> => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw AppError.unauthorized('User no longer exists');
  }

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) {
    throw AppError.unauthorized('Current password is incorrect');
  }

  if (currentPassword === newPassword) {
    throw AppError.badRequest('New password must be different from current password');
  }

  user.password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  user.reset_password_token_hash = null;
  user.reset_password_expires_at = null;
  await user.save();

  return {
    message: 'Password has been changed successfully.',
  };
};
