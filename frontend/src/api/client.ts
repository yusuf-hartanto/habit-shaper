import axios, { type AxiosResponse } from 'axios';
import type { ApiErrorBody, ApiSuccess } from '../types';

const TOKEN_KEY = 'habit_shaper_token';

/** Fired on `window` when an authenticated request returns 401 (expired/invalid token). */
export const AUTH_EXPIRED_EVENT = 'habit-shaper:auth-expired';

export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  clear: (): void => localStorage.removeItem(TOKEN_KEY),
};

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach the JWT to every request.
api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Clear the session when the server rejects our token.
const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/reset-password', '/auth/forgot-password'];

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url ?? '';
      const isPublicAuthCall = PUBLIC_AUTH_PATHS.some((p) => url.endsWith(p));
      if (!isPublicAuthCall && tokenStorage.get()) {
        tokenStorage.clear();
        window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
      }
    }
    return Promise.reject(error);
  },
);

/** Unwraps the `{ success, data }` envelope. */
export const unwrap = async <T>(request: Promise<AxiosResponse<ApiSuccess<T>>>): Promise<T> =>
  (await request).data.data;

/** Human-readable message from any API/network error. */
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) {
      return error.code === 'ECONNABORTED'
        ? 'The server took too long to respond. Please try again.'
        : 'Cannot reach the server. Check your connection and try again.';
    }
    const body = error.response.data;
    const details = body?.error?.details;
    if (details && Object.keys(details).length > 0) {
      return Object.values(details).join(' • ');
    }
    if (body?.error?.message) return body.error.message;
    if (typeof (body as unknown as Record<string, unknown>)?.message === 'string') {
      return (body as unknown as Record<string, unknown>).message as string;
    }
    return `Request failed (${error.response.status})`;
  }
  return error instanceof Error ? error.message : 'Something went wrong';
};
