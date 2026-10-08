import mongoose from 'mongoose';
import ActivityLog, { type ActivityAction } from '../models/ActivityLog';
import { requireSheetAccess } from './permissionService';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ActivityInput {
  sheetId: string;
  rowId?: string;
  actorId: string;
  action: ActivityAction;
  details?: Record<string, unknown>;
}

export interface ActivityEntry {
  id: string;
  sheetId: string;
  rowId: string | null;
  actorId: string;
  actorName: string;
  action: ActivityAction;
  details: Record<string, unknown> | null;
  createdAt: Date;
}

export interface ActivityPage {
  entries: ActivityEntry[];
  nextCursor: string | null;
}

// ─── Recording (fire-and-forget, never throws) ──────────────────────────────

/**
 * Records a single activity log entry. Never throws — errors are logged
 * and swallowed so the caller's transaction is never aborted.
 */
export function recordActivity(input: ActivityInput): void {
  ActivityLog.create({
    sheetId: new mongoose.Types.ObjectId(input.sheetId),
    rowId: input.rowId ? new mongoose.Types.ObjectId(input.rowId) : undefined,
    actorId: new mongoose.Types.ObjectId(input.actorId),
    action: input.action,
    details: input.details ?? undefined,
  }).catch((err) => {
    console.error('[activityService] Failed to record activity:', err);
  });
}

/**
 * Records multiple activity log entries in bulk. Never throws — errors are
 * logged and swallowed so the caller's transaction is never aborted.
 */
export function recordActivities(inputs: ActivityInput[]): void {
  if (inputs.length === 0) return;

  const docs = inputs.map((input) => ({
    sheetId: new mongoose.Types.ObjectId(input.sheetId),
    rowId: input.rowId ? new mongoose.Types.ObjectId(input.rowId) : undefined,
    actorId: new mongoose.Types.ObjectId(input.actorId),
    action: input.action,
    details: input.details ?? undefined,
  }));

  ActivityLog.insertMany(docs).catch((err) => {
    console.error('[activityService] Failed to record activities (bulk):', err);
  });
}

// ─── Querying ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

/**
 * Formats an ActivityLog document into an API response entry.
 * Populates actor name, formatting deleted users as "name (deleted)".
 */
function formatEntry(doc: any): ActivityEntry {
  const actor = doc.actorId as { _id?: mongoose.Types.ObjectId; fullName?: string; isDeleted?: boolean; deletedAt?: Date } | string;
  let actorName: string;
  if (actor && typeof actor === 'object' && 'fullName' in actor) {
    const name = actor.fullName ?? 'Unknown';
    actorName = (actor.isDeleted || actor.deletedAt) ? `${name} (deleted)` : name;
  } else {
    actorName = 'Unknown';
  }

  return {
    id: doc._id.toString(),
    sheetId: doc.sheetId.toString(),
    rowId: doc.rowId ? doc.rowId.toString() : null,
    actorId: typeof actor === 'object' && actor._id ? actor._id.toString() : String(actor),
    actorName,
    action: doc.action,
    details: doc.details ?? null,
    createdAt: doc.createdAt,
  };
}

/**
 * Returns paginated activity for a specific row within a sheet.
 * Requires viewer+ access on the sheet.
 */
export async function getRowActivity(
  sheetId: string,
  rowId: string,
  userId: string,
  options?: { before?: string },
): Promise<ActivityPage> {
  await requireSheetAccess(userId, sheetId, 'viewer');

  const filter: Record<string, unknown> = {
    sheetId: new mongoose.Types.ObjectId(sheetId),
    rowId: new mongoose.Types.ObjectId(rowId),
  };

  if (options?.before) {
    filter.createdAt = { $lt: new Date(options.before) };
  }

  const docs = await ActivityLog.find(filter)
    .sort({ createdAt: -1 })
    .limit(PAGE_SIZE)
    .populate('actorId', 'fullName isDeleted deletedAt');

  const entries = docs.map(formatEntry);
  const nextCursor = docs.length === PAGE_SIZE
    ? docs[docs.length - 1].createdAt.toISOString()
    : null;

  return { entries, nextCursor };
}

/**
 * Returns paginated activity for an entire sheet.
 * Requires viewer+ access on the sheet.
 */
export async function getSheetActivity(
  sheetId: string,
  userId: string,
  options?: { before?: string },
): Promise<ActivityPage> {
  await requireSheetAccess(userId, sheetId, 'viewer');

  const filter: Record<string, unknown> = {
    sheetId: new mongoose.Types.ObjectId(sheetId),
  };

  if (options?.before) {
    filter.createdAt = { $lt: new Date(options.before) };
  }

  const docs = await ActivityLog.find(filter)
    .sort({ createdAt: -1 })
    .limit(PAGE_SIZE)
    .populate('actorId', 'fullName isDeleted deletedAt');

  const entries = docs.map(formatEntry);
  const nextCursor = docs.length === PAGE_SIZE
    ? docs[docs.length - 1].createdAt.toISOString()
    : null;

  return { entries, nextCursor };
}
