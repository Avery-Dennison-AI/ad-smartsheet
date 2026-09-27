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
import workspacesRouter from './routes/workspaces';
import { seedAdmin } from './config/seedAdmin';
import { sendSuccess } from './utils/response';
import Workspace, { WORKSPACE_COLORS } from './models/Workspace';

// ─── Process-Level Error Handlers ──────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  console.error('[fatal] Uncaught exception:', err.stack ?? err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('[fatal] Unhandled rejection:', reason);
  process.exit(1);
});

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
app.get('/api/health', (_req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState; // 1 = connected
  sendSuccess(res, {
    status: 'ok',
    db: dbState === 1 ? 'connected' : 'disconnected',
  });
});

// ─── Auth Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);

// ─── Invitation & Admin User Routes ───────────────────────────────────────────
app.use('/api', invitationsRouter);
app.use('/api/admin', adminUsersRouter);
app.use('/api/workspaces', workspacesRouter);

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── DB + Server Bootstrap ────────────────────────────────────────────────────

/** Hex-to-palette-name mapping for one-time colour migration. */
const HEX_TO_PALETTE: Record<string, string> = {
  '#0ea5e9': 'blue',
  '#14b8a6': 'teal',
  '#22c55e': 'green',
  '#10b981': 'green',
  '#eab308': 'yellow',
  '#f59e0b': 'yellow',
  '#ef4444': 'red',
  '#dc2626': 'red',
  '#a855f7': 'purple',
  '#8b5cf6': 'purple',
  '#ec4899': 'purple',
  '#f97316': 'yellow',
};

async function migrateWorkspaceColors(): Promise<void> {
  const docs = await Workspace.find({ color: { $nin: [...WORKSPACE_COLORS] } }).select('_id color');
  if (docs.length === 0) return;

  let migrated = 0;
  for (const doc of docs) {
    const hex = (doc as unknown as { color: string }).color?.toLowerCase();
    const paletteName = HEX_TO_PALETTE[hex] || 'gray';
    await Workspace.updateOne({ _id: doc._id }, { $set: { color: paletteName } });
    migrated++;
  }
  console.log(`[startup] Migrated ${migrated} workspace(s) from hex colours to palette names`);
}

async function start(): Promise<void> {
  try {
    console.log('[startup] Config loaded');
    console.log('[startup] Connecting to database...');
    await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 10_000 });
    console.log('[startup] Database connected');

    const seedResult = await seedAdmin();
    console.log(`[startup] Admin seed: ${seedResult}`);

    await migrateWorkspaceColors();

    app.listen(env.PORT, () => {
      console.log(`[startup] Server listening on port ${env.PORT}`);
    });
  } catch (err) {
    console.error('[startup] Failed to start server:', err);
    process.exit(1);
  }
}

start();
