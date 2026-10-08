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
import workspaceSheetsRouter from './routes/workspaceSheets';
import sheetsRouter from './routes/sheets';
import sheetSharingRouter from './routes/sheetSharing';
import userSheetsRouter from './routes/userSheets';
import gridRouter from './routes/grid';
import userPreferencesRouter from './routes/userPreferences';
import usersRouter from './routes/users';
import orgPolicyRouter from './routes/orgPolicy';
import myWorkRouter from './routes/myWork';
import { seedAdmin } from './config/seedAdmin';
import { migrateWorkspaceColors, repairBrokenColumns, repairPrimaryColumnOrder, migrateUserRoles, backfillRowAssigneeIds, backfillProjectSettingIds } from './config/migrations';
import { sendSuccess } from './utils/response';

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
app.use(express.json({ limit: '50kb' }));

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
app.use('/api/workspaces', workspaceSheetsRouter);
app.use('/api/sheets', sheetsRouter);
app.use('/api/sheets/:sheetId/members', sheetSharingRouter);
app.use('/api/sheets/:sheetId/grid', gridRouter);
app.use('/api/user', userSheetsRouter);
app.use('/api/user', userPreferencesRouter);
app.use('/api/users', usersRouter);
app.use('/api/org-policy', orgPolicyRouter);
app.use('/api/my-work', myWorkRouter);

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── DB + Server Bootstrap ────────────────────────────────────────────────────

async function start(): Promise<void> {
  try {
    console.log('[startup] Config loaded');
    console.log('[startup] Connecting to database...');
    await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 10_000 });
    console.log('[startup] Database connected');

    const seedResult = await seedAdmin();
    console.log(`[startup] Admin seed: ${seedResult}`);

    await migrateWorkspaceColors();
    await repairBrokenColumns();
    await repairPrimaryColumnOrder();
    await migrateUserRoles();
    await backfillRowAssigneeIds();
    await backfillProjectSettingIds();

    app.listen(env.PORT, () => {
      console.log(`[startup] Server listening on port ${env.PORT}`);
    });
  } catch (err) {
    console.error('[startup] Failed to start server:', err);
    process.exit(1);
  }
}

start();
