/**
 * Pure streak & weekly-stat calculations (no DB access) so they are deterministic
 * and easy to unit test. All dates are UTC `YYYY-MM-DD` strings.
 */
import type { HabitLogType, HabitType } from '../models';
import type { DayStatus, HabitMetrics, WeeklyStats } from '../types';
import { daysBetween, getPastNDaysStrings, subtractDays, toDateString } from '../utils/dateUtils';

export const WEEK_WINDOW_DAYS = 7;

export interface StreakHabitInput {
  type: HabitType;
  last_reset_date: string;
  created_at: Date;
}

export interface StreakLogInput {
  log_date: string;
  log_type: HabitLogType;
}

/**
 * Build habit: consecutive completed days counting back from today, or from
 * yesterday if today isn't completed yet. 0 if neither today nor yesterday is completed.
 */
export const calculateBuildStreak = (completedDates: ReadonlySet<string>, today: string): number => {
  let cursor = completedDates.has(today) ? today : subtractDays(today, 1);
  let streak = 0;
  while (completedDates.has(cursor)) {
    streak += 1;
    cursor = subtractDays(cursor, 1);
  }
  return streak;
};

/**
 * Break habit clean streak, counted from `last_reset_date`:
 * - relapse today -> 0
 * - `last_reset_date` was a relapse day -> days since that relapse
 * - otherwise (`last_reset_date` is the creation day) -> creation day counts as Day 1
 */
export const calculateBreakStreak = (
  lastResetDate: string,
  relapseDates: ReadonlySet<string>,
  today: string,
): number => {
  if (relapseDates.has(today)) return 0;
  const diff = daysBetween(lastResetDate, today);
  if (diff < 0) return 0;
  return relapseDates.has(lastResetDate) ? diff : diff + 1;
};

/**
 * 7-day window (today-6 .. today).
 * - build: a day counts if it was completed.
 * - break: a day counts if it's on/after the habit's start and had no relapse.
 */
export const calculateWeeklyStats = (
  habit: StreakHabitInput,
  completedDates: ReadonlySet<string>,
  relapseDates: ReadonlySet<string>,
  today: string,
): WeeklyStats => {
  const startDate = toDateString(habit.created_at);

  const last_7_days: DayStatus[] = getPastNDaysStrings(WEEK_WINDOW_DAYS, today).map((date) => {
    if (habit.type === 'build') {
      return { date, completed: completedDates.has(date), relapsed: false };
    }
    const relapsed = relapseDates.has(date);
    return { date, completed: date >= startDate && !relapsed, relapsed };
  });

  const completed_days = last_7_days.filter((d) => d.completed).length;
  return {
    completed_days,
    missed_days: WEEK_WINDOW_DAYS - completed_days,
    completion_rate: Math.round((completed_days / WEEK_WINDOW_DAYS) * 100),
    last_7_days,
  };
};

/** All derived metrics for one habit given its logs. */
export const computeHabitMetrics = (
  habit: StreakHabitInput,
  logs: readonly StreakLogInput[],
  today: string,
): HabitMetrics => {
  const completedDates = new Set<string>();
  const relapseDates = new Set<string>();
  for (const log of logs) {
    (log.log_type === 'completed' ? completedDates : relapseDates).add(log.log_date);
  }

  const current_streak =
    habit.type === 'build'
      ? calculateBuildStreak(completedDates, today)
      : calculateBreakStreak(habit.last_reset_date, relapseDates, today);

  return {
    current_streak,
    completed_today: habit.type === 'build' && completedDates.has(today),
    relapsed_today: habit.type === 'break' && relapseDates.has(today),
    weekly_stats: calculateWeeklyStats(habit, completedDates, relapseDates, today),
  };
};
