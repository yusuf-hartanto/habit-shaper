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
import type { Habit } from './Habit';

export class Goal extends Model<InferAttributes<Goal>, InferCreationAttributes<Goal>> {
  declare id: CreationOptional<string>;
  declare user_id: ForeignKey<User['id']>;
  declare habit_id: ForeignKey<Habit['id']>;
  declare title: string;
  declare target_streak_days: CreationOptional<number>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;

  declare user?: NonAttribute<User>;
  declare habit?: NonAttribute<Habit>;
}

Goal.init(
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
    target_streak_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 7,
      validate: { min: 1 },
    },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'goals',
    modelName: 'Goal',
  },
);
