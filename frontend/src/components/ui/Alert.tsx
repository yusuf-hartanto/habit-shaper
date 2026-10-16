import { CircleAlert, Info, X } from 'lucide-react';
import type { ReactNode } from 'react';

interface AlertProps {
  tone?: 'error' | 'info';
  children: ReactNode;
  onDismiss?: () => void;
  action?: ReactNode;
}

export function Alert({ tone = 'error', children, onDismiss, action }: AlertProps) {
  const styles =
    tone === 'error'
      ? 'border-rose-200 bg-rose-50 text-rose-800'
      : 'border-indigo-200 bg-indigo-50 text-indigo-800';
  const Icon = tone === 'error' ? CircleAlert : Info;

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex animate-slide-up items-start gap-3 rounded-xl border px-3.5 py-3 text-sm ${styles}`}
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
