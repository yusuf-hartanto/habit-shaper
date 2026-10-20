import type { NextFunction, Request, Response } from 'express';
import { UniqueConstraintError, ValidationError } from 'sequelize';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import type { ApiError } from '../types';

/** 404 for unmatched routes. */
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};

interface BodyParserError extends SyntaxError {
  status?: number;
  type?: string;
}

const isJsonParseError = (err: unknown): err is BodyParserError =>
  err instanceof SyntaxError && (err as BodyParserError).type === 'entity.parse.failed';

/** Centralized error handler producing a consistent `ApiError` body. */
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response<ApiError>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: { message: err.message, details: err.details },
    });
    return;
  }

  if (isJsonParseError(err)) {
    res.status(400).json({
      success: false,
      message: 'Malformed JSON request body',
      error: { message: 'Malformed JSON request body' },
    });
    return;
  }

  if (err instanceof UniqueConstraintError) {
    res.status(409).json({ success: false, error: { message: 'Resource already exists' } });
    return;
  }

  if (err instanceof ValidationError) {
    const details: Record<string, string> = {};
    err.errors.forEach((e) => {
      if (e.path) details[e.path] = e.message;
    });
    res.status(400).json({ success: false, error: { message: 'Validation failed', details } });
    return;
  }

  console.error('[error]', err);
  const message =
    !env.isProduction && err instanceof Error ? err.message : 'Internal server error';
  res.status(500).json({ success: false, error: { message } });
};
