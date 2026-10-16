import { Ban, CalendarDays, RotateCcw, ShieldCheck, TriangleAlert } from 'lucide-react';
import type { Habit } from '../types';
import { CardActions } from './CardActions';
import { WeekTracker } from './WeekTracker';
import { formatDate } from '../utils/date';

interface HabitBreakCardProps {
  habit: Habit;
  /** Opens the confirmation prompt (handled by the dashboard). */
  onRelapse: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function HabitBreakCard({ habit, onRelapse, onEdit, onDelete }: HabitBreakCardProps) {
  const { weekly_stats: stats, current_streak: streak, relapsed_today: relapsed } = habit;

  return (
    <article className="card group flex animate-slide-up flex-col p-5 transition-shadow hover:shadow-lg hover:shadow-slate-200/60">
      {/* Header */}
      <header className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
          <Ban className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-slate-900" title={habit.title}>
            {habit.title}
          </h3>
          <p className="line-clamp-2 text-sm text-slate-500">
            {habit.description || 'Stay strong — every clean day counts.'}
          </p>
        </div>
        <CardActions label={habit.title} onEdit={onEdit} onDelete={onDelete} />
      </header>

      {/* Clean-streak badge */}
      <div
        className={`mt-5 flex items-center gap-3 rounded-2xl p-4 ${
          relapsed
            ? 'bg-rose-50 ring-1 ring-rose-100'
            : 'bg-gradient-to-br from-amber-50 to-emerald-50 ring-1 ring-emerald-100'
        }`}
      >
        <div
          className={`flex size-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md ${
            relapsed ? 'bg-rose-500 shadow-rose-500/30' : 'bg-emerald-500 shadow-emerald-500/30'
          }`}
        >
          {relapsed ? <TriangleAlert className="size-6" aria-hidden="true" /> : <ShieldCheck className="size-6" aria-hidden="true" />}
        </div>
        <div className="min-w-0">
          {relapsed ? (
            <>
              <p className="text-xl font-bold leading-tight text-rose-700">0 Days Clean</p>
              <p className="text-xs font-medium text-rose-600">Relapsed Today — tomorrow is Day 1</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold leading-tight tabular-nums text-emerald-800">Day {streak} Clean</p>
              <p className="text-xs font-medium text-emerald-700">Keep the streak alive</p>
            </>
          )}
        </div>
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
        <CalendarDays className="size-3.5" aria-hidden="true" />
        Last reset: <span className="font-medium text-slate-700">{formatDate(habit.last_reset_date)}</span>
      </p>

      {/* 7-day tracker */}
      <div className="mt-4">
        <WeekTracker days={stats.last_7_days} variant="break" />
      </div>

      {/* Relapse */}
      <button
        id={`relapse-${habit.id}`}
        type="button"
        onClick={onRelapse}
        disabled={relapsed}
        className="btn mt-5 w-full border-2 border-rose-200 bg-white text-rose-600 hover:border-rose-300 hover:bg-rose-50 focus-visible:ring-rose-500"
      >
        <RotateCcw className="size-4" aria-hidden="true" />
        {relapsed ? 'Relapse logged today' : 'Relapse / Reset Streak'}
      </button>

      {/* Weekly footer */}
      <footer className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-4 text-xs">
        <p className="text-slate-600">
          <span className="font-semibold text-slate-900">{stats.completed_days}/7 clean days</span> this week
        </p>
        <span className="rounded-full bg-amber-50 px-2 py-0.5 font-bold tabular-nums text-amber-700">
          {stats.completion_rate}%
        </span>
      </footer>
    </article>
  );
}
