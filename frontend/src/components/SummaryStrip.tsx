import { Activity, Flame, Trophy, type LucideIcon } from 'lucide-react';
import type { Goal, Habit } from '../types';
import { pluralize } from '../utils/date';

interface SummaryStripProps {
  habits: Habit[];
  goals: Goal[];
}

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint: string;
  tone: string;
  delay: number;
}

function StatCard({ icon: Icon, label, value, hint, tone, delay }: StatCardProps) {
  return (
    <div
      className="card flex animate-slide-up items-center gap-4 p-4 sm:p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${tone}`}>
        <Icon className="size-6" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-2xl font-bold tabular-nums text-slate-900">{value}</p>
        <p className="truncate text-xs text-slate-500">{hint}</p>
      </div>
    </div>
  );
}

export function SummaryStrip({ habits, goals }: SummaryStripProps) {
  const buildCount = habits.filter((h) => h.type === 'build').length;
  const breakCount = habits.length - buildCount;

  const best = habits.reduce<Habit | null>(
    (top, h) => (h.current_streak > (top?.current_streak ?? 0) ? h : top),
    null,
  );
  const achieved = goals.filter((g) => g.is_achieved).length;

  return (
    <section aria-label="Summary" className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
      <StatCard
        icon={Activity}
        label="Active habits"
        value={habits.length}
        hint={`${buildCount} to build · ${breakCount} to break`}
        tone="bg-indigo-50 text-indigo-600"
        delay={0}
      />
      <StatCard
        icon={Flame}
        label="Best active streak"
        value={best ? pluralize(best.current_streak, 'day') : '0 days'}
        hint={best ? best.title : 'Check in to start a streak'}
        tone="bg-orange-50 text-orange-500"
        delay={60}
      />
      <StatCard
        icon={Trophy}
        label="Goals achieved"
        value={`${achieved}/${goals.length}`}
        hint={goals.length ? `${goals.length - achieved} in progress` : 'Set your first goal'}
        tone="bg-emerald-50 text-emerald-600"
        delay={120}
      />
    </section>
  );
}
