import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, KeyRound, Lock } from 'lucide-react';
import { authApi } from '../api/services';
import { getErrorMessage } from '../api/client';
import { Modal } from './ui/Modal';
import { Alert } from './ui/Alert';
import { Spinner } from './ui/Spinner';

interface ChangePasswordModalProps {
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const MIN_PASSWORD = 6;

export function ChangePasswordModal({ onClose, onSuccess }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      return setError('Please enter your current password.');
    }
    if (!newPassword || newPassword.length < MIN_PASSWORD) {
      return setError(`New password must be at least ${MIN_PASSWORD} characters.`);
    }
    if (newPassword === currentPassword) {
      return setError('New password must be different from current password.');
    }
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await authApi.changePassword({ currentPassword, newPassword });
      onSuccess(res.message);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Change Password"
      description="Update your account password with your current password."
      onClose={onClose}
      locked={submitting}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1" noValidate>
        {error && <Alert onDismiss={() => setError(null)}>{error}</Alert>}

        <div>
          <label htmlFor="current-password" className="label">
            Current Password
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
              <Lock className="size-4" />
            </span>
            <input
              id="current-password"
              className="input pl-10 pr-11"
              type={showCurrent ? 'text' : 'password'}
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute inset-y-0 right-1 my-auto flex size-9 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600"
              aria-label={showCurrent ? 'Hide password' : 'Show password'}
            >
              {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="change-new-password" className="label">
            New Password
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
              <KeyRound className="size-4" />
            </span>
            <input
              id="change-new-password"
              className="input pl-10 pr-11"
              type={showNew ? 'text' : 'password'}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={`At least ${MIN_PASSWORD} characters`}
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute inset-y-0 right-1 my-auto flex size-9 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600"
              aria-label={showNew ? 'Hide password' : 'Show password'}
            >
              {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="change-confirm-password" className="label">
            Confirm New Password
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
              <KeyRound className="size-4" />
            </span>
            <input
              id="change-confirm-password"
              className="input pl-10 pr-11"
              type={showNew ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your new password"
            />
          </div>
          {confirmPassword && confirmPassword !== newPassword && (
            <p className="mt-1.5 text-xs font-medium text-rose-600">Passwords do not match.</p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary w-full sm:w-auto"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            id="change-password-submit"
            type="submit"
            className="btn btn-primary w-full sm:w-auto"
            disabled={submitting}
          >
            {submitting && <Spinner className="size-4" />}
            Update Password
          </button>
        </div>
      </form>
    </Modal>
  );
}
