import crypto from 'crypto';
import mongoose from 'mongoose';
import Sheet, { type ColumnDef } from '../models/Sheet';
import Row from '../models/Row';
import Workspace from '../models/Workspace';
import { getMemberId } from './workspaceService';
import { getSheetWithAccess, serializeColumn, formatRow } from './gridShared';

// Re-export sub-services for backward-compatible imports
export { addColumn, updateColumn, deleteColumn, reorderColumns, setPrimaryColumn, updateColumnWidth } from './columnService';
export { addRow, updateCell, deleteRows, reorderRows, updateRowHeights } from './rowService';
export { updateFormatting, updateColumnFormatting } from './formattingService';

// ─── Default columns ───────────────────────────────────────────────────────

function createDefaultColumns(): ColumnDef[] {
  return [
    { id: crypto.randomUUID(), name: 'Task Name', type: 'text', order: 0, isPrimary: true },
    { id: crypto.randomUUID(), name: 'Assigned To', type: 'contact', order: 1, isPrimary: false },
    {
      id: crypto.randomUUID(),
      name: 'Status',
      type: 'dropdown',
      order: 2,
      isPrimary: false,
      options: [
        { label: 'Not Started', color: 'gray' },
        { label: 'In Progress', color: 'blue' },
        { label: 'Complete', color: 'green' },
      ],
    },
    { id: crypto.randomUUID(), name: 'Start Date', type: 'date', order: 3, isPrimary: false },
    { id: crypto.randomUUID(), name: 'Due Date', type: 'date', order: 4, isPrimary: false },
    { id: crypto.randomUUID(), name: 'Done', type: 'checkbox', order: 5, isPrimary: false },
  ];
}

/** Initializes default columns on a sheet that has none. */
export async function initDefaultColumns(sheetId: string, userId: string): Promise<ColumnDef[]> {
  const { sheet } = await getSheetWithAccess(sheetId, userId, 'editor');

  if (sheet.columns && sheet.columns.length > 0) {
    return sheet.columns.map(serializeColumn);
  }

  const defaults = createDefaultColumns();
  await Sheet.findByIdAndUpdate(sheetId, { $set: { columns: defaults } });
  return defaults;
}

/** Gets the full grid (columns + rows) for a sheet. Requires viewer+. */
export async function getGrid(sheetId: string, userId: string) {
  const { sheet, workspace } = await getSheetWithAccess(sheetId, userId, 'viewer');

  let columns = sheet.columns;
  if (!columns || columns.length === 0) {
    columns = createDefaultColumns();
    await Sheet.findByIdAndUpdate(sheetId, { $set: { columns } });
  }

  const rows = await Row.find({ sheetId: new mongoose.Types.ObjectId(sheetId) })
    .sort({ order: 1 });

  const populatedWorkspace = await Workspace.findById(workspace._id).populate('members.user', 'fullName email');

  const members = (populatedWorkspace?.members ?? [])
    .filter((m: any) => m.isActive !== false)
    .map((m: any) => ({
      id: getMemberId(m.user),
      fullName: typeof m.user === 'string' ? '' : m.user.fullName,
      email: typeof m.user === 'string' ? '' : m.user.email,
    }));

  return {
    columns: columns.map(serializeColumn),
    rows: rows.map(formatRow),
    members,
  };
}

/** Deletes all rows for a sheet. Called during sheet deletion. */
export async function deleteRowsBySheet(sheetId: string): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(sheetId)) return;
  await Row.deleteMany({ sheetId: new mongoose.Types.ObjectId(sheetId) });
}

/** Deletes all rows for all sheets in a workspace. Called during workspace deletion. */
export async function deleteRowsByWorkspace(workspaceId: string): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(workspaceId)) return;

  const sheets = await Sheet.find({ workspaceId: new mongoose.Types.ObjectId(workspaceId) }).select('_id');
  const sheetIds = sheets.map((s) => s._id);

  if (sheetIds.length > 0) {
    await Row.deleteMany({ sheetId: { $in: sheetIds } });
  }
}
