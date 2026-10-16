import { validate as uuidValidate, version as uuidVersion } from 'uuid';
import type { Request } from 'express';
import { AppError } from './AppError';
import type { AuthTokenPayload } from '../types';

/** True for a valid UUID v4 string. */
export const isUuidV4 = (value: unknown): value is string =>
  typeof value === 'string' && uuidValidate(value) && uuidVersion(value) === 4;

/** Validates a route/body UUID, throwing 400 with a field-specific message. */
export const parseUuid = (value: unknown, field: string): string => {
  if (!isUuidV4(value)) {
    throw AppError.badRequest('Validation failed', { [field]: `${field} must be a valid UUID` });
  }
  return value;
};

/** Returns the authenticated user or throws 401 (for routes behind authMiddleware). */
export const requireUser = (req: Request): AuthTokenPayload => {
  if (!req.user) throw AppError.unauthorized();
  return req.user;
};

/** Narrows an unknown request body to a plain record. */
export const asRecord = (body: unknown): Record<string, unknown> =>
  typeof body === 'object' && body !== null && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : {};

/** Throws a 400 if any validation details were collected. */
export const assertNoErrors = (details: Record<string, string>): void => {
  if (Object.keys(details).length > 0) {
    throw AppError.badRequest('Validation failed', details);
  }
};
