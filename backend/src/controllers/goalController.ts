import type { Request, Response } from 'express';
import * as goalService from '../services/goalService';
import { asRecord, assertNoErrors, isUuidV4, parseUuid, requireUser } from '../utils/validation';
import type { ApiSuccess, CreateGoalPayload, GoalResponse, UpdateGoalPayload } from '../types';

const DEFAULT_TARGET_DAYS = 7;
const MAX_TARGET_DAYS = 3650;

const validateTitle = (value: unknown, details: Record<string, string>): string | undefined => {
  if (typeof value !== 'string' || !value.trim()) {
    details.title = 'Title is required';
    return undefined;
  }
  const title = value.trim();
  if (title.length > 150) details.title = 'Title must be at most 150 characters';
  return title;
};

const validateTarget = (value: unknown, details: Record<string, string>): number | undefined => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > MAX_TARGET_DAYS) {
    details.target_streak_days = `target_streak_days must be an integer between 1 and ${MAX_TARGET_DAYS}`;
    return undefined;
  }
  return value;
};

const validateHabitId = (value: unknown, details: Record<string, string>): string | undefined => {
  if (!isUuidV4(value)) {
    details.habit_id = 'habit_id must be a valid UUID';
    return undefined;
  }
  return value;
};

// ---------------------------------------------------------------------------

/** GET /api/goals */
export const list = async (req: Request, res: Response<ApiSuccess<GoalResponse[]>>) => {
  const user = requireUser(req);
  res.json({ success: true, data: await goalService.listGoals(user.id) });
};

/** POST /api/goals */
export const create = async (req: Request, res: Response<ApiSuccess<GoalResponse>>) => {
  const user = requireUser(req);
  const body = asRecord(req.body);
  const details: Record<string, string> = {};

  const title = validateTitle(body.title, details);
  const habitId = validateHabitId(body.habit_id, details);
  const target =
    body.target_streak_days === undefined
      ? DEFAULT_TARGET_DAYS
      : validateTarget(body.target_streak_days, details);
  assertNoErrors(details);

  const payload: CreateGoalPayload = {
    title: title as string,
    habit_id: habitId as string,
    target_streak_days: target as number,
  };
  const goal = await goalService.createGoal(user.id, payload);
  res.status(201).json({ success: true, data: goal, message: 'Goal created' });
};

/** PUT /api/goals/:id */
export const update = async (req: Request, res: Response<ApiSuccess<GoalResponse>>) => {
  const user = requireUser(req);
  const id = parseUuid(req.params.id, 'id');
  const body = asRecord(req.body);
  const details: Record<string, string> = {};
  const payload: UpdateGoalPayload = {};

  if (body.title !== undefined) payload.title = validateTitle(body.title, details);
  if (body.habit_id !== undefined) payload.habit_id = validateHabitId(body.habit_id, details);
  if (body.target_streak_days !== undefined) {
    payload.target_streak_days = validateTarget(body.target_streak_days, details);
  }
  if (Object.keys(payload).length === 0 && Object.keys(details).length === 0) {
    details.body = 'Provide at least one of: title, habit_id, target_streak_days';
  }
  assertNoErrors(details);

  const goal = await goalService.updateGoal(user.id, id, payload);
  res.json({ success: true, data: goal, message: 'Goal updated' });
};

/** DELETE /api/goals/:id */
export const remove = async (req: Request, res: Response<ApiSuccess<{ id: string }>>) => {
  const user = requireUser(req);
  const id = parseUuid(req.params.id, 'id');
  await goalService.deleteGoal(user.id, id);
  res.json({ success: true, data: { id }, message: 'Goal deleted' });
};
