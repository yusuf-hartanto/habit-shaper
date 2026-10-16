import { useState, type FormEvent, type ReactNode } from 'react';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Flame,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Sprout,
  Target,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/client';
import { authApi } from '../api/services';
import { Alert } from '../components/ui/Alert';
import { Spinner } from '../components/ui/Spinner';

type Mode = 'login' | 'register' | 'reset';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 6;

const HEADINGS: Record<Mode, { title: string; subtitle: string }> = {
  login: { title: 'Welcome back', subtitle: 'Build good habits, break bad ones, and hit your streak goals.' },
  register: {
    title: 'Start shaping your habits',
    subtitle: 'Build good habits, break bad ones, and hit your streak goals.',
  },
  reset: { title: 'Reset your password', subtitle: 'Enter your account email and choose a new password.' },
};

function Field({ id, label, icon, children }: { id: string; label: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
          {icon}
        </span>
        {children}
      </div>
    </div>
  );
}

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggleVisible: () => void;
  autoComplete: 'current-password' | 'new-password';
  placeholder: string;
}

function PasswordField({ id, label, value, onChange, visible, onToggleVisible, autoComplete, placeholder }: PasswordFieldProps) {
  return (
    <Field id={id} label={label} icon={<Lock className="size-4" />}>
      <input
        id={id}
        className="input pl-10 pr-11"
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={onToggleVisible}
        className="absolute inset-y-0 right-1 my-auto flex size-9 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600"
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </Field>
  );
}

export function AuthPage() {
  const { login, register, sessionExpired } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === 'register';
  const isReset = mode === 'reset';

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setSuccess(null);
    setPassword('');
    setConfirmPassword('');
  };

  const validate = (): string | null => {
    if (isRegister && !name.trim()) return 'Please enter your name.';
    if (!EMAIL_REGEX.test(email.trim())) return 'Please enter a valid email address.';
    if (!password) return isReset ? 'Please enter a new password.' : 'Please enter your password.';
    if ((isRegister || isReset) && password.length < MIN_PASSWORD)
      return `Password must be at least ${MIN_PASSWORD} characters.`;
    if (isReset && password !== confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const problem = validate();
    if (problem) return setError(problem);

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      if (isReset) {
        const { message } = await authApi.resetPassword(email.trim(), password);
        // Back to sign-in with the email pre-filled.
        setMode('login');
        setPassword('');
        setConfirmPassword('');
        setShowPassword(false);
        setSuccess(message);
        setSubmitting(false);
      } else if (isRegister) {
        await register({ name: name.trim(), email: email.trim(), password });
      } else {
        await login({ email: email.trim(), password });
      }
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  const submitLabel = submitting
    ? { login: 'Logging in…', register: 'Creating account…', reset: 'Resetting password…' }[mode]
    : { login: 'Log in', register: 'Create account', reset: 'Reset password' }[mode];

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md animate-scale-in">
        {/* Brand */}
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-500 text-white shadow-lg shadow-indigo-500/30">
            {isReset ? <KeyRound className="size-7" aria-hidden="true" /> : <Sprout className="size-7" aria-hidden="true" />}
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{HEADINGS[mode].title}</h1>
          <p className="mt-2 text-sm text-slate-500">{HEADINGS[mode].subtitle}</p>
        </div>

        <div className="card p-6 sm:p-8">
          {isReset ? (
            <button
              id="auth-back-to-login"
              type="button"
              onClick={() => switchMode('login')}
              className="mb-5 inline-flex min-h-10 items-center gap-1.5 rounded-lg text-sm font-semibold text-slate-600 transition hover:text-slate-900"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to Sign In
            </button>
          ) : (
            <div role="tablist" aria-label="Authentication mode" className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
              {(['login', 'register'] as const).map((m) => (
                <button
                  key={m}
                  id={`auth-tab-${m}`}
                  role="tab"
                  type="button"
                  aria-selected={mode === m}
                  onClick={() => switchMode(m)}
                  className={`min-h-10 rounded-lg text-sm font-semibold transition-all ${
                    mode === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {m === 'login' ? 'Log in' : 'Create account'}
                </button>
              ))}
            </div>
          )}

          <form key={mode} onSubmit={handleSubmit} className="animate-fade-in space-y-4" noValidate>
            {success && (
              <Alert tone="success" onDismiss={() => setSuccess(null)}>
                {success}
              </Alert>
            )}
            {sessionExpired && !error && !success && mode === 'login' && (
              <Alert tone="info">Your session has expired. Please log in again.</Alert>
            )}
            {error && <Alert onDismiss={() => setError(null)}>{error}</Alert>}

            {isRegister && (
              <Field id="auth-name" label="Name" icon={<UserIcon className="size-4" />}>
                <input
                  id="auth-name"
                  className="input pl-10"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  placeholder="Your name"
                />
              </Field>
            )}

            <Field id="auth-email" label={isReset ? 'Email Address' : 'Email'} icon={<Mail className="size-4" />}>
              <input
                id="auth-email"
                className="input pl-10"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={150}
                placeholder="you@example.com"
              />
            </Field>

            <div>
              <PasswordField
                id="auth-password"
                label={isReset ? 'New Password' : 'Password'}
                value={password}
                onChange={setPassword}
                visible={showPassword}
                onToggleVisible={() => setShowPassword((v) => !v)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder={mode === 'login' ? '••••••••' : `At least ${MIN_PASSWORD} characters`}
              />
              {mode === 'login' && (
                <div className="mt-2 flex justify-end">
                  <button
                    id="auth-forgot-password"
                    type="button"
                    onClick={() => switchMode('reset')}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

            {isReset && (
              <div>
                <PasswordField
                  id="auth-confirm-password"
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  visible={showPassword}
                  onToggleVisible={() => setShowPassword((v) => !v)}
                  autoComplete="new-password"
                  placeholder="Repeat your new password"
                />
                {confirmPassword && confirmPassword !== password && (
                  <p className="mt-1.5 text-xs font-medium text-rose-600">Passwords do not match.</p>
                )}
              </div>
            )}

            <button id="auth-submit" type="submit" className="btn btn-primary w-full" disabled={submitting}>
              {submitting && <Spinner className="size-4" />}
              {submitLabel}
            </button>
          </form>

          {!isReset && (
            <p className="mt-6 text-center text-sm text-slate-500">
              {isRegister ? 'Already have an account?' : 'New to Habit Shaper?'}{' '}
              <button
                type="button"
                onClick={() => switchMode(isRegister ? 'login' : 'register')}
                className="font-semibold text-indigo-600 hover:text-indigo-700"
              >
                {isRegister ? 'Log in' : 'Create an account'}
              </button>
            </p>
          )}
        </div>

        {/* Feature hints */}
        <ul className="mt-8 grid grid-cols-3 gap-2 text-center text-xs text-slate-500">
          <li className="flex flex-col items-center gap-1.5">
            <Flame className="size-5 text-orange-500" aria-hidden="true" /> Daily streaks
          </li>
          <li className="flex flex-col items-center gap-1.5">
            <ShieldCheck className="size-5 text-emerald-500" aria-hidden="true" /> Clean-day counter
          </li>
          <li className="flex flex-col items-center gap-1.5">
            <Target className="size-5 text-indigo-500" aria-hidden="true" /> Streak goals
          </li>
        </ul>
      </div>
    </main>
  );
}
