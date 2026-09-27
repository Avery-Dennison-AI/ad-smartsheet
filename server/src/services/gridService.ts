import crypto from 'crypto';
import mongoose from 'mongoose';
import Sheet, { type ISheet, type ColumnDef, type ColumnType } from '../models/Sheet';
import Row, { type IRow } from '../models/Row';
import Workspace from '../models/Workspace';
import { getMemberRole } from './workspaceService';
import { AppError } from '../utils/AppError';

// ─── Role hierarchy ────────────────────────────────────────────────────────

const ROLE_LEVEL: Record<string, number> = {
  viewer: 1,
  editor: 2,
  admin: 3,
  owner: 4,
};

function hasMinRole(userRole: string, minRole: string): boolean {
  return (ROLE_LEVEL[userRole] ?? 0) >= (ROLE_LEVEL[minRole] ?? 0);
}

type WorkspaceRole = 'viewer' | 'editor' | 'admin' | 'owner';

interface SheetWithAccess {
  sheet: ISheet;
  workspace: typeof Workspace.prototype;
  userRole: WorkspaceRole;
}

/**
 * Validates sheetId, loads the sheet and its workspace, checks membership,
 * and verifies the user has at least `requiredRole`.
 */
async function getSheetWithAccess(
  sheetId: string,
  userId: string,
  requiredRole: WorkspaceRole = 'viewer',
): Promise<SheetWithAccess> {
  if (!mongoose.Types.ObjectId.isValid(sheetId)) {
    throw new AppError('Invalid sheet ID', 400);
  }

  const sheet = await Sheet.findById(sheetId);
  if (!sheet) throw new AppError('Sheet not found', 404);

  const workspace = await Workspace.findById(sheet.workspaceId);
  if (!workspace) throw new AppError('Sheet not found', 404);

  const role = getMemberRole(workspace, userId);
  if (!role) throw new AppError('Access denied', 403);
  if (!hasMinRole(role, requiredRole)) {
    throw new AppError('Access denied', 403);
  }

  return { sheet, workspace, userRole: role as WorkspaceRole };
}

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

// ─── Cell validation ───────────────────────────────────────────────────────

function validateCellValue(type: ColumnType, value: unknown): unknown {
  if (value === null || value === undefined || value === '') return null;

  switch (type) {
    case 'text':
      return String(value);
    case 'number': {
      const num = Number(value);
      if (isNaN(num)) throw new AppError('Invalid number value', 400);
      return num;
    }
    case 'date': {
      const str = String(value);
      const d = new Date(str);
      if (isNaN(d.getTime())) throw new AppError('Invalid date value', 400);
      return str;
    }
    case 'dropdown':
      return String(value);
    case 'checkbox':
      return Boolean(value);
    case 'contact':
      return String(value);
    default:
      return value;
  }
}

// ─── Format helpers ────────────────────────────────────────────────────────

function formatRow(row: IRow) {
  const obj = row.toObject();
  return {
    id: row._id.toString(),
    order: row.order,
    cells: obj.cells || {},
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// ─── Public service functions ──────────────────────────────────────────────

/** Initializes default columns on a sheet that has none. */
export async function initDefaultColumns(sheetId: string, userId: string): Promise<ColumnDef[]> {
  const { sheet } = await getSheetWithAccess(sheetId, userId, 'editor');

  if (sheet.columns && sheet.columns.length > 0) {
    return sheet.columns;
  }

  const defaults = createDefaultColumns();
  await Sheet.findByIdAndUpdate(sheetId, { $set: { columns: defaults } });
  return defaults;
}

/** Gets the full grid (columns + rows) for a sheet. Requires viewer+. */
export async function getGrid(sheetId: string, userId: string) {
  const { sheet } = await getSheetWithAccess(sheetId, userId, 'viewer');

  // Auto-initialize default columns if empty
  let columns = sheet.columns;
  if (!columns || columns.length === 0) {
    columns = createDefaultColumns();
    await Sheet.findByIdAndUpdate(sheetId, { $set: { columns } });
  }

  const rows = await Row.find({ sheetId: new mongoose.Types.ObjectId(sheetId) })
    .sort({ order: 1 });

  return {
    columns: columns.map((c) => ({ ...c })),
    rows: rows.map(formatRow),
  };
}

/** Adds a column to the sheet. Requires editor+. */
export async function addColumn(
  sheetId: string,
  userId: string,
  data: { name: string; type: ColumnType; position?: number; options?: { label: string; color: string }[] },
) {
  const { sheet } = await getSheetWithAccess(sheetId, userId, 'editor');

  const existingColumns = [...(sheet.columns || [])];
  const newCol: ColumnDef = {
    id: crypto.randomUUID(),
    name: data.name.trim(),
    type: data.type,
    order: data.position ?? existingColumns.length,
    isPrimary: false,
    options: data.type === 'dropdown' ? (data.options || []) : undefined,
  };

  // Shift orders for columns at or after the insert position
  for (const col of existingColumns) {
    if (col.order >= newCol.order) {
      col.order += 1;
    }
  }

  existingColumns.push(newCol);
  existingColumns.sort((a, b) => a.order - b.order);

  await Sheet.findByIdAndUpdate(sheetId, { $set: { columns: existingColumns } });
  return newCol;
}

/** Updates a column (rename, type change, reorder, edit options). Requires editor+. */
export async function updateColumn(
  sheetId: string,
  userId: string,
  columnId: string,
  patch: { name?: string; type?: ColumnType; options?: { label: string; color: string }[] },
) {
  const { sheet } = await getSheetWithAccess(sheetId, userId, 'editor');

  const columns = [...(sheet.columns || [])];
  const colIndex = columns.findIndex((c) => c.id === columnId);
  if (colIndex === -1) throw new AppError('Column not found', 404);

  const col = { ...columns[colIndex] };

  if (patch.name !== undefined) {
    col.name = patch.name.trim();
  }

  if (patch.type !== undefined && patch.type !== col.type) {
    const oldType = col.type;
    col.type = patch.type;

    // Clear incompatible cell values when changing type
    const compatibleTransitions: Record<string, string[]> = {
      text: ['number', 'date', 'dropdown', 'contact'],
      number: ['text'],
      date: ['text'],
      dropdown: ['text'],
      checkbox: [],
      contact: ['text'],
    };

    const compatible = compatibleTransitions[oldType] || [];
    if (!compatible.includes(patch.type)) {
      // Clear all cells in this column
      await Row.updateMany(
        { sheetId: new mongoose.Types.ObjectId(sheetId) },
        { $unset: { [`cells.${columnId}`]: '' } },
      );
    }

    // Handle options for dropdown
    if (patch.type === 'dropdown') {
      col.options = patch.options || [];
    } else {
      col.options = undefined;
    }
  } else if (patch.options !== undefined && col.type === 'dropdown') {
    col.options = patch.options;
  }

  columns[colIndex] = col;
  await Sheet.findByIdAndUpdate(sheetId, { $set: { columns } });
  return col;
}

/** Deletes a column. Primary column cannot be deleted. Requires admin/owner. */
export async function deleteColumn(
  sheetId: string,
  userId: string,
  columnId: string,
) {
  const { sheet } = await getSheetWithAccess(sheetId, userId, 'admin');

  const columns = [...(sheet.columns || [])];
  const colIndex = columns.findIndex((c) => c.id === columnId);
  if (colIndex === -1) throw new AppError('Column not found', 404);

  if (columns[colIndex].isPrimary) {
    throw new AppError('Cannot delete the primary column', 400);
  }

  // Remove the column
  columns.splice(colIndex, 1);

  // Re-number remaining columns
  columns.sort((a, b) => a.order - b.order);
  columns.forEach((c, i) => { c.order = i; });

  // Cascade-clear cells for this column
  await Row.updateMany(
    { sheetId: new mongoose.Types.ObjectId(sheetId) },
    { $unset: { [`cells.${columnId}`]: '' } },
  );

  await Sheet.findByIdAndUpdate(sheetId, { $set: { columns } });
  return { deleted: true, columnId };
}

/** Reorders columns by providing an ordered array of column IDs. Requires editor+. */
export async function reorderColumns(
  sheetId: string,
  userId: string,
  orderedIds: string[],
) {
  const { sheet } = await getSheetWithAccess(sheetId, userId, 'editor');

  const columns = [...(sheet.columns || [])];
  const colMap = new Map(columns.map((c) => [c.id, c]));

  const reordered: ColumnDef[] = [];
  for (let i = 0; i < orderedIds.length; i++) {
    const col = colMap.get(orderedIds[i]);
    if (!col) throw new AppError(`Column ${orderedIds[i]} not found`, 400);
    reordered.push({ ...col, order: i });
  }

  await Sheet.findByIdAndUpdate(sheetId, { $set: { columns: reordered } });
  return reordered;
}

/** Adds a row. Optionally insert after a specific row. Requires editor+. */
export async function addRow(
  sheetId: string,
  userId: string,
  data?: { afterRowId?: string; cells?: Record<string, unknown> },
) {
  const { sheet } = await getSheetWithAccess(sheetId, userId, 'editor');

  // Validate cell values against column types
  const validatedCells: Record<string, unknown> = {};
  if (data?.cells) {
    const columns = sheet.columns || [];
    const colMap = new Map(columns.map((c) => [c.id, c]));
    for (const [colId, val] of Object.entries(data.cells)) {
      const col = colMap.get(colId);
      if (col) {
        validatedCells[colId] = validateCellValue(col.type, val);
      }
    }
  }

  let order: number;

  if (data?.afterRowId) {
    const afterRow = await Row.findById(data.afterRowId);
    if (!afterRow || afterRow.sheetId.toString() !== sheetId) {
      throw new AppError('Row not found', 404);
    }
    order = afterRow.order + 1;

    // Shift subsequent rows down
    await Row.updateMany(
      { sheetId: new mongoose.Types.ObjectId(sheetId), order: { $gte: order } },
      { $inc: { order: 1 } },
    );
  } else {
    // Append at end
    const lastRow = await Row.findOne({ sheetId: new mongoose.Types.ObjectId(sheetId) })
      .sort({ order: -1 });
    order = lastRow ? lastRow.order + 1 : 0;
  }

  const row = await Row.create({
    sheetId: new mongoose.Types.ObjectId(sheetId),
    order,
    cells: validatedCells,
  });

  return formatRow(row);
}

/** Updates a single cell value. Requires editor+. */
export async function updateCell(
  sheetId: string,
  userId: string,
  rowId: string,
  columnId: string,
  value: unknown,
) {
  const { sheet } = await getSheetWithAccess(sheetId, userId, 'editor');

  const columns = sheet.columns || [];
  const col = columns.find((c) => c.id === columnId);
  if (!col) throw new AppError('Column not found', 404);

  const row = await Row.findById(rowId);
  if (!row || row.sheetId.toString() !== sheetId) {
    throw new AppError('Row not found', 404);
  }

  const validated = validateCellValue(col.type, value);

  // For contact columns, validate the user is a workspace member
  if (col.type === 'contact' && validated !== null) {
    const workspace = await Workspace.findById(sheet.workspaceId);
    if (workspace) {
      const isMember = workspace.members.some(
        (m) => {
          const memberId = typeof m.user === 'string' ? m.user : String(m.user);
          return memberId === String(validated);
        },
      );
      if (!isMember) {
        throw new AppError('Contact must be a workspace member', 400);
      }
    }
  }

  await Row.findByIdAndUpdate(rowId, {
    $set: { [`cells.${columnId}`]: validated },
  });

  return { rowId, columnId, value: validated };
}

/** Deletes multiple rows. Requires admin/owner. */
export async function deleteRows(
  sheetId: string,
  userId: string,
  rowIds: string[],
) {
  await getSheetWithAccess(sheetId, userId, 'admin');

  // Validate all row IDs belong to this sheet
  const validIds = rowIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
  if (validIds.length === 0) throw new AppError('No valid row IDs provided', 400);

  const result = await Row.deleteMany({
    _id: { $in: validIds },
    sheetId: new mongoose.Types.ObjectId(sheetId),
  });

  return { deleted: result.deletedCount };
}

/** Reorders rows by providing an ordered array of row IDs. Requires editor+. */
export async function reorderRows(
  sheetId: string,
  userId: string,
  orderedIds: string[],
) {
  await getSheetWithAccess(sheetId, userId, 'editor');

  // Batch update orders
  const ops = orderedIds.map((id, index) => ({
    updateOne: {
      filter: { _id: new mongoose.Types.ObjectId(id), sheetId: new mongoose.Types.ObjectId(sheetId) },
      update: { $set: { order: index } },
    },
  }));

  if (ops.length > 0) {
    await Row.bulkWrite(ops);
  }

  return { reordered: orderedIds.length };
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
