import { sequelize } from '../config/database';
import { User } from './User';
import { Habit } from './Habit';
import { HabitLog } from './HabitLog';
import { Goal } from './Goal';

const cascade = { onDelete: 'CASCADE', onUpdate: 'CASCADE' } as const;

// User 1 ── * Habit
User.hasMany(Habit, { foreignKey: 'user_id', as: 'habits', ...cascade });
Habit.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User 1 ── * Goal
User.hasMany(Goal, { foreignKey: 'user_id', as: 'goals', ...cascade });
Goal.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Habit 1 ── * HabitLog
Habit.hasMany(HabitLog, { foreignKey: 'habit_id', as: 'logs', ...cascade });
HabitLog.belongsTo(Habit, { foreignKey: 'habit_id', as: 'habit' });

// Habit 1 ── * Goal
Habit.hasMany(Goal, { foreignKey: 'habit_id', as: 'goals', ...cascade });
Goal.belongsTo(Habit, { foreignKey: 'habit_id', as: 'habit' });

export { sequelize, User, Habit, HabitLog, Goal };
export type { HabitType } from './Habit';
export type { HabitLogType } from './HabitLog';
