import {
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
} from 'sequelize';
import { sequelize } from '../config/database';
import type { User } from './User';
import type { HabitLog } from './HabitLog';
import type { Goal } from './Goal';

export type HabitType = 'build' | 'break';

export class Habit extends Model<InferAttributes<Habit>, InferCreationAttributes<Habit>> {
  declare id: CreationOptional<string>;
  declare user_id: ForeignKey<User['id']>;
  declare title: string;
  declare description: string | null;
  declare type: HabitType;
  /** Calendar date (YYYY-MM-DD) the clean streak counts from. */
  declare last_reset_date: string;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  declare user?: NonAttribute<User>;
  declare logs?: NonAttribute<HabitLog[]>;
  declare goals?: NonAttribute<Goal[]>;
}

Habit.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('build', 'break'),
      allowNull: false,
    },
    last_reset_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'habits',
    modelName: 'Habit',
  },
);
