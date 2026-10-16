import type { Transaction } from 'sequelize';
import { Habit, HabitLog, sequelize } from '../models';
import type { HabitType } from '../models';
import { AppError } from '../utils/AppError';
import { getTodayDateString } from '../utils/dateUtils';
import { computeHabitMetrics, type StreakLogInput } from './streakService';
import type {
  CreateHabitPayload,
  HabitMetrics,
  HabitResponse,
  ToggleResult,
  UpdateHabitPayload,
} from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const serializeHabit = (habit: Habit, metrics: HabitMetrics): HabitResponse => ({
  id: habit.id,
  title: habit.title,
  description: habit.description,
  type: habit.type,
  last_reset_date: habit.last_reset_date,
  created_at: habit.created_at,
  updated_at: habit.updated_at,
  ...metrics,
});

/** Loads a habit owned by `userId`, or throws 404 (no cross-user leakage). */
export const findOwnedHabit = async (
  userId: string,
  habitId: string,
  transaction?: Transaction,
): Promise<Habit> => {
  const habit = await Habit.findOne({
    where: { id: habitId, user_id: userId },
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });
  if (!habit) throw AppError.notFound('Habit not found');
  return habit;
};

/** Computes metrics for many habits with a single log query. */
export const computeMetricsForHabits = async (
  habits: readonly Habit[],
  today: string = getTodayDateString(),
): Promise<Map<string, HabitMetrics>> => {
  const result = new Map<string, HabitMetrics>();
  if (habits.length === 0) return result;

  const logs = await HabitLog.findAll({
    where: { habit_id: habits.map((h) => h.id) },
    attributes: ['habit_id', 'log_date', 'log_type'],
    raw: true,
  });

  const logsByHabit = new Map<string, StreakLogInput[]>();
  for (const log of logs) {
    const list = logsByHabit.get(log.habit_id) ?? [];
    list.push({ log_date: log.log_date, log_type: log.log_type });
    logsByHabit.set(log.habit_id, list);
  }

  for (const habit of habits) {
    result.set(habit.id, computeHabitMetrics(habit, logsByHabit.get(habit.id) ?? [], today));
  }
  return result;
};

const enrichHabit = async (habit: Habit): Promise<HabitResponse> => {
  const metrics = await computeMetricsForHabits([habit]);
  return serializeHabit(habit, metrics.get(habit.id) as HabitMetrics);
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const listHabits = async (userId: string, type?: HabitType): Promise<HabitResponse[]> => {
  const habits = await Habit.findAll({
    where: type ? { user_id: userId, type } : { user_id: userId },
    order: [['created_at', 'ASC']],
  });
  const metrics = await computeMetricsForHabits(habits);
  return habits.map((h) => serializeHabit(h, metrics.get(h.id) as HabitMetrics));
};

export const getHabit = async (userId: string, habitId: string): Promise<HabitResponse> =>
  enrichHabit(await findOwnedHabit(userId, habitId));

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const createHabit = async (
  userId: string,
  payload: CreateHabitPayload,
): Promise<HabitResponse> => {
  const habit = await Habit.create({
    user_id: userId,
    title: payload.title,
    description: payload.description,
    type: payload.type,
    // Clean streak for break habits starts on the creation day (Day 1).
    last_reset_date: getTodayDateString(),
  });
  return enrichHabit(habit);
};

export const updateHabit = async (
  userId: string,
  habitId: string,
  payload: UpdateHabitPayload,
): Promise<HabitResponse> => {
  const habit = await findOwnedHabit(userId, habitId);
  if (payload.title !== undefined) habit.title = payload.title;
  if (payload.description !== undefined) habit.description = payload.description;
  await habit.save();
  return enrichHabit(habit);
};

/** Deletes the habit; logs and goals are removed by ON DELETE CASCADE. */
export const deleteHabit = async (userId: string, habitId: string): Promise<void> => {
  const habit = await findOwnedHabit(userId, habitId);
  await habit.destroy();
};

/** Toggles a `completed` log for a build habit on `date` (defaults to today). */
export const toggleCompletion = async (
  userId: string,
  habitId: string,
  date: string = getTodayDateString(),
): Promise<ToggleResult> => {
  if (date > getTodayDateString()) {
    throw AppError.badRequest('Validation failed', { date: 'date cannot be in the future' });
  }

  const { habit, completed } = await sequelize.transaction(async (transaction) => {
    const owned = await findOwnedHabit(userId, habitId, transaction);
    if (owned.type !== 'build') {
      throw AppError.badRequest('Only build habits can be toggled');
    }

    const where = { habit_id: owned.id, log_date: date, log_type: 'completed' as const };
    const existing = await HabitLog.findOne({ where, transaction });
    if (existing) {
      await existing.destroy({ transaction });
      return { habit: owned, completed: false };
    }
    await HabitLog.create(where, { transaction });
    return { habit: owned, completed: true };
  });

  return { date, completed, habit: await enrichHabit(habit) };
};

/**
 * Records today's relapse for a break habit and resets its clean streak.
 * Idempotent: a second relapse on the same day keeps a single log.
 */
export const recordRelapse = async (
  userId: string,
  habitId: string,
  notes: string | null,
): Promise<HabitResponse> => {
  const today = getTodayDateString();

  const habit = await sequelize.transaction(async (transaction) => {
    const owned = await findOwnedHabit(userId, habitId, transaction);
    if (owned.type !== 'break') {
      throw AppError.badRequest('Only break habits can record a relapse');
    }

    const [log, created] = await HabitLog.findOrCreate({
      where: { habit_id: owned.id, log_date: today, log_type: 'relapse' },
      defaults: { habit_id: owned.id, log_date: today, log_type: 'relapse', notes },
      transaction,
    });
    if (!created && notes !== null) {
      log.notes = notes;
      await log.save({ transaction });
    }

    owned.last_reset_date = today;
    await owned.save({ transaction });
    return owned;
  });

  return enrichHabit(habit);
};
