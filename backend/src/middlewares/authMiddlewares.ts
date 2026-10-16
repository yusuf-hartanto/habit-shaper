import type { NextFunction, Request, Response } from 'express';
import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import type { AuthTokenPayload } from '../types';

const isAuthTokenPayload = (value: unknown): value is AuthTokenPayload =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as Record<string, unknown>).id === 'string' &&
  typeof (value as Record<string, unknown>).email === 'string';

/**
 * Verifies `Authorization: Bearer <token>` and attaches the decoded payload to `req.user`.
 */
export const authMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(AppError.unauthorized('Missing or malformed Authorization header'));
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    return next(AppError.unauthorized('Missing access token'));
  }

  try {
    const decoded = jwt.verify(token, env.jwt.secret);
    if (!isAuthTokenPayload(decoded)) {
      return next(AppError.unauthorized('Invalid token payload'));
    }
    req.user = { id: decoded.id, email: decoded.email };
    return next();
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      return next(AppError.unauthorized('Token has expired'));
    }
    if (err instanceof JsonWebTokenError) {
      return next(AppError.unauthorized('Invalid token'));
    }
    return next(err);
  }
};
