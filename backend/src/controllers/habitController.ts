import type { Request, Response } from 'express';
import * as habitService from '../services/habitService';
import { AppError } from '../utils/AppError';
import { isValidDateString } from '../utils/dateUtils';
import { asRecord, assertNoErrors, parseUuid, requireUser } from '../utils/validation';
import type {
  ApiSuccess,
  CreateHabitPayload,
  HabitResponse,
  HabitTypeValue,
  ToggleResult,
  UpdateHabitPayload,
} from '../types';

const HABIT_TYPES: readonly HabitTypeValue[] = ['build', 'break'];
const isHabitType = (v: unknown): v is HabitTypeValue =>
  typeof v === 'string' && (HABIT_TYPES as readonly string[]).includes(v);

const validateTitle = (value: unknown, details: Record<string, string>): string | undefined => {
  if (typeof value !== 'string' || !value.trim()) {
    details.title = 'Title is required';
    return undefined;
  }
  const title = value.trim();
  if (title.length > 150) details.title = 'Title must be at most 150 characters';
  return title;
};

/** `undefined` = not provided, `null`/empty = clear, string = set. */
const validateDescription = (
  value: unknown,
  details: Record<string, string>,
): string | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') {
    details.description = 'Description must be a string';
    return undefined;
  }
  return value.trim() || null;
};

// ---------------------------------------------------------------------------

/** GET /api/habits?type=build|break */
export const list = async (req: Request, res: Response<ApiSuccess<HabitResponse[]>>) => {
  const user = requireUser(req);
  const { type } = req.query;
  if (type !== undefined && !isHabitType(type)) {
    throw AppError.badRequest('Validation failed', { type: "type must be 'build' or 'break'" });
  }
  res.json({ success: true, data: await habitService.listHabits(user.id, type) });
};

/** POST /api/habits */
export const create = async (req: Request, res: Response<ApiSuccess<HabitResponse>>) => {
  const user = requireUser(req);
  const body = asRecord(req.body);
  const details: Record<string, string> = {};

  const title = validateTitle(body.title, details);
  const description = validateDescription(body.description, details);
  if (!isHabitType(body.type)) details.type = "type must be 'build' or 'break'";
  assertNoErrors(details);

  const payload: CreateHabitPayload = {
    title: title as string,
    description: description ?? null,
    type: body.type as HabitTypeValue,
  };
  const habit = await habitService.createHabit(user.id, payload);
  res.status(201).json({ success: true, data: habit, message: 'Habit created' });
};

/** PUT /api/habits/:id */
export const update = async (req: Request, res: Response<ApiSuccess<HabitResponse>>) => {
  const user = requireUser(req);
  const id = parseUuid(req.params.id, 'id');
  const body = asRecord(req.body);
  const details: Record<string, string> = {};
  const payload: UpdateHabitPayload = {};

  if (body.title !== undefined) payload.title = validateTitle(body.title, details);
  const description = validateDescription(body.description, details);
  if (description !== undefined) payload.description = description;
  if (body.type !== undefined) details.type = 'Habit type cannot be changed';
  if (body.title === undefined && body.description === undefined && body.type === undefined) {
    details.body = 'Provide at least one of: title, description';
  }
  assertNoErrors(details);

  const habit = await habitService.updateHabit(user.id, id, payload);
  res.json({ success: true, data: habit, message: 'Habit updated' });
};

/** DELETE /api/habits/:id */
export const remove = async (req: Request, res: Response<ApiSuccess<{ id: string }>>) => {
  const user = requireUser(req);
  const id = parseUuid(req.params.id, 'id');
  await habitService.deleteHabit(user.id, id);
  res.json({ success: true, data: { id }, message: 'Habit deleted' });
};

/** POST /api/habits/:id/toggle  body: { date?: 'YYYY-MM-DD' } */
export const toggle = async (req: Request, res: Response<ApiSuccess<ToggleResult>>) => {
  const user = requireUser(req);
  const id = parseUuid(req.params.id, 'id');
  const { date } = asRecord(req.body);
  if (date !== undefined && !isValidDateString(date)) {
    throw AppError.badRequest('Validation failed', { date: 'date must be a valid YYYY-MM-DD date' });
  }

  const result = await habitService.toggleCompletion(user.id, id, date);
  res.json({
    success: true,
    data: result,
    message: result.completed ? 'Marked as completed' : 'Completion removed',
  });
};

/** POST /api/habits/:id/relapse  body: { notes?: string } */
export const relapse = async (req: Request, res: Response<ApiSuccess<HabitResponse>>) => {
  const user = requireUser(req);
  const id = parseUuid(req.params.id, 'id');
  const { notes } = asRecord(req.body);
  const details: Record<string, string> = {};

  let parsedNotes: string | null = null;
  if (notes !== undefined && notes !== null) {
    if (typeof notes !== 'string') details.notes = 'notes must be a string';
    else if (notes.trim().length > 255) details.notes = 'notes must be at most 255 characters';
    else parsedNotes = notes.trim() || null;
  }
  assertNoErrors(details);

  const habit = await habitService.recordRelapse(user.id, id, parsedNotes);
  res.json({ success: true, data: habit, message: 'Relapse recorded, clean streak reset' });
};
