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

export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface MessageResponse {
  message: string;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message?: string;
  error: {
    message: string;
    details?: Record<string, string>;
  };
}

// ---------------------------------------------------------------------------
// Habits
// ---------------------------------------------------------------------------

export type HabitTypeValue = 'build' | 'break';

/** One day in the 7-day window. */
export interface DayStatus {
  /** UTC calendar date `YYYY-MM-DD`. */
  date: string;
  /** build: checked in that day. break: a clean day (on/after start, no relapse). */
  completed: boolean;
  /** break only: a relapse was recorded that day. Always false for build. */
  relapsed: boolean;
}

export interface WeeklyStats {
  completed_days: number;
  missed_days: number;
  /** 0–100, `Math.round(completed_days / 7 * 100)`. */
  completion_rate: number;
  /** Oldest → newest, ending today. */
  last_7_days: DayStatus[];
}

export interface HabitMetrics {
  current_streak: number;
  completed_today: boolean;
  relapsed_today: boolean;
  weekly_stats: WeeklyStats;
}

export interface HabitResponse extends HabitMetrics {
  id: string;
  title: string;
  description: string | null;
  type: HabitTypeValue;
  last_reset_date: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateHabitPayload {
  title: string;
  description: string | null;
  type: HabitTypeValue;
}

export interface UpdateHabitPayload {
  title?: string;
  description?: string | null;
}

export interface ToggleResult {
  date: string;
  completed: boolean;
  habit: HabitResponse;
}

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

export interface GoalResponse {
  id: string;
  title: string;
  habit_id: string;
  habit_title: string;
  habit_type: HabitTypeValue;
  target_streak_days: number;
  current_streak: number;
  is_achieved: boolean;
  /** 0–100, capped at 100 once achieved. */
  progress_percentage: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateGoalPayload {
  title: string;
  habit_id: string;
  target_streak_days: number;
}

export interface UpdateGoalPayload {
  title?: string;
  habit_id?: string;
  target_streak_days?: number;
}
