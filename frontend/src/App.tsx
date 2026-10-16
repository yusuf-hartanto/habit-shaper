import { Sprout } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { Spinner } from './components/ui/Spinner';

export default function App() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4" aria-busy="true">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-500 text-white shadow-lg shadow-indigo-500/30">
          <Sprout className="size-6" aria-hidden="true" />
        </span>
        <Spinner className="size-5 text-slate-400" />
      </div>
    );
  }

  return status === 'authenticated' ? <DashboardPage /> : <AuthPage />;
}
