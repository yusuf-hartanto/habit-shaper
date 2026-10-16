import { useId, useState, type FormEvent } from 'react';
import { Ban, Sprout } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Alert } from './ui/Alert';
import { Spinner } from './ui/Spinner';
import { getErrorMessage } from '../api/client';
import type { Habit, HabitFormValues, HabitType } from '../types';

export type HabitFormState =
  | { mode: 'create'; type: HabitType }
  | { mode: 'edit'; habit: Habit };

interface HabitFormModalProps {
  state: HabitFormState;
  onClose: () => void;
  onSubmit: (values: HabitFormValues) => Promise<void>;
}

const SUGGESTIONS: Record<HabitType, string[]> = {
  build: ['Meditate 10 min', 'Exercise 30 min', 'Read 20 pages', 'Learn Mandarin', 'Drink 2L water'],
  break: ['Smoking', 'Junk food', 'Doomscrolling', 'Late-night snacking', 'Sugary drinks'],
};

export function HabitFormModal({ state, onClose, onSubmit }: HabitFormModalProps) {
  const formId = useId();
  const type: HabitType = state.mode === 'create' ? state.type : state.habit.type;
  const initial = state.mode === 'edit' ? state.habit : null;

  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isBuild = type === 'build';
  const heading =
    state.mode === 'create' ? (isBuild ? 'New habit to build' : 'New habit to break') : 'Edit habit';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Please give your habit a name.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ title: trimmed, description: description.trim() || null });
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={heading}
      description={
        isBuild
          ? 'A positive routine you want to do every day.'
          : 'Something you want to quit — we’ll count your clean days.'
      }
      onClose={onClose}
      locked={submitting}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" form={formId} className="btn btn-primary" disabled={submitting}>
            {submitting && <Spinner className="size-4" />}
            {state.mode === 'create' ? 'Create habit' : 'Save changes'}
          </button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <Alert onDismiss={() => setError(null)}>{error}</Alert>}

        <div
          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${
            isBuild ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
          }`}
        >
          {isBuild ? <Sprout className="size-4" /> : <Ban className="size-4" />}
          {isBuild ? 'Habit to build' : 'Habit to break'}
        </div>

        <div>
          <label htmlFor={`${formId}-title`} className="label">
            {isBuild ? 'What do you want to do daily?' : 'What do you want to quit?'}
          </label>
          <input
            id={`${formId}-title`}
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={150}
            placeholder={isBuild ? 'e.g. Meditate 10 minutes' : 'e.g. Doomscrolling'}
            required
          />
          {state.mode === 'create' && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {SUGGESTIONS[type].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTitle(s)}
                  className={`chip ${
                    title === s
                      ? isBuild
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-rose-500 bg-rose-50 text-rose-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor={`${formId}-desc`} className="label">
            Notes <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            id={`${formId}-desc`}
            className="input min-h-20 resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={isBuild ? 'Why does this matter to you?' : 'What triggers it? What will you do instead?'}
            rows={3}
          />
        </div>
      </form>
    </Modal>
  );
}
