import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  accent?: 'emerald' | 'rose' | 'indigo';
}

const ACCENTS = {
  emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  rose: 'bg-rose-50 text-rose-600 ring-rose-100',
  indigo: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
} as const;

export function EmptyState({ icon: Icon, title, description, action, accent = 'indigo' }: EmptyStateProps) {
  return (
    <div className="flex animate-fade-in flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center">
      <div className={`mb-4 flex size-12 items-center justify-center rounded-2xl ring-4 ${ACCENTS[accent]}`}>
        <Icon className="size-6" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
