import { useState } from 'react';
import { KeyRound, LogOut, Sprout } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ChangePasswordModal } from './ChangePasswordModal';

const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '?';

interface NavbarProps {
  onChangePasswordSuccess?: (message: string) => void;
}

export function Navbar({ onChangePasswordSuccess }: NavbarProps = {}) {
  const { user, logout } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/75 backdrop-blur-lg">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <a
            href="/"
            className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 text-white shadow-md shadow-indigo-500/25">
              <Sprout className="size-5" aria-hidden="true" />
            </span>
            <span className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
              Habit<span className="text-indigo-600">Shaper</span>
            </span>
          </a>

          {user && (
            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-1 sm:pr-3.5"
                title={user.email}
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                  {initials(user.name)}
                </span>
                <span className="hidden max-w-[10rem] truncate text-sm font-medium text-slate-700 sm:block">
                  {user.name}
                </span>
              </div>
              <button
                id="change-password-button"
                type="button"
                onClick={() => setShowChangePassword(true)}
                className="btn btn-secondary px-3 sm:px-4"
                aria-label="Change password"
                title="Change password"
              >
                <KeyRound className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Password</span>
              </button>
              <button
                id="logout-button"
                type="button"
                onClick={logout}
                className="btn btn-secondary px-3 sm:px-4"
                aria-label="Log out"
              >
                <LogOut className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </nav>
      </header>

      {showChangePassword && (
        <ChangePasswordModal
          onClose={() => setShowChangePassword(false)}
          onSuccess={(msg) => {
            onChangePasswordSuccess?.(msg);
          }}
        />
      )}
    </>
  );
}
