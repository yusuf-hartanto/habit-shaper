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
import type { Habit } from './Habit';

export type HabitLogType = 'completed' | 'relapse';

export class HabitLog extends Model<InferAttributes<HabitLog>, InferCreationAttributes<HabitLog>> {
  declare id: CreationOptional<string>;
  declare habit_id: ForeignKey<Habit['id']>;
  /** Calendar date (YYYY-MM-DD). */
  declare log_date: string;
  declare log_type: HabitLogType;
  declare notes: CreationOptional<string | null>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  declare habit?: NonAttribute<Habit>;
}

HabitLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    log_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    log_type: {
      type: DataTypes.ENUM('completed', 'relapse'),
      allowNull: false,
    },
    notes: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'habit_logs',
    modelName: 'HabitLog',
    indexes: [
      {
        unique: true,
        name: 'habit_logs_habit_date_type_unique',
        fields: ['habit_id', 'log_date', 'log_type'],
      },
    ],
  },
);
