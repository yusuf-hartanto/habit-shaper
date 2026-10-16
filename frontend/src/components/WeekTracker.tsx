import { Check, X } from 'lucide-react';
import type { DayStatus, HabitType } from '../types';
import { formatDayLabel, weekdayShort } from '../utils/date';

interface WeekTrackerProps {
  days: DayStatus[];
  variant: HabitType;
  /** Build habits only: toggles a past day's completion. */
  onToggleDay?: (date: string) => void;
  pendingDate?: string | null;
}

/** 7-day mini tracker (oldest → today). */
export function WeekTracker({ days, variant, onToggleDay, pendingDate }: WeekTrackerProps) {
  const todayIndex = days.length - 1;

  return (
    <ol className="grid grid-cols-7 gap-1.5" aria-label="Last 7 days">
      {days.map((day, i) => {
        const isToday = i === todayIndex;
        const label = formatDayLabel(day.date);

        let cls = 'bg-slate-100 text-slate-300';
        let icon = null;
        let status = variant === 'build' ? 'not completed' : 'not tracked';

        if (variant === 'build' && day.completed) {
          cls = 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30';
          icon = <Check className="size-3.5 animate-pop" strokeWidth={3} />;
          status = 'completed';
        } else if (variant === 'break' && day.relapsed) {
          cls = 'bg-rose-500 text-white shadow-sm shadow-rose-500/30';
          icon = <X className="size-3.5 animate-pop" strokeWidth={3} />;
          status = 'relapsed';
        } else if (variant === 'break' && day.completed) {
          cls = 'bg-emerald-100 text-emerald-600';
          icon = <Check className="size-3.5" strokeWidth={3} />;
          status = 'clean';
        }

        const ring = isToday ? 'ring-2 ring-offset-2 ring-slate-300' : '';
        const box = `flex aspect-square w-full items-center justify-center rounded-lg transition-all ${cls} ${ring}`;
        const interactive = variant === 'build' && onToggleDay;

        return (
          <li key={day.date} className="flex flex-col items-center gap-1">
            <span className={`text-[10px] font-semibold uppercase ${isToday ? 'text-slate-700' : 'text-slate-400'}`}>
              {isToday ? 'Today' : weekdayShort(day.date)}
            </span>
            {interactive ? (
              <button
                type="button"
                onClick={() => onToggleDay(day.date)}
                disabled={pendingDate === day.date}
                className={`${box} hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50`}
                title={`${label}: ${status} — click to toggle`}
                aria-label={`${label}: ${status}. Toggle completion`}
                aria-pressed={day.completed}
              >
                {icon}
              </button>
            ) : (
              <span className={box} title={`${label}: ${status}`} aria-label={`${label}: ${status}`}>
                {icon}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
