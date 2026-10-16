import { useState, type ReactNode } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import { Modal } from './Modal';
import { Spinner } from './Spinner';

export interface ConfirmOptions {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  tone: 'danger' | 'warning';
  /** Should handle its own errors (e.g. toast); the dialog closes when it settles. */
  onConfirm: () => Promise<void>;
}

interface ConfirmDialogProps {
  options: ConfirmOptions;
  onClose: () => void;
}

export function ConfirmDialog({ options, onClose }: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  const Icon = options.tone === 'danger' ? Trash2 : RotateCcw;

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await options.onConfirm();
    } finally {
      setBusy(false);
      onClose();
    }
  };

  return (
    <Modal
      title={options.title}
      onClose={onClose}
      size="sm"
      locked={busy}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            data-autofocus
            className={`btn ${options.tone === 'danger' ? 'btn-danger' : 'btn-warning'}`}
            onClick={handleConfirm}
            disabled={busy}
          >
            {busy ? <Spinner className="size-4" /> : <Icon className="size-4" />}
            {options.confirmLabel}
          </button>
        </>
      }
    >
      <div className="text-sm leading-relaxed text-slate-600">{options.message}</div>
    </Modal>
  );
}
