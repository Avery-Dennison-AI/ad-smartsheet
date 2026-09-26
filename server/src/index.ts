import { env } from './config/env';

import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorMiddleware';
import { UPLOADS_DIR } from './paths';
import authRouter from './routes/auth';
import invitationsRouter from './routes/invitations';
import adminUsersRouter from './routes/adminUsers';
import { seedAdmin } from './config/seedAdmin';

// ─── Config ───────────────────────────────────────────────────────────────────
const app = express();
app.set('trust proxy', 1);

// ─── CORS ─────────────────────────────────────────────────────────────────────
let apiOrigin: string | null = null;
try {
  if (env.VITE_API_URL) apiOrigin = new URL(env.VITE_API_URL).origin;
} catch {
  // VITE_API_URL missing or not a valid URL — leave null (localhost-only below).
}
const corsOrigins: (string | RegExp)[] = [/^http:\/\/localhost:\d+$/];
if (apiOrigin) corsOrigins.push(apiOrigin);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));

// ─── Static Uploads ───────────────────────────────────────────────────────────
app.use('/api/uploads', express.static(UPLOADS_DIR));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req: Request, res: Response) =>
  res.json({ success: true, message: 'Server is running' })
);

// ─── Auth Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);

// ─── Invitation & Admin User Routes ───────────────────────────────────────────
app.use('/api', invitationsRouter);
app.use('/api/admin', adminUsersRouter);

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── DB + Server Bootstrap ────────────────────────────────────────────────────
async function start(): Promise<void> {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('[DB] Connected to MongoDB');

    // Seed admin user from env vars
    await seedAdmin();

    app.listen(env.PORT, () => {
      console.log(`[SERVER] Running on port ${env.PORT}`);
    });
  } catch (err) {
    console.error('[STARTUP] Failed to start server:', err);
    process.exit(1);
  }
}

start();
