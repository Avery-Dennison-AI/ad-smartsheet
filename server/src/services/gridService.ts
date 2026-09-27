import crypto from 'crypto';
import mongoose from 'mongoose';
import Sheet, { type ISheet, type ColumnDef, type ColumnType } from '../models/Sheet';
import Row, { type IRow } from '../models/Row';
import Workspace from '../models/Workspace';
import { getMemberRole, getMemberId } from './workspaceService';
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

// ─── Column serialization ──────────────────────────────────────────────────────

/**
 * Extracts explicit fields from a column (whether a raw object or a Mongoose
 * subdocument) and returns a plain JS object. Spreading a Mongoose subdocument
 * with `{ ...col }` copies internal properties like __parentArray instead of
 * actual field values, which corrupts data on re-save.
 */
function serializeColumn(col: any): ColumnDef {
  return {
    id: col.id ?? col._id?.toString(),
    name: col.name,
    type: col.type,
    order: col.order,
    isPrimary: col.isPrimary ?? false,
    options: col.options ? col.options.map((o: any) => ({ label: o.label, color: o.color })) : undefined,
    formatting: col.formatting ?? undefined,
  };
}

// ─── Format helpers ────────────────────────────────────────────────────────

function formatRow(row: IRow) {
  const obj = row.toObject();
  return {
    id: row._id.toString(),
    order: row.order,
    cells: obj.cells || {},
    formatting: row.formatting instanceof Map ? Object.fromEntries(row.formatting) : (obj.formatting || {}),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// ─── Public service functions ──────────────────────────────────────────────

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

  // Auto-initialize default columns if empty
  let columns = sheet.columns;
  if (!columns || columns.length === 0) {
    columns = createDefaultColumns();
    await Sheet.findByIdAndUpdate(sheetId, { $set: { columns } });
  }

  const rows = await Row.find({ sheetId: new mongoose.Types.ObjectId(sheetId) })
    .sort({ order: 1 });

  // Populate workspace members for contact column
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

/** Adds a column to the sheet. Requires editor+. */
export async function addColumn(
  sheetId: string,
  userId: string,
  data: { name: string; type: ColumnType; position?: number; options?: { label: string; color: string }[] },
) {
  const { sheet } = await getSheetWithAccess(sheetId, userId, 'editor');

  // Sort existing columns by order ascending
  const sorted = [...(sheet.columns || [])].map(serializeColumn);
  sorted.sort((a, b) => a.order - b.order);

  // Determine insertion index
  let insertIndex: number;
  if (data.position !== undefined && data.position !== null) {
    // Clamp to minimum 1 (after primary column) so we never insert before primary
    insertIndex = Math.max(1, Math.min(data.position, sorted.length));
  } else {
    // No position provided — append to end
    insertIndex = sorted.length;
  }

  const newCol: ColumnDef = {
    id: crypto.randomUUID(),
    name: data.name.trim(),
    type: data.type,
    order: 0, // will be renumbered below
    isPrimary: false,
    options: data.type === 'dropdown' ? (data.options || []) : undefined,
  };

  // Splice into the sorted array at the target index
  sorted.splice(insertIndex, 0, newCol);

  // Renumber all columns sequentially (no gaps)
  sorted.forEach((c, i) => { c.order = i; });

  await Sheet.findByIdAndUpdate(sheetId, { $set: { columns: sorted } });
  // Return the full sorted column list so the client can replace its state
  return sorted.map(serializeColumn);
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

  const col = serializeColumn(columns[colIndex]);

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

/** Sets a text column as the primary column. Requires editor+. */
export async function setPrimaryColumn(
  sheetId: string,
  userId: string,
  columnId: string,
): Promise<ColumnDef[]> {
  const { sheet } = await getSheetWithAccess(sheetId, userId, 'editor');

  const columns = [...(sheet.columns || [])];
  const targetIndex = columns.findIndex((c) => c.id === columnId);
  if (targetIndex === -1) throw new AppError('Column not found', 404);

  const targetCol = serializeColumn(columns[targetIndex]);
  if (targetCol.type !== 'text') {
    throw new AppError('Only text columns can be set as primary', 400);
  }

  // Find the current primary column
  const oldPrimaryIndex = columns.findIndex((c) => c.isPrimary);

  // Mark old primary as non-primary and move to order 1
  if (oldPrimaryIndex !== -1 && oldPrimaryIndex !== targetIndex) {
    const oldPrimary = serializeColumn(columns[oldPrimaryIndex]);
    oldPrimary.isPrimary = false;
    oldPrimary.order = 1;
    columns[oldPrimaryIndex] = oldPrimary;
  }

  // Mark target as primary and move to order 0
  targetCol.isPrimary = true;
  targetCol.order = 0;
  columns[targetIndex] = targetCol;

  // Shift all other columns' orders so they are sequential starting from 0
  // First sort by current order, then re-number
  const serialized = columns.map(serializeColumn);
  serialized.sort((a, b) => a.order - b.order);
  serialized.forEach((c, i) => { c.order = i; });

  await Sheet.findByIdAndUpdate(sheetId, { $set: { columns: serialized } });
  return serialized;
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
    throw new AppError('Set another column as primary before deleting this one.', 400);
  }

  // Remove the column and serialize remaining
  const remaining = columns
    .filter((_, i) => i !== colIndex)
    .map(serializeColumn);

  // Renumber remaining columns sequentially (no gaps)
  remaining.sort((a, b) => a.order - b.order);
  remaining.forEach((c, i) => { c.order = i; });

  // Cascade-clear cells for this column
  await Row.updateMany(
    { sheetId: new mongoose.Types.ObjectId(sheetId) },
    { $unset: { [`cells.${columnId}`]: '' } },
  );

  await Sheet.findByIdAndUpdate(sheetId, { $set: { columns: remaining } });
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

  // Verify primary column is first in the new order
  if (orderedIds.length > 0) {
    const firstCol = colMap.get(orderedIds[0]);
    if (!firstCol) throw new AppError(`Column ${orderedIds[0]} not found`, 400);
    if (!firstCol.isPrimary) {
      throw new AppError('Primary column must remain first', 400);
    }
  }

  const reordered: ColumnDef[] = [];
  for (let i = 0; i < orderedIds.length; i++) {
    const col = colMap.get(orderedIds[i]);
    if (!col) throw new AppError(`Column ${orderedIds[i]} not found`, 400);
    reordered.push({ ...serializeColumn(col), order: i });
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

/** Updates cell formatting for multiple cells across rows. Requires editor+.
 *  Merges the incoming patch into existing cell formatting (does not overwrite).
 *  Null values in the patch mean "unset this property". */
export async function updateFormatting(
  sheetId: string,
  userId: string,
  cells: Array<{ rowId: string; columnId: string; formatting: Record<string, unknown> | null }>,
) {
  await getSheetWithAccess(sheetId, userId, 'editor');

  // Validate formatting keys and values
  const ALLOWED_FORMAT_KEYS = new Set([
    'fontFamily', 'fontSize', 'bold', 'italic', 'underline', 'strikethrough',
    'textAlign', 'verticalAlign', 'textColor', 'fillColor',
  ]);
  const HEX_RE = /^#[0-9A-Fa-f]{6}$/;
  const TEXT_ALIGN_VALUES = new Set(['left', 'center', 'right']);
  const VERTICAL_ALIGN_VALUES = new Set(['top', 'middle', 'bottom']);

  for (const entry of cells) {
    if (entry.formatting === null) continue;
    for (const [key, value] of Object.entries(entry.formatting)) {
      if (!ALLOWED_FORMAT_KEYS.has(key)) {
        throw new AppError(`Unknown formatting key: ${key}`, 400);
      }
      if (value === null || value === undefined) continue;
      if ((key === 'textColor' || key === 'fillColor') && !HEX_RE.test(String(value))) {
        throw new AppError(`Invalid hex color for ${key}: ${value}`, 400);
      }
      if (key === 'textAlign' && !TEXT_ALIGN_VALUES.has(String(value))) {
        throw new AppError(`Invalid textAlign value: ${value}`, 400);
      }
      if (key === 'verticalAlign' && !VERTICAL_ALIGN_VALUES.has(String(value))) {
        throw new AppError(`Invalid verticalAlign value: ${value}`, 400);
      }
    }
  }

  // Validate all row IDs belong to this sheet and build bulk ops
  const validRowIds = cells
    .map((e) => e.rowId)
    .filter((id) => mongoose.Types.ObjectId.isValid(id));

  if (validRowIds.length === 0) return { updated: 0 };

  // Validate all rows belong to this sheet in one query
  const validRows = await Row.find({
    _id: { $in: validRowIds },
    sheetId: new mongoose.Types.ObjectId(sheetId),
  }).select('_id');

  const validRowIdSet = new Set(validRows.map((r) => r._id.toString()));

  // Build bulk write operations — merge each field via dot-notation
  const ops: Array<{ updateOne: { filter: Record<string, unknown>; update: Record<string, unknown> } }> = [];

  for (const entry of cells) {
    if (!validRowIdSet.has(entry.rowId)) continue;

    if (entry.formatting === null) {
      // Null formatting = remove all cell-level formatting for this column
      ops.push({
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(entry.rowId) },
          update: { $unset: { [`formatting.${entry.columnId}`]: '' } },
        },
      });
    } else if (Object.keys(entry.formatting).length > 0) {
      // Build $set and $unset maps based on null vs non-null values
      const setFields: Record<string, unknown> = {};
      const unsetFields: Record<string, string> = {};

      for (const [key, value] of Object.entries(entry.formatting)) {
        if (value === null) {
          unsetFields[`formatting.${entry.columnId}.${key}`] = '';
        } else if (value !== undefined) {
          setFields[`formatting.${entry.columnId}.${key}`] = value;
        }
      }

      // Build the update object with both $set and $unset if needed
      const update: Record<string, unknown> = {};
      if (Object.keys(setFields).length > 0) {
        update.$set = setFields;
      }
      if (Object.keys(unsetFields).length > 0) {
        update.$unset = unsetFields;
      }

      if (Object.keys(update).length > 0) {
        ops.push({
          updateOne: {
            filter: { _id: new mongoose.Types.ObjectId(entry.rowId) },
            update,
          },
        });
      }
    }
  }

  if (ops.length > 0) {
    await Row.bulkWrite(ops);
  }

  return { updated: ops.length };
}

/** Updates column-level formatting for one or more columns. Requires editor+.
 *  If cascadePatch is provided, also clears matching cell-level overrides so the column setting takes effect.
 *  Null values in the formatting patch mean "unset this property". */
export async function updateColumnFormatting(
  sheetId: string,
  userId: string,
  columns: Array<{ columnId: string; formatting: Record<string, unknown> | null }>,
  cascadePatch?: Record<string, unknown>,
) {
  const { sheet } = await getSheetWithAccess(sheetId, userId, 'editor');

  // Validate formatting keys and values
  const ALLOWED_FORMAT_KEYS = new Set([
    'fontFamily', 'fontSize', 'bold', 'italic', 'underline', 'strikethrough',
    'textAlign', 'verticalAlign', 'textColor', 'fillColor',
  ]);
  const HEX_RE = /^#[0-9A-Fa-f]{6}$/;
  const TEXT_ALIGN_VALUES = new Set(['left', 'center', 'right']);
  const VERTICAL_ALIGN_VALUES = new Set(['top', 'middle', 'bottom']);

  for (const entry of columns) {
    if (entry.formatting === null) continue;
    for (const [key, value] of Object.entries(entry.formatting)) {
      if (!ALLOWED_FORMAT_KEYS.has(key)) {
        throw new AppError(`Unknown formatting key: ${key}`, 400);
      }
      if (value === null || value === undefined) continue;
      if ((key === 'textColor' || key === 'fillColor') && !HEX_RE.test(String(value))) {
        throw new AppError(`Invalid hex color for ${key}: ${value}`, 400);
      }
      if (key === 'textAlign' && !TEXT_ALIGN_VALUES.has(String(value))) {
        throw new AppError(`Invalid textAlign value: ${value}`, 400);
      }
      if (key === 'verticalAlign' && !VERTICAL_ALIGN_VALUES.has(String(value))) {
        throw new AppError(`Invalid verticalAlign value: ${value}`, 400);
      }
    }
  }

  const sheetColumns = [...(sheet.columns || [])];
  let updatedCount = 0;

  for (const entry of columns) {
    const colIndex = sheetColumns.findIndex((c) => c.id === entry.columnId);
    if (colIndex === -1) continue;

    const col = serializeColumn(sheetColumns[colIndex]);
    if (entry.formatting === null) {
      // Null formatting = remove all column-level formatting
      col.formatting = undefined;
    } else if (Object.keys(entry.formatting).length > 0) {
      // Merge into existing column formatting; null values delete keys
      const existing = col.formatting ?? {};
      const merged: Record<string, unknown> = { ...existing };
      for (const [k, v] of Object.entries(entry.formatting)) {
        if (v === null) {
          delete merged[k];
        } else if (v !== undefined) {
          merged[k] = v;
        }
      }
      if (Object.keys(merged).length === 0) {
        col.formatting = undefined;
      } else {
        col.formatting = merged as Record<string, unknown>;
      }
    }
    sheetColumns[colIndex] = col;
    updatedCount++;
  }

  if (updatedCount > 0) {
    await Sheet.findByIdAndUpdate(sheetId, { $set: { columns: sheetColumns } });
  }

  // Cascade: clear matching cell-level formatting overrides for these columns
  if (cascadePatch && Object.keys(cascadePatch).length > 0) {
    const columnIds = columns.map((e) => e.columnId);
    const patchKeys = Object.keys(cascadePatch);

    // Find all rows that have formatting overrides for any of these columns + keys
    const validRows = await Row.find({
      sheetId: new mongoose.Types.ObjectId(sheetId),
    }).select('_id formatting');

    const ops: Array<{ updateOne: { filter: Record<string, unknown>; update: Record<string, unknown> } }> = [];

    for (const row of validRows) {
      const rowObj = row.toObject();
      const fmt = rowObj.formatting instanceof Map ? Object.fromEntries(rowObj.formatting) : (rowObj.formatting || {});

      for (const colId of columnIds) {
        const cellFmt = fmt[colId];
        if (!cellFmt) continue;

        // Check if any patch key exists in this cell's formatting
        const hasOverride = patchKeys.some((key) => key in cellFmt);
        if (!hasOverride) continue;

        // Build unset operations for each overridden key
        const unsetFields: Record<string, string> = {};
        for (const key of patchKeys) {
          if (key in cellFmt) {
            unsetFields[`formatting.${colId}.${key}`] = '';
          }
        }

        if (Object.keys(unsetFields).length > 0) {
          ops.push({
            updateOne: {
              filter: { _id: row._id },
              update: { $unset: unsetFields },
            },
          });
        }
      }
    }

    if (ops.length > 0) {
      await Row.bulkWrite(ops);
    }
  }

  return { updated: updatedCount };
}
