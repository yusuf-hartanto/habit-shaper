import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AUTH_EXPIRED_EVENT, tokenStorage } from '../api/client';
import { authApi } from '../api/services';
import type { AuthResponse, LoginPayload, RegisterPayload, User } from '../types';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  /** True after a 401 kicked the user out (shown as a notice on the auth page). */
  sessionExpired: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() =>
    tokenStorage.get() ? 'loading' : 'unauthenticated',
  );
  const [sessionExpired, setSessionExpired] = useState(false);

  // Restore session from a persisted token.
  useEffect(() => {
    if (!tokenStorage.get()) return;
    let cancelled = false;
    authApi
      .me()
      .then((profile) => {
        if (cancelled) return;
        setUser(profile);
        setStatus('authenticated');
      })
      .catch(() => {
        if (cancelled) return;
        tokenStorage.clear();
        setUser(null);
        setStatus('unauthenticated');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // React to 401s raised anywhere by the Axios interceptor.
  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      setStatus('unauthenticated');
      setSessionExpired(true);
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, []);

  const startSession = useCallback((res: AuthResponse) => {
    tokenStorage.set(res.token);
    setUser(res.user);
    setStatus('authenticated');
    setSessionExpired(false);
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => startSession(await authApi.login(payload)),
    [startSession],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => startSession(await authApi.register(payload)),
    [startSession],
  );

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
    setStatus('unauthenticated');
    setSessionExpired(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, sessionExpired, login, register, logout }),
    [user, status, sessionExpired, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
