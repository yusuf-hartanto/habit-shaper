import { useId, useState, type FormEvent } from 'react';
import { Modal } from './ui/Modal';
import { Alert } from './ui/Alert';
import { Spinner } from './ui/Spinner';
import { getErrorMessage } from '../api/client';
import type { Goal, GoalPayload, Habit } from '../types';

interface GoalFormModalProps {
  goal?: Goal;
  habits: Habit[];
  onClose: () => void;
  onSubmit: (payload: GoalPayload) => Promise<void>;
}

const TARGET_PRESETS = [7, 14, 21, 30, 60, 90];
const MAX_TARGET = 3650;

const typeLabel = (h: Pick<Habit, 'type'>) => (h.type === 'build' ? '[Build]' : '[Break]');

export function GoalFormModal({ goal, habits, onClose, onSubmit }: GoalFormModalProps) {
  const formId = useId();
  const [habitId, setHabitId] = useState(goal?.habit_id ?? habits[0]?.id ?? '');
  const [title, setTitle] = useState(goal?.title ?? '');
  const [target, setTarget] = useState(String(goal?.target_streak_days ?? 30));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selected = habits.find((h) => h.id === habitId);
  const buildHabits = habits.filter((h) => h.type === 'build');
  const breakHabits = habits.filter((h) => h.type === 'break');
  const targetNum = Number(target);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!habitId) return setError('Choose a habit to link this goal to.');
    if (!Number.isInteger(targetNum) || targetNum < 1 || targetNum > MAX_TARGET) {
      return setError(`Target must be a whole number between 1 and ${MAX_TARGET} days.`);
    }
    const finalTitle =
      title.trim() || `${targetNum} days ${selected?.type === 'break' ? 'without' : 'of'} ${selected?.title ?? 'my habit'}`;

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ title: finalTitle.slice(0, 150), habit_id: habitId, target_streak_days: targetNum });
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={goal ? 'Edit goal' : 'New goal'}
      description="Link a streak target to one of your habits."
      onClose={onClose}
      locked={submitting}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" form={formId} className="btn btn-primary" disabled={submitting}>
            {submitting && <Spinner className="size-4" />}
            {goal ? 'Save changes' : 'Create goal'}
          </button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <Alert onDismiss={() => setError(null)}>{error}</Alert>}

        <div>
          <label htmlFor={`${formId}-habit`} className="label">
            Linked habit
          </label>
          <select
            id={`${formId}-habit`}
            className="input appearance-auto"
            value={habitId}
            onChange={(e) => setHabitId(e.target.value)}
            required
          >
            {buildHabits.length > 0 && (
              <optgroup label="Habits to Build">
                {buildHabits.map((h) => (
                  <option key={h.id} value={h.id}>
                    {typeLabel(h)} {h.title}
                  </option>
                ))}
              </optgroup>
            )}
            {breakHabits.length > 0 && (
              <optgroup label="Habits to Break">
                {breakHabits.map((h) => (
                  <option key={h.id} value={h.id}>
                    {typeLabel(h)} {h.title}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          {selected && (
            <p className="mt-1.5 text-xs text-slate-500">
              Current streak: <span className="font-semibold text-slate-700">{selected.current_streak} days</span>
            </p>
          )}
        </div>

        <div>
          <label htmlFor={`${formId}-target`} className="label">
            Target streak (days)
          </label>
          <input
            id={`${formId}-target`}
            className="input tabular-nums"
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_TARGET}
            step={1}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            required
          />
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {TARGET_PRESETS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setTarget(String(n))}
                className={`chip ${
                  targetNum === n
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {n} days
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor={`${formId}-title`} className="label">
            Goal name <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            id={`${formId}-title`}
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={150}
            placeholder={
              selected
                ? `${targetNum || 30} days ${selected.type === 'break' ? 'without' : 'of'} ${selected.title}`
                : 'e.g. 30-day meditation challenge'
            }
          />
        </div>
      </form>
    </Modal>
  );
}
