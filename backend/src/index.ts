import express, { type Request, type Response } from 'express';
import cors from 'cors';
import type { Server } from 'http';
import { env } from './config/env';
import { sequelize } from './models';
import authRoutes from './routes/authRoutes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

const API_VERSION = '1.0.0';

export const app = express();

// ---------- Global middleware ----------
app.use(
  cors({
    origin: env.corsOrigins.includes('*') ? true : env.corsOrigins,
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));

// ---------- Service info ----------
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      name: 'Habit Shaper API',
      version: API_VERSION,
      environment: env.nodeEnv,
      endpoints: {
        health: 'GET /api/health',
      },
    },
  });
});

// ---------- Health ----------
app.get('/api/health', async (_req: Request, res: Response) => {
  const timestamp = new Date().toISOString();
  try {
    await sequelize.authenticate();
    res.json({ success: true, data: { status: 'ok', database: 'up', timestamp } });
  } catch {
    res.status(503).json({ success: false, data: { status: 'degraded', database: 'down', timestamp } });
  }
});

// ---------- Feature routes ----------
app.use('/api/auth', authRoutes);

// ---------- Fallbacks ----------
app.use(notFoundHandler);
app.use(errorHandler);

// ---------- Boot ----------
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const connectDatabase = async (retries = 5, delayMs = 3000): Promise<void> => {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await sequelize.authenticate();
      console.log(`[db] Connected to MySQL at ${env.db.host}:${env.db.port}/${env.db.name}`);
      return;
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      console.warn(`[db] Connection attempt ${attempt}/${retries} failed: ${reason}`);
      if (attempt === retries) throw err;
      await sleep(delayMs);
    }
  }
};

const start = async (): Promise<void> => {
  try {
    await connectDatabase();
  } catch {
    console.error('[db] Unable to connect to the database. Exiting.');
    process.exit(1);
  }

  const server: Server = app.listen(env.port, () => {
    console.log(`[server] Habit Shaper API listening on port ${env.port} (${env.nodeEnv})`);
  });

  const shutdown = (signal: string): void => {
    console.log(`[server] ${signal} received, shutting down...`);
    server.close(async () => {
      await sequelize.close();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

if (require.main === module) {
  void start();
}
