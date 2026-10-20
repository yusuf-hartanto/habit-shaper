import { useMemo, useState } from 'react';
import { Ban, Plus, RefreshCw, Sprout, Target, type LucideIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDashboard } from '../hooks/useDashboard';
import { getErrorMessage } from '../api/client';
import { Navbar } from '../components/Navbar';
import { SummaryStrip } from '../components/SummaryStrip';
import { HabitBuildCard } from '../components/HabitBuildCard';
import { HabitBreakCard } from '../components/HabitBreakCard';
import { HabitFormModal, type HabitFormState } from '../components/HabitFormModal';
import { GoalSection } from '../components/GoalSection';
import { ConfirmDialog, type ConfirmOptions } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { Alert } from '../components/ui/Alert';
import { ToastViewport, useToasts } from '../components/ui/Toast';
import { greeting, pluralize } from '../utils/date';
import type { Goal, Habit, HabitFormValues, HabitType } from '../types';

type Tab = 'build' | 'break' | 'goals';

const TABS: { id: Tab; label: string; short: string; icon: LucideIcon; active: string }[] = [
  { id: 'build', label: 'Habits to Build', short: 'Build', icon: Sprout, active: 'text-emerald-700 bg-white shadow-sm' },
  { id: 'break', label: 'Habits to Break', short: 'Break', icon: Ban, active: 'text-rose-700 bg-white shadow-sm' },
  { id: 'goals', label: 'Goals', short: 'Goals', icon: Target, active: 'text-indigo-700 bg-white shadow-sm' },
];

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="card animate-pulse space-y-4 p-5">
          <div className="flex gap-3">
            <div className="size-11 rounded-xl bg-slate-100" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 rounded bg-slate-100" />
              <div className="h-3 w-full rounded bg-slate-100" />
            </div>
          </div>
          <div className="h-12 w-1/2 rounded-xl bg-slate-100" />
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 7 }, (_, j) => (
              <div key={j} className="aspect-square rounded-lg bg-slate-100" />
            ))}
          </div>
          <div className="h-11 rounded-xl bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const dash = useDashboard();
  const { toasts, notify, dismiss } = useToasts();
  const [tab, setTab] = useState<Tab>('build');
  const [habitForm, setHabitForm] = useState<HabitFormState | null>(null);
  const [confirm, setConfirm] = useState<ConfirmOptions | null>(null);

  const buildHabits = useMemo(() => dash.habits.filter((h) => h.type === 'build'), [dash.habits]);
  const breakHabits = useMemo(() => dash.habits.filter((h) => h.type === 'break'), [dash.habits]);
  const counts: Record<Tab, number> = {
    build: buildHabits.length,
    break: breakHabits.length,
    goals: dash.goals.length,
  };

  const firstName = user?.name.split(' ')[0] ?? 'there';
  const doneToday = buildHabits.filter((h) => h.completed_today).length;

  // ---------- Actions ----------

  const handleToggle = async (habit: Habit, date?: string) => {
    try {
      const res = await dash.toggleHabit(habit.id, date);
      if (res.completed && !date) notify('success', `Nice work! "${habit.title}" done for today.`);
    } catch (err) {
      notify('error', getErrorMessage(err));
    }
  };

  const goalsLinkedTo = (habit: Habit) => dash.goals.filter((g) => g.habit_id === habit.id).length;

  const requestDeleteHabit = (habit: Habit) => {
    const linked = goalsLinkedTo(habit);
    setConfirm({
      title: 'Delete this habit?',
      tone: 'danger',
      confirmLabel: 'Delete habit',
      message: (
        <>
          <strong className="text-slate-900">“{habit.title}”</strong> and its entire history
          {linked > 0 && <> plus {pluralize(linked, 'linked goal')}</>} will be permanently removed.
        </>
      ),
      onConfirm: async () => {
        try {
          await dash.deleteHabit(habit.id);
          notify('success', 'Habit deleted');
        } catch (err) {
          notify('error', getErrorMessage(err));
        }
      },
    });
  };

  const requestRelapse = (habit: Habit) =>
    setConfirm({
      title: 'Record a relapse?',
      tone: 'warning',
      confirmLabel: 'Yes, reset streak',
      message: (
        <>
          This resets your clean streak for <strong className="text-slate-900">“{habit.title}”</strong> from{' '}
          <strong className="text-slate-900">Day {habit.current_streak}</strong> to 0. Slips happen — what matters is
          starting again.
        </>
      ),
      onConfirm: async () => {
        try {
          await dash.relapseHabit(habit.id);
          notify('success', 'Relapse recorded. Tomorrow is a fresh Day 1 💪');
        } catch (err) {
          notify('error', getErrorMessage(err));
        }
      },
    });

  const requestDeleteGoal = (goal: Goal) =>
    setConfirm({
      title: 'Delete this goal?',
      tone: 'danger',
      confirmLabel: 'Delete goal',
      message: (
        <>
          <strong className="text-slate-900">“{goal.title}”</strong> will be removed. The linked habit and its streak
          are not affected.
        </>
      ),
      onConfirm: async () => {
        try {
          await dash.deleteGoal(goal.id);
          notify('success', 'Goal deleted');
        } catch (err) {
          notify('error', getErrorMessage(err));
        }
      },
    });

  const submitHabitForm = async (values: HabitFormValues) => {
    if (!habitForm) return;
    if (habitForm.mode === 'create') {
      await dash.createHabit({ ...values, type: habitForm.type });
      notify('success', 'Habit created');
    } else {
      await dash.updateHabit(habitForm.habit.id, values);
      notify('success', 'Habit updated');
    }
    setHabitForm(null);
  };

  // ---------- Render helpers ----------

  const renderHabitSection = (type: HabitType) => {
    const isBuild = type === 'build';
    const list = isBuild ? buildHabits : breakHabits;
    const open = () => setHabitForm({ mode: 'create', type });

    return (
      <section aria-labelledby={`${type}-heading`} className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id={`${type}-heading`} className="text-lg font-semibold text-slate-900">
              {isBuild ? 'Habits to Build' : 'Habits to Break'}
            </h2>
            <p className="text-sm text-slate-500">
              {isBuild
                ? list.length > 0
                  ? `${doneToday} of ${list.length} completed today`
                  : 'Positive routines you want to do daily.'
                : 'Habits you’re quitting — track your clean days.'}
            </p>
          </div>
          <button
            id={`add-${type}-habit-button`}
            type="button"
            onClick={open}
            className={`btn w-full text-white sm:w-auto ${
              isBuild
                ? 'bg-emerald-600 shadow-sm shadow-emerald-600/20 hover:bg-emerald-700 focus-visible:ring-emerald-500'
                : 'bg-rose-600 shadow-sm shadow-rose-600/20 hover:bg-rose-700 focus-visible:ring-rose-500'
            }`}
          >
            <Plus className="size-4" aria-hidden="true" />
            {isBuild ? 'Add habit to build' : 'Add habit to break'}
          </button>
        </div>

        {list.length === 0 ? (
          <EmptyState
            icon={isBuild ? Sprout : Ban}
            accent={isBuild ? 'emerald' : 'rose'}
            title={isBuild ? 'No habits to build yet' : 'Nothing to quit yet'}
            description={
              isBuild
                ? 'Start small: meditate, exercise, read, or learn Mandarin. Check in daily to grow your streak.'
                : 'Smoking, junk food, doomscrolling? Add it here and watch your clean-day counter climb.'
            }
            action={
              <button type="button" onClick={open} className="btn btn-secondary">
                <Plus className="size-4" /> {isBuild ? 'Add your first habit' : 'Add a habit to break'}
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {list.map((h) =>
              isBuild ? (
                <HabitBuildCard
                  key={h.id}
                  habit={h}
                  onToggle={(date) => handleToggle(h, date)}
                  onEdit={() => setHabitForm({ mode: 'edit', habit: h })}
                  onDelete={() => requestDeleteHabit(h)}
                />
              ) : (
                <HabitBreakCard
                  key={h.id}
                  habit={h}
                  onRelapse={() => requestRelapse(h)}
                  onEdit={() => setHabitForm({ mode: 'edit', habit: h })}
                  onDelete={() => requestDeleteHabit(h)}
                />
              ),
            )}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="min-h-dvh">
      <Navbar onChangePasswordSuccess={(msg) => notify('success', msg)} />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {greeting()}, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · Small
            steps, every day.
          </p>
        </div>

        {dash.error && (
          <Alert
            action={
              <button
                type="button"
                onClick={() => void dash.reload()}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold hover:bg-rose-100"
              >
                <RefreshCw className="size-3.5" /> Retry
              </button>
            }
          >
            {dash.error}
          </Alert>
        )}

        <SummaryStrip habits={dash.habits} goals={dash.goals} />

        {/* Tabs */}
        <div role="tablist" aria-label="Dashboard sections" className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-200/60 p-1 sm:inline-grid sm:w-auto">
          {TABS.map(({ id, label, short, icon: Icon, active }) => (
            <button
              key={id}
              id={`tab-${id}`}
              role="tab"
              type="button"
              aria-selected={tab === id}
              aria-controls={`panel-${id}`}
              onClick={() => setTab(id)}
              className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition-all sm:px-4 ${
                tab === id ? active : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span className="sm:hidden">{short}</span>
              <span className="hidden sm:inline">{label}</span>
              <span
                className={`min-w-5 rounded-full px-1.5 text-xs tabular-nums ${
                  tab === id ? 'bg-slate-100 text-slate-700' : 'bg-slate-300/60 text-slate-600'
                }`}
              >
                {counts[id]}
              </span>
            </button>
          ))}
        </div>

        <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} key={tab}>
          {dash.loading ? (
            <SkeletonGrid />
          ) : tab === 'goals' ? (
            <GoalSection
              goals={dash.goals}
              habits={dash.habits}
              onCreate={async (p) => {
                await dash.createGoal(p);
                notify('success', 'Goal created');
              }}
              onUpdate={async (id, p) => {
                await dash.updateGoal(id, p);
                notify('success', 'Goal updated');
              }}
              onRequestDelete={requestDeleteGoal}
            />
          ) : (
            renderHabitSection(tab)
          )}
        </div>
      </main>

      {habitForm && (
        <HabitFormModal state={habitForm} onClose={() => setHabitForm(null)} onSubmit={submitHabitForm} />
      )}
      {confirm && <ConfirmDialog options={confirm} onClose={() => setConfirm(null)} />}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
