import { useCallback, useEffect, useState } from 'react';
import { goalsApi, habitsApi } from '../api/services';
import { getErrorMessage } from '../api/client';
import type {
  CreateHabitPayload,
  Goal,
  GoalPayload,
  Habit,
  HabitFormValues,
  ToggleResult,
} from '../types';

/**
 * Dashboard data + mutations. Mutations throw on failure so callers can show
 * form errors or toasts. Goals are refetched after any habit change because
 * their progress is derived from the linked habit's streak.
 */
export function useDashboard() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [h, g] = await Promise.all([habitsApi.list(), goalsApi.list()]);
      setHabits(h);
      setGoals(g);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const refreshGoals = useCallback(async () => {
    try {
      setGoals(await goalsApi.list());
    } catch {
      // Non-critical: goals will refresh on next load.
    }
  }, []);

  const replaceHabit = (habit: Habit) =>
    setHabits((prev) => prev.map((h) => (h.id === habit.id ? habit : h)));

  // ---------- Habits ----------

  const createHabit = useCallback(async (payload: CreateHabitPayload): Promise<Habit> => {
    const habit = await habitsApi.create(payload);
    setHabits((prev) => [...prev, habit]);
    return habit;
  }, []);

  const updateHabit = useCallback(
    async (id: string, values: HabitFormValues): Promise<Habit> => {
      const habit = await habitsApi.update(id, values);
      replaceHabit(habit);
      void refreshGoals();
      return habit;
    },
    [refreshGoals],
  );

  const deleteHabit = useCallback(async (id: string): Promise<void> => {
    await habitsApi.remove(id);
    setHabits((prev) => prev.filter((h) => h.id !== id));
    setGoals((prev) => prev.filter((g) => g.habit_id !== id)); // cascaded server-side
  }, []);

  const toggleHabit = useCallback(
    async (id: string, date?: string): Promise<ToggleResult> => {
      const result = await habitsApi.toggle(id, date);
      replaceHabit(result.habit);
      void refreshGoals();
      return result;
    },
    [refreshGoals],
  );

  const relapseHabit = useCallback(
    async (id: string): Promise<Habit> => {
      const habit = await habitsApi.relapse(id);
      replaceHabit(habit);
      void refreshGoals();
      return habit;
    },
    [refreshGoals],
  );

  // ---------- Goals ----------

  const createGoal = useCallback(async (payload: GoalPayload): Promise<Goal> => {
    const goal = await goalsApi.create(payload);
    setGoals((prev) => [...prev, goal]);
    return goal;
  }, []);

  const updateGoal = useCallback(async (id: string, payload: GoalPayload): Promise<Goal> => {
    const goal = await goalsApi.update(id, payload);
    setGoals((prev) => prev.map((g) => (g.id === id ? goal : g)));
    return goal;
  }, []);

  const deleteGoal = useCallback(async (id: string): Promise<void> => {
    await goalsApi.remove(id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }, []);

  return {
    habits,
    goals,
    loading,
    error,
    reload: load,
    createHabit,
    updateHabit,
    deleteHabit,
    toggleHabit,
    relapseHabit,
    createGoal,
    updateGoal,
    deleteGoal,
  };
}
