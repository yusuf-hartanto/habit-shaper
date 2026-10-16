/** Types mirroring the backend REST API (backend/src/types/index.ts). */

export type HabitType = 'build' | 'break';

export interface User {
  id: string;
  name: string;
  email: string;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface MessageResponse {
  message: string;
}

/** One day in the rolling 7-day window (UTC `YYYY-MM-DD`). */
export interface DayStatus {
  date: string;
  /** build: checked in. break: clean day (on/after start, no relapse). */
  completed: boolean;
  /** break only: relapse recorded that day. */
  relapsed: boolean;
}

export interface WeeklyStats {
  completed_days: number;
  missed_days: number;
  /** 0–100 */
  completion_rate: number;
  /** Oldest → newest, ending today. */
  last_7_days: DayStatus[];
}

export interface Habit {
  id: string;
  title: string;
  description: string | null;
  type: HabitType;
  last_reset_date: string;
  created_at: string;
  updated_at: string;
  current_streak: number;
  completed_today: boolean;
  relapsed_today: boolean;
  weekly_stats: WeeklyStats;
}

export interface Goal {
  id: string;
  title: string;
  habit_id: string;
  habit_title: string;
  habit_type: HabitType;
  target_streak_days: number;
  current_streak: number;
  is_achieved: boolean;
  /** 0–100, capped. */
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface ToggleResult {
  date: string;
  completed: boolean;
  habit: Habit;
}

// ---------- Envelopes ----------

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorBody {
  success: false;
  error: {
    message: string;
    details?: Record<string, string>;
  };
}

// ---------- Payloads ----------

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  name: string;
}

export interface HabitFormValues {
  title: string;
  description: string | null;
}

export interface CreateHabitPayload extends HabitFormValues {
  type: HabitType;
}

export interface GoalPayload {
  title: string;
  habit_id: string;
  target_streak_days: number;
}
