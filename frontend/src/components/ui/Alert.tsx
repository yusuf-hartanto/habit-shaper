import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import type { ReactNode } from 'react';

type AlertTone = 'error' | 'info' | 'success';

interface AlertProps {
  tone?: AlertTone;
  children: ReactNode;
  onDismiss?: () => void;
  action?: ReactNode;
}

const STYLES: Record<AlertTone, string> = {
  error: 'border-rose-200 bg-rose-50 text-rose-800',
  info: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
};

const ICONS = { error: CircleAlert, info: Info, success: CircleCheck } as const;

export function Alert({ tone = 'error', children, onDismiss, action }: AlertProps) {
  const Icon = ICONS[tone];

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex animate-slide-up items-start gap-3 rounded-xl border px-3.5 py-3 text-sm ${STYLES[tone]}`}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1 leading-relaxed">{children}</div>
      {action}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="-m-1 rounded-md p-1 opacity-60 transition hover:opacity-100"
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
