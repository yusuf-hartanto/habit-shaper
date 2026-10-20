import type { Request, Response } from 'express';
import * as authService from '../services/authService';
import { AppError } from '../utils/AppError';
import type {
  ApiSuccess,
  AuthResponse,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  ForgotPasswordResponse,
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

const parseForgotPasswordPayload = (body: unknown): ForgotPasswordPayload => {
  const input = (body ?? {}) as Record<string, unknown>;
  const email = asString(input.email).trim();

  const details: Record<string, string> = {};
  if (!email) details.email = 'Email is required';
  else if (!EMAIL_REGEX.test(email) || email.length > 150) details.email = 'Email is invalid';

  if (Object.keys(details).length > 0) {
    throw AppError.badRequest('Validation failed', details);
  }
  return { email };
};

const parseResetPasswordPayload = (body: unknown): ResetPasswordPayload => {
  const input = (body ?? {}) as Record<string, unknown>;
  const token = asString(input.token).trim();
  const newPassword = asString(input.newPassword);

  const details: Record<string, string> = {};
  if (!token) details.token = 'Reset token is required';

  if (!newPassword) details.newPassword = 'New password is required';
  else if (newPassword.length < MIN_PASSWORD_LENGTH)
    details.newPassword = `New password must be at least ${MIN_PASSWORD_LENGTH} characters`;

  if (Object.keys(details).length > 0) {
    throw AppError.badRequest('Validation failed', details);
  }
  return { token, newPassword };
};

const parseChangePasswordPayload = (body: unknown): ChangePasswordPayload => {
  const input = (body ?? {}) as Record<string, unknown>;
  const currentPassword = asString(input.currentPassword);
  const newPassword = asString(input.newPassword);

  const details: Record<string, string> = {};
  if (!currentPassword) details.currentPassword = 'Current password is required';

  if (!newPassword) details.newPassword = 'New password is required';
  else if (newPassword.length < MIN_PASSWORD_LENGTH)
    details.newPassword = `New password must be at least ${MIN_PASSWORD_LENGTH} characters`;

  if (Object.keys(details).length > 0) {
    throw AppError.badRequest('Validation failed', details);
  }
  return { currentPassword, newPassword };
};

/** POST /api/auth/forgot-password */
export const forgotPassword = async (
  req: Request,
  res: Response<ApiSuccess<ForgotPasswordResponse>>,
): Promise<void> => {
  const payload = parseForgotPasswordPayload(req.body);
  const result = await authService.forgotPassword(payload.email);
  res.status(200).json({ success: true, data: result, message: result.message });
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

/** PUT /api/auth/change-password */
export const changePassword = async (
  req: Request,
  res: Response<ApiSuccess<MessageResponse>>,
): Promise<void> => {
  if (!req.user) {
    throw AppError.unauthorized();
  }
  const payload = parseChangePasswordPayload(req.body);
  const result = await authService.changePassword(req.user.id, payload);
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
