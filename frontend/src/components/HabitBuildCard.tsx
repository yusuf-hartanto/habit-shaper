import { useState } from 'react';
import { Check, CircleCheck, Flame, Sprout } from 'lucide-react';
import type { Habit } from '../types';
import { CardActions } from './CardActions';
import { WeekTracker } from './WeekTracker';
import { Spinner } from './ui/Spinner';
import { pluralize } from '../utils/date';

interface HabitBuildCardProps {
  habit: Habit;
  /** Toggle completion for `date` (undefined = today). */
  onToggle: (date?: string) => Promise<void>;
  onEdit: () => void;
  onDelete: () => void;
}

export function HabitBuildCard({ habit, onToggle, onEdit, onDelete }: HabitBuildCardProps) {
  const [pending, setPending] = useState<string | null>(null);
  const { weekly_stats: stats, current_streak: streak, completed_today: done } = habit;
  const todayDate = stats.last_7_days[stats.last_7_days.length - 1]?.date ?? 'today';

  const toggle = async (date?: string) => {
    setPending(date ?? todayDate);
    try {
      await onToggle(date);
    } finally {
      setPending(null);
    }
  };

  return (
    <article className="card group flex animate-slide-up flex-col p-5 transition-shadow hover:shadow-lg hover:shadow-slate-200/60">
      {/* Header */}
      <header className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <Sprout className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-slate-900" title={habit.title}>
            {habit.title}
          </h3>
          <p className="line-clamp-2 text-sm text-slate-500">
            {habit.description || 'Build this habit one day at a time.'}
          </p>
        </div>
        <CardActions label={habit.title} onEdit={onEdit} onDelete={onDelete} />
      </header>

      {/* Streak */}
      <div className="mt-5 flex items-center gap-3">
        <div
          className={`flex size-12 items-center justify-center rounded-2xl transition-colors ${
            streak > 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-orange-500/30' : 'bg-slate-100 text-slate-400'
          }`}
        >
          <Flame className="size-6" aria-hidden="true" />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none tabular-nums text-slate-900">{streak}</p>
          <p className="mt-1 text-xs font-medium text-slate-500">
            day streak
            {!done && streak > 0 && <span className="text-amber-600"> · check in to keep it!</span>}
          </p>
        </div>
      </div>

      {/* 7-day tracker */}
      <div className="mt-5">
        <WeekTracker
          days={stats.last_7_days}
          variant="build"
          onToggleDay={(date) => void toggle(date)}
          pendingDate={pending}
        />
      </div>

      {/* Check-in */}
      <button
        id={`toggle-${habit.id}`}
        type="button"
        onClick={() => void toggle()}
        disabled={pending !== null}
        aria-pressed={done}
        className={`btn mt-5 w-full ${
          done
            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25 hover:bg-emerald-600 focus-visible:ring-emerald-500'
            : 'border-2 border-emerald-500 bg-white text-emerald-700 hover:bg-emerald-50 focus-visible:ring-emerald-500'
        }`}
      >
        {pending === todayDate ? (
          <Spinner className="size-4" />
        ) : done ? (
          <CircleCheck className="size-5 animate-pop" aria-hidden="true" />
        ) : (
          <Check className="size-5" aria-hidden="true" />
        )}
        {done ? 'Completed Today ✓' : 'Mark Completed Today'}
      </button>

      {/* Weekly stats footer */}
      <footer className="mt-4 border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between gap-2 text-xs">
          <p className="text-slate-600">
            <span className="font-semibold text-slate-900">{stats.completed_days}/7 days</span>
            {' • '}
            <span className={stats.missed_days > 0 ? 'text-rose-600' : ''}>
              {pluralize(stats.missed_days, 'missed day', 'missed days')} this week
            </span>
          </p>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-bold tabular-nums text-emerald-700">
            {stats.completion_rate}%
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-[width] duration-500"
            style={{ width: `${stats.completion_rate}%` }}
          />
        </div>
      </footer>
    </article>
  );
}
