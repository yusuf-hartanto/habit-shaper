import path from 'path';
import dotenv from 'dotenv';
import type { SignOptions } from 'jsonwebtoken';

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export interface AppEnv {
  nodeEnv: string;
  isProduction: boolean;
  port: number;
  db: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
  jwt: {
    secret: string;
    expiresIn: NonNullable<SignOptions['expiresIn']>;
  };
  corsOrigins: string[];
  smtp: {
    host: string;
    port: number;
    from: string;
  };
  frontendUrl: string;
  mailpitUiUrl: string;
}

const nodeEnv = process.env.NODE_ENV || 'development';
const frontendPort = process.env.FRONTEND_PORT || '3000';
const localFrontendOrigin = `http://localhost:${frontendPort}`;

const parseOrigins = (value: string): string[] =>
  value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

// Defaults mirror compose.yml so the app runs without a .env file.
export const env: AppEnv = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  port: Number(process.env.PORT || process.env.BACKEND_PORT || 4000),
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    name: process.env.DB_NAME || 'habit_shaper',
    user: process.env.DB_USER || 'habituser',
    password: process.env.DB_PASSWORD || 'habitpassword',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'habit_jwt_secret',
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as NonNullable<SignOptions['expiresIn']>,
  },
  corsOrigins: [
    ...new Set([...parseOrigins(process.env.CORS_ORIGIN || ''), localFrontendOrigin]),
  ],
  smtp: {
    host: process.env.SMTP_HOST || '127.0.0.1',
    port: Number(process.env.SMTP_PORT || 1025),
    from: process.env.SMTP_FROM || 'Habit Shaper <no-reply@habitshaper.local>',
  },
  frontendUrl: process.env.FRONTEND_URL || localFrontendOrigin,
  mailpitUiUrl: process.env.MAILPIT_UI_URL || `http://localhost:${process.env.MAILPIT_UI_PORT || 8025}`,
};
