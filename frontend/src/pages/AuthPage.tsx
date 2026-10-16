import { useState, type FormEvent, type ReactNode } from 'react';
import { Eye, EyeOff, Flame, Lock, Mail, ShieldCheck, Sprout, Target, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/client';
import { Alert } from '../components/ui/Alert';
import { Spinner } from '../components/ui/Spinner';

type Mode = 'login' | 'register';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 6;

function Field({
  id,
  label,
  icon,
  children,
}: {
  id: string;
  label: string;
  icon: ReactNode;
  children: ReactNode;
}) {
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

export function AuthPage() {
  const { login, register, sessionExpired } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === 'register';

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  const validate = (): string | null => {
    if (isRegister && !name.trim()) return 'Please enter your name.';
    if (!EMAIL_REGEX.test(email.trim())) return 'Please enter a valid email address.';
    if (!password) return 'Please enter your password.';
    if (isRegister && password.length < MIN_PASSWORD)
      return `Password must be at least ${MIN_PASSWORD} characters.`;
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const problem = validate();
    if (problem) return setError(problem);

    setSubmitting(true);
    setError(null);
    try {
      if (isRegister) await register({ name: name.trim(), email: email.trim(), password });
      else await login({ email: email.trim(), password });
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md animate-scale-in">
        {/* Brand */}
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-500 text-white shadow-lg shadow-indigo-500/30">
            <Sprout className="size-7" aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {isRegister ? 'Start shaping your habits' : 'Welcome back'}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Build good habits, break bad ones, and hit your streak goals.
          </p>
        </div>

        <div className="card p-6 sm:p-8">
          {/* Mode switcher */}
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

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {sessionExpired && !error && (
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

            <Field id="auth-email" label="Email" icon={<Mail className="size-4" />}>
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

            <Field id="auth-password" label="Password" icon={<Lock className="size-4" />}>
              <input
                id="auth-password"
                className="input pl-10 pr-11"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isRegister ? `At least ${MIN_PASSWORD} characters` : '••••••••'}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-1 my-auto flex size-9 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </Field>

            <button id="auth-submit" type="submit" className="btn btn-primary w-full" disabled={submitting}>
              {submitting && <Spinner className="size-4" />}
              {submitting
                ? isRegister
                  ? 'Creating account…'
                  : 'Logging in…'
                : isRegister
                  ? 'Create account'
                  : 'Log in'}
            </button>
          </form>

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
