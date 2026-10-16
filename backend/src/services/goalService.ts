import { Goal, Habit } from '../models';
import { AppError } from '../utils/AppError';
import { computeMetricsForHabits, findOwnedHabit } from './habitService';
import type { CreateGoalPayload, GoalResponse, UpdateGoalPayload } from '../types';

type GoalWithHabit = Goal & { habit: Habit };

const serializeGoal = (goal: GoalWithHabit, currentStreak: number): GoalResponse => {
  const target = goal.target_streak_days;
  return {
    id: goal.id,
    title: goal.title,
    habit_id: goal.habit_id,
    habit_title: goal.habit.title,
    habit_type: goal.habit.type,
    target_streak_days: target,
    current_streak: currentStreak,
    is_achieved: currentStreak >= target,
    progress_percentage: target > 0 ? Math.min(100, Math.round((currentStreak / target) * 100)) : 0,
    created_at: goal.created_at,
    updated_at: goal.updated_at,
  };
};

/** Enriches goals with their linked habit's live streak (one log query total). */
const enrichGoals = async (goals: GoalWithHabit[]): Promise<GoalResponse[]> => {
  const uniqueHabits = [...new Map(goals.map((g) => [g.habit.id, g.habit])).values()];
  const metrics = await computeMetricsForHabits(uniqueHabits);
  return goals.map((g) => serializeGoal(g, metrics.get(g.habit.id)?.current_streak ?? 0));
};

const findOwnedGoal = async (userId: string, goalId: string): Promise<GoalWithHabit> => {
  const goal = await Goal.findOne({
    where: { id: goalId, user_id: userId },
    include: [{ model: Habit, as: 'habit', required: true }],
  });
  if (!goal) throw AppError.notFound('Goal not found');
  return goal as GoalWithHabit;
};

const getGoal = async (userId: string, goalId: string): Promise<GoalResponse> => {
  const [goal] = await enrichGoals([await findOwnedGoal(userId, goalId)]);
  return goal;
};

export const listGoals = async (userId: string): Promise<GoalResponse[]> => {
  const goals = await Goal.findAll({
    where: { user_id: userId },
    include: [{ model: Habit, as: 'habit', required: true }],
    order: [['created_at', 'ASC']],
  });
  return enrichGoals(goals as GoalWithHabit[]);
};

export const createGoal = async (
  userId: string,
  payload: CreateGoalPayload,
): Promise<GoalResponse> => {
  // Ensures the habit exists and belongs to this user.
  await findOwnedHabit(userId, payload.habit_id);

  const goal = await Goal.create({
    user_id: userId,
    habit_id: payload.habit_id,
    title: payload.title,
    target_streak_days: payload.target_streak_days,
  });
  return getGoal(userId, goal.id);
};

export const updateGoal = async (
  userId: string,
  goalId: string,
  payload: UpdateGoalPayload,
): Promise<GoalResponse> => {
  const goal = await findOwnedGoal(userId, goalId);

  if (payload.habit_id !== undefined && payload.habit_id !== goal.habit_id) {
    await findOwnedHabit(userId, payload.habit_id);
    goal.habit_id = payload.habit_id;
  }
  if (payload.title !== undefined) goal.title = payload.title;
  if (payload.target_streak_days !== undefined) goal.target_streak_days = payload.target_streak_days;

  await goal.save();
  return getGoal(userId, goal.id);
};

export const deleteGoal = async (userId: string, goalId: string): Promise<void> => {
  const goal = await findOwnedGoal(userId, goalId);
  await goal.destroy();
};
