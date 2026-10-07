import Workspace, { WORKSPACE_COLORS } from '../models/Workspace';
import Sheet from '../models/Sheet';
import User from '../models/User';
import Row from '../models/Row';
import type { ColumnDef } from '../models/Sheet';
import { computeAssigneeIds } from '../services/rowService';

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

export async function migrateWorkspaceColors(): Promise<void> {
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

/**
 * Repairs sheets whose columns were corrupted by spreading Mongoose
 * subdocuments (which copies internal properties instead of field values).
 * A column is considered broken if it lacks an `id` or `name` field.
 */
export async function repairBrokenColumns(): Promise<void> {
  const sheets = await Sheet.find({}).select('_id columns');
  let repairedCount = 0;

  for (const sheet of sheets) {
    const columns = sheet.columns;
    if (!columns || columns.length === 0) continue;

    let needsRepair = false;
    const repaired = columns.map((col: any) => {
      const hasId = col.id != null && col.id !== '';
      const hasName = col.name != null && col.name !== '';

      if (hasId && hasName) return col;

      needsRepair = true;
      return {
        id: col.id ?? col._id?.toString() ?? `repaired-${Math.random().toString(36).slice(2, 10)}`,
        name: col.name || 'Column',
        type: col.type || 'text',
        order: col.order ?? 0,
        isPrimary: col.isPrimary ?? false,
        options: col.options
          ? col.options.map((o: any) => ({ label: o.label, color: o.color }))
          : undefined,
      };
    });

    if (needsRepair) {
      await Sheet.findByIdAndUpdate(sheet._id, { $set: { columns: repaired } });
      repairedCount++;
    }
  }

  if (repairedCount > 0) {
    console.log(`[startup] Repaired ${repairedCount} sheet(s) with broken column data`);
  }
}

/**
 * Ensures the primary column (isPrimary: true) is always at order 0.
 * If the primary column is not first, moves it there and re-numbers all columns.
 */
export async function repairPrimaryColumnOrder(): Promise<void> {
  const sheets = await Sheet.find({}).select('_id columns');
  let repairedCount = 0;

  for (const sheet of sheets) {
    const columns = sheet.columns;
    if (!columns || columns.length === 0) continue;

    // Sort by current order
    const sorted = [...columns].sort((a: ColumnDef, b: ColumnDef) => a.order - b.order);

    // Check if the first column in sorted order is the primary one
    if (sorted[0]?.isPrimary) continue;

    // Find the primary column
    const primaryIdx = sorted.findIndex((c: ColumnDef) => c.isPrimary);
    if (primaryIdx === -1) continue; // No primary column — skip

    // Move primary to front and re-number
    const primaryCol = sorted.splice(primaryIdx, 1)[0];
    sorted.unshift(primaryCol);
    sorted.forEach((c: ColumnDef, i: number) => { c.order = i; });

    await Sheet.findByIdAndUpdate(sheet._id, { $set: { columns: sorted } });
    repairedCount++;
  }

  if (repairedCount > 0) {
    console.log(`[startup] Repaired primary column order in ${repairedCount} sheet(s)`);
  }
}

/**
 * Migrates users from the old dual-field role system (role + orgRole) to the
 * unified single `role` field. If a user had orgRole='guest', their role is
 * set to 'guest'. The orgRole field is then unset.
 * This is idempotent and safe to run multiple times.
 */
export async function migrateUserRoles(): Promise<void> {
  // Find users that still have orgRole set (legacy data)
  const users = await User.find({ orgRole: { $exists: true, $ne: null } }).select('_id role orgRole');
  if (users.length === 0) return;

  let migrated = 0;
  for (const user of users) {
    const doc = user as unknown as { _id: unknown; role: string; orgRole?: string };
    const updates: Record<string, unknown> = {};

    // If orgRole was 'guest' and role isn't already 'guest', set role to 'guest'
    if (doc.orgRole === 'guest' && doc.role !== 'guest') {
      updates.role = 'guest';
    }

    // Unset orgRole
    await User.updateOne(
      { _id: doc._id },
      {
        ...(Object.keys(updates).length > 0 ? { $set: updates } : {}),
        $unset: { orgRole: '' },
      },
    );
    migrated++;
  }

  if (migrated > 0) {
    console.log(`[startup] Migrated ${migrated} user(s) from orgRole to unified role field`);
  }
}

/**
 * Backfills the `assigneeIds` field on all existing rows that don't have it yet.
 * For each row, looks up its sheet's columns, extracts contact column ids,
 * and computes assigneeIds from cell values. Uses cursor-based batch iteration.
 * Idempotent: skips rows that already have assigneeIds populated.
 */
export async function backfillRowAssigneeIds(): Promise<void> {
  const BATCH_SIZE = 500;

  // Build a map of sheetId → columns for sheets that have contact columns
  const sheetsWithContact = await Sheet.find({
    'columns': { $elemMatch: { type: 'contact' } },
  }).select('_id columns');

  if (sheetsWithContact.length === 0) return;

  const sheetColumnsMap = new Map<string, ColumnDef[]>();
  const sheetIds: string[] = [];
  for (const sheet of sheetsWithContact) {
    sheetColumnsMap.set(sheet._id.toString(), sheet.columns);
    sheetIds.push(sheet._id.toString());
  }

  let updatedCount = 0;
  let processedCount = 0;

  // Process rows in batches using cursor
  const cursor = Row.find({
    sheetId: { $in: sheetIds },
    $or: [
      { assigneeIds: { $exists: false } },
      { assigneeIds: { $size: 0 } },
    ],
  }).cursor();

  const batch: Array<{ rowId: string; assigneeIds: ReturnType<typeof computeAssigneeIds> }> = [];

  for await (const row of cursor) {
    const sheetIdStr = row.sheetId.toString();
    const columns = sheetColumnsMap.get(sheetIdStr);
    if (!columns) continue;

    const cells = (row.toObject().cells as unknown as Record<string, unknown>) ?? {};
    const assigneeIds = computeAssigneeIds(cells, columns);

    batch.push({ rowId: row._id.toString(), assigneeIds });
    processedCount++;

    if (batch.length >= BATCH_SIZE) {
      const ops = batch.map((item) => ({
        updateOne: {
          filter: { _id: item.rowId },
          update: { $set: { assigneeIds: item.assigneeIds } },
        },
      }));
      const result = await Row.bulkWrite(ops);
      updatedCount += result.modifiedCount;
      batch.length = 0;
    }
  }

  // Flush remaining batch
  if (batch.length > 0) {
    const ops = batch.map((item) => ({
      updateOne: {
        filter: { _id: item.rowId },
        update: { $set: { assigneeIds: item.assigneeIds } },
      },
    }));
    const result = await Row.bulkWrite(ops);
    updatedCount += result.modifiedCount;
  }

  if (updatedCount > 0) {
    console.log(`[startup] Backfilled assigneeIds on ${updatedCount} row(s) (processed ${processedCount})`);
  }
}
