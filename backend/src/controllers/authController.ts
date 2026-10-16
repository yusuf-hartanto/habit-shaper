import type { Request, Response } from 'express';
import * as authService from '../services/authService';
import { AppError } from '../utils/AppError';
import type {
  ApiSuccess,
  AuthResponse,
  LoginPayload,
  MessageResponse,
  RegisterPayload,
  ResetPasswordPayload,
  UserProfile,
} from '../types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

const asString = (value: unknown): string => (typeof value === 'string' ? value : '');

const parseRegisterPayload = (body: unknown): RegisterPayload => {
  const input = (body ?? {}) as Record<string, unknown>;
  const name = asString(input.name).trim();
  const email = asString(input.email).trim();
  const password = asString(input.password);

  const details: Record<string, string> = {};
  if (!name) details.name = 'Name is required';
  else if (name.length > 100) details.name = 'Name must be at most 100 characters';

  if (!email) details.email = 'Email is required';
  else if (!EMAIL_REGEX.test(email) || email.length > 150) details.email = 'Email is invalid';

  if (!password) details.password = 'Password is required';
  else if (password.length < MIN_PASSWORD_LENGTH)
    details.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;

  if (Object.keys(details).length > 0) {
    throw AppError.badRequest('Validation failed', details);
  }
  return { name, email, password };
};

const parseLoginPayload = (body: unknown): LoginPayload => {
  const input = (body ?? {}) as Record<string, unknown>;
  const email = asString(input.email).trim();
  const password = asString(input.password);

  const details: Record<string, string> = {};
  if (!email) details.email = 'Email is required';
  if (!password) details.password = 'Password is required';

  if (Object.keys(details).length > 0) {
    throw AppError.badRequest('Validation failed', details);
  }
  return { email, password };
};

const parseResetPasswordPayload = (body: unknown): ResetPasswordPayload => {
  const input = (body ?? {}) as Record<string, unknown>;
  const email = asString(input.email).trim();
  const newPassword = asString(input.newPassword);

  const details: Record<string, string> = {};
  if (!email) details.email = 'Email is required';
  else if (!EMAIL_REGEX.test(email)) details.email = 'Email is invalid';

  if (!newPassword) details.newPassword = 'New password is required';
  else if (newPassword.length < MIN_PASSWORD_LENGTH)
    details.newPassword = `New password must be at least ${MIN_PASSWORD_LENGTH} characters`;

  if (Object.keys(details).length > 0) {
    throw AppError.badRequest('Validation failed', details);
  }
  return { email, newPassword };
};

/** POST /api/auth/reset-password */
export const resetPassword = async (
  req: Request,
  res: Response<ApiSuccess<MessageResponse>>,
): Promise<void> => {
  const payload = parseResetPasswordPayload(req.body);
  const result = await authService.resetPassword(payload);
  res.status(200).json({ success: true, data: result, message: result.message });
};

/** POST /api/auth/register */
export const register = async (
  req: Request,
  res: Response<ApiSuccess<AuthResponse>>,
): Promise<void> => {
  const payload = parseRegisterPayload(req.body);
  const result = await authService.register(payload);
  res.status(201).json({ success: true, data: result, message: 'Registration successful' });
};

/** POST /api/auth/login */
export const login = async (
  req: Request,
  res: Response<ApiSuccess<AuthResponse>>,
): Promise<void> => {
  const payload = parseLoginPayload(req.body);
  const result = await authService.login(payload);
  res.status(200).json({ success: true, data: result, message: 'Login successful' });
};

/** GET /api/auth/me */
export const me = async (req: Request, res: Response<ApiSuccess<UserProfile>>): Promise<void> => {
  if (!req.user) {
    throw AppError.unauthorized();
  }
  const profile = await authService.getProfile(req.user.id);
  res.status(200).json({ success: true, data: profile });
};
