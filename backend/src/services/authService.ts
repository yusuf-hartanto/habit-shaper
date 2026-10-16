import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User } from '../models';
import { AppError } from '../utils/AppError';
import type {
  AuthResponse,
  AuthTokenPayload,
  LoginPayload,
  MessageResponse,
  RegisterPayload,
  ResetPasswordPayload,
  UserProfile,
} from '../types';

const SALT_ROUNDS = 10;

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
 * Self-contained password reset (no email/SMTP step, per spec): sets a new
 * password for the account identified by `email`.
 */
export const resetPassword = async ({
  email,
  newPassword,
}: ResetPasswordPayload): Promise<MessageResponse> => {
  const user = await User.findOne({ where: { email: normalizeEmail(email) } });
  if (!user) {
    throw AppError.notFound('No account found with that email address');
  }

  user.password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await user.save();

  return {
    message: 'Password has been reset successfully. You can now sign in with your new password.',
  };
};
