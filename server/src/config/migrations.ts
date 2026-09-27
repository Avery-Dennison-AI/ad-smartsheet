import Workspace, { WORKSPACE_COLORS } from '../models/Workspace';
import Sheet from '../models/Sheet';
import type { ColumnDef } from '../models/Sheet';

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
