/** Claims embedded in every issued JWT. */
export interface AuthTokenPayload {
  id: string;
  email: string;
}

/** Public user profile (never includes password_hash). */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    message: string;
    details?: Record<string, string>;
  };
}
