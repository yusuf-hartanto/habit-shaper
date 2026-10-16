import { useState } from 'react';
import { Ban, Plus, Sprout, Target } from 'lucide-react';
import type { Goal, GoalPayload, Habit } from '../types';
import { CardActions } from './CardActions';
import { EmptyState } from './ui/EmptyState';
import { GoalFormModal } from './GoalFormModal';

interface GoalSectionProps {
  goals: Goal[];
  habits: Habit[];
  onCreate: (payload: GoalPayload) => Promise<void>;
  onUpdate: (id: string, payload: GoalPayload) => Promise<void>;
  /** Opens the delete confirmation (handled by the dashboard). */
  onRequestDelete: (goal: Goal) => void;
}

type FormState = { mode: 'create' } | { mode: 'edit'; goal: Goal } | null;

function GoalCard({ goal, onEdit, onDelete }: { goal: Goal; onEdit: () => void; onDelete: () => void }) {
  const isBuild = goal.habit_type === 'build';
  const pct = goal.progress_percentage;

  return (
    <article
      className={`card group flex animate-slide-up flex-col p-5 transition-shadow hover:shadow-lg hover:shadow-slate-200/60 ${
        goal.is_achieved ? 'ring-2 ring-emerald-200' : ''
      }`}
    >
      <header className="flex items-start gap-3">
        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
            goal.is_achieved ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
          }`}
        >
          <Target className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-semibold text-slate-900">{goal.title}</h3>
          <span
            className={`mt-1 inline-flex max-w-full items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium ${
              isBuild ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}
          >
            {isBuild ? <Sprout className="size-3 shrink-0" /> : <Ban className="size-3 shrink-0" />}
            <span className="truncate">
              {isBuild ? '[Build]' : '[Break]'} {goal.habit_title}
            </span>
          </span>
        </div>
        <CardActions label={goal.title} onEdit={onEdit} onDelete={onDelete} />
      </header>

      <div className="mt-auto pt-5">
        <div className="mb-2 flex items-end justify-between gap-2">
          <p className="text-sm text-slate-600">
            <span className="text-xl font-bold tabular-nums text-slate-900">{goal.current_streak}</span>
            <span className="text-slate-400"> / {goal.target_streak_days} days</span>
          </p>
          {goal.is_achieved ? (
            <span className="animate-pop rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm shadow-emerald-500/30">
              Achieved 🎉
            </span>
          ) : (
            <span className="text-xs font-semibold tabular-nums text-indigo-600">{pct}%</span>
          )}
        </div>
        <div
          className="h-2.5 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={goal.target_streak_days}
          aria-valuenow={Math.min(goal.current_streak, goal.target_streak_days)}
          aria-label={`${goal.title} progress`}
        >
          <div
            className={`h-full rounded-full transition-[width] duration-700 ease-out ${
              goal.is_achieved
                ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                : 'bg-gradient-to-r from-indigo-500 to-violet-500'
            }`}
            style={{ width: `${Math.max(pct, goal.current_streak > 0 ? 3 : 0)}%` }}
          />
        </div>
        {!goal.is_achieved && (
          <p className="mt-2 text-xs text-slate-500">
            {goal.target_streak_days - goal.current_streak} more{' '}
            {goal.target_streak_days - goal.current_streak === 1 ? 'day' : 'days'} to go
          </p>
        )}
      </div>
    </article>
  );
}

export function GoalSection({ goals, habits, onCreate, onUpdate, onRequestDelete }: GoalSectionProps) {
  const [form, setForm] = useState<FormState>(null);
  const noHabits = habits.length === 0;

  return (
    <section aria-labelledby="goals-heading" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="goals-heading" className="text-lg font-semibold text-slate-900">
            Goals
          </h2>
          <p className="text-sm text-slate-500">Streak targets linked to your habits.</p>
        </div>
        <button
          id="add-goal-button"
          type="button"
          className="btn btn-primary w-full sm:w-auto"
          onClick={() => setForm({ mode: 'create' })}
          disabled={noHabits}
          title={noHabits ? 'Create a habit first' : undefined}
        >
          <Plus className="size-4" aria-hidden="true" />
          New goal
        </button>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          accent="indigo"
          title={noHabits ? 'Create a habit first' : 'No goals yet'}
          description={
            noHabits
              ? 'Goals track a streak target on one of your habits. Add a habit to build or break to get started.'
              : 'Pick a habit and a streak target — 7, 14 or 30 days — and watch your progress fill up.'
          }
          action={
            !noHabits && (
              <button type="button" className="btn btn-primary" onClick={() => setForm({ mode: 'create' })}>
                <Plus className="size-4" /> Set your first goal
              </button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              onEdit={() => setForm({ mode: 'edit', goal: g })}
              onDelete={() => onRequestDelete(g)}
            />
          ))}
        </div>
      )}

      {form && (
        <GoalFormModal
          goal={form.mode === 'edit' ? form.goal : undefined}
          habits={habits}
          onClose={() => setForm(null)}
          onSubmit={async (payload) => {
            if (form.mode === 'edit') await onUpdate(form.goal.id, payload);
            else await onCreate(payload);
            setForm(null);
          }}
        />
      )}
    </section>
  );
}
