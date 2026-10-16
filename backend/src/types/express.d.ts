import type { AuthTokenPayload } from './index';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Set by authMiddleware after a valid Bearer token is verified. */
      user?: AuthTokenPayload;
    }
  }
}

export {};
