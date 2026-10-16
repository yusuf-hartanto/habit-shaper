import { api, unwrap } from './client';
import type {
  ApiSuccess,
  AuthResponse,
  CreateHabitPayload,
  Goal,
  GoalPayload,
  Habit,
  HabitFormValues,
  LoginPayload,
  RegisterPayload,
  ToggleResult,
  User,
} from '../types';

export const authApi = {
  register: (payload: RegisterPayload) =>
    unwrap(api.post<ApiSuccess<AuthResponse>>('/auth/register', payload)),
  login: (payload: LoginPayload) =>
    unwrap(api.post<ApiSuccess<AuthResponse>>('/auth/login', payload)),
  me: () => unwrap(api.get<ApiSuccess<User>>('/auth/me')),
};

export const habitsApi = {
  list: () => unwrap(api.get<ApiSuccess<Habit[]>>('/habits')),
  create: (payload: CreateHabitPayload) =>
    unwrap(api.post<ApiSuccess<Habit>>('/habits', payload)),
  update: (id: string, payload: Partial<HabitFormValues>) =>
    unwrap(api.put<ApiSuccess<Habit>>(`/habits/${id}`, payload)),
  remove: async (id: string): Promise<void> => {
    await api.delete(`/habits/${id}`);
  },
  toggle: (id: string, date?: string) =>
    unwrap(api.post<ApiSuccess<ToggleResult>>(`/habits/${id}/toggle`, date ? { date } : {})),
  relapse: (id: string, notes?: string) =>
    unwrap(api.post<ApiSuccess<Habit>>(`/habits/${id}/relapse`, notes ? { notes } : {})),
};

export const goalsApi = {
  list: () => unwrap(api.get<ApiSuccess<Goal[]>>('/goals')),
  create: (payload: GoalPayload) => unwrap(api.post<ApiSuccess<Goal>>('/goals', payload)),
  update: (id: string, payload: Partial<GoalPayload>) =>
    unwrap(api.put<ApiSuccess<Goal>>(`/goals/${id}`, payload)),
  remove: async (id: string): Promise<void> => {
    await api.delete(`/goals/${id}`);
  },
};
