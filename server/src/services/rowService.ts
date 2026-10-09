import mongoose from 'mongoose';
import Row, { type IRow } from '../models/Row';
import Sheet, { type ISheet } from '../models/Sheet';
import Comment from '../models/Comment';
import Workspace from '../models/Workspace';
import User from '../models/User';
import { getSheetWithAccess, validateCellValue, formatRow } from './gridShared';
import { recordActivity, recordActivities } from './activityService';
import { deleteAttachmentsForRows } from './attachmentService';
import { AppError } from '../utils/AppError';
import {
  type HierarchyRow,
  insertRow as pureInsertRow,
  indentRows as pureIndentRows,
  outdentRows as pureOutdentRows,
  moveRows as pureMoveRows,
  deleteRows as pureDeleteRows,
  validateHierarchy,
} from './hierarchy';
import type { ColumnDef } from '../models/Sheet';

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Parses a YYYY-MM-DD string into a UTC millisecond timestamp without
 * any local-timezone offset. Returns NaN for invalid input.
 */
export function parseDateUTC(dateStr: string): number {
  if (!dateStr || typeof dateStr !== 'string') return NaN;
  // Accept both YYYY-MM-DD and ISO timestamp formats
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return NaN;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const day = parseInt(match[3], 10);
  return Date.UTC(year, month, day);
}

/**
 * Formats a UTC millisecond timestamp as YYYY-MM-DD using UTC getters
 * (no timezone shift, no .toISOString()).
 */
export function formatDateUTC(ms: number): string {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Calculates duration (inclusive days) between two YYYY-MM-DD strings.
 * Uses pure UTC arithmetic — no local-timezone offset.
 */
export function calculateDuration(startStr: string, dueStr: string): number | null {
  const startMs = parseDateUTC(startStr);
  const dueMs = parseDateUTC(dueStr);
  if (isNaN(startMs) || isNaN(dueMs)) return null;
  return Math.round((dueMs - startMs) / 86_400_000) + 1;
}

/**
 * Calculates the Due date (YYYY-MM-DD) from a Start date and Duration.
 * Duration is inclusive (duration=1 means same day).
 * Uses pure UTC arithmetic — no local-timezone offset.
 */
export function calculateDueDate(startStr: string, duration: number): string | null {
  const startMs = parseDateUTC(startStr);
  if (isNaN(startMs) || !isFinite(duration)) return null;
  const dueMs = startMs + (duration - 1) * 86_400_000;
  return formatDateUTC(dueMs);
}

/**
 * Computes a deduplicated array of user ObjectIds from contact-type cell values.
 * Exported for use in tests and the backfill migration.
 */
export function computeAssigneeIds(
  cells: Record<string, unknown>,
  columns: ColumnDef[],
): mongoose.Types.ObjectId[] {
  const seen = new Set<string>();
  const result: mongoose.Types.ObjectId[] = [];

  for (const col of columns) {
    if (col.type !== 'contact') continue;
    const val = cells[col.id];
    if (val == null) continue;

    const ids: string[] = [];
    if (typeof val === 'string') {
      ids.push(val);
    } else if (Array.isArray(val)) {
      for (const v of val) {
        if (typeof v === 'string') ids.push(v);
        else if (v && typeof v === 'object' && 'id' in v) ids.push(String((v as { id: unknown }).id));
      }
    } else if (typeof val === 'object' && val !== null && 'id' in val) {
      ids.push(String((val as { id: unknown }).id));
    }

    for (const id of ids) {
      if (!seen.has(id) && mongoose.Types.ObjectId.isValid(id)) {
        seen.add(id);
        result.push(new mongoose.Types.ObjectId(id));
      }
    }
  }

  return result;
}

/** Load all rows for a sheet as sorted HierarchyRow[]. */
async function loadHierarchyRows(sheetId: string): Promise<HierarchyRow[]> {
  const sheetObjId = new mongoose.Types.ObjectId(sheetId);
  const rows = await Row.find({ sheetId: sheetObjId }).sort({ order: 1 });
  return rows.map((r) => ({
    id: r._id.toString(),
    order: r.order,
    parentId: r.parentId ? r.parentId.toString() : null,
    depth: r.depth ?? 0,
  }));
}

/** Bulk-write order, parentId, and depth changes computed by the pure functions. */
async function bulkWriteHierarchy(
  sheetId: string,
  result: HierarchyRow[],
): Promise<void> {
  const sheetObjId = new mongoose.Types.ObjectId(sheetId);
  if (result.length === 0) return;

  const ops = result.map((r) => ({
    updateOne: {
      filter: { _id: new mongoose.Types.ObjectId(r.id), sheetId: sheetObjId },
      update: {
        $set: {
          order: r.order,
          parentId: r.parentId ? new mongoose.Types.ObjectId(r.parentId) : null,
          depth: r.depth,
        },
      },
    },
  }));
  await Row.bulkWrite(ops);
}

/** Return full serialized row list for a sheet. */
async function getSerializedRows(sheetId: string) {
  const sheetObjId = new mongoose.Types.ObjectId(sheetId);
  const rows = await Row.find({ sheetId: sheetObjId }).sort({ order: 1 });
  return rows.map(formatRow);
}

/**
 * Generates a project key string by atomically incrementing the counter.
 * Returns the key string, or null if the sheet is not a project sheet.
 */
async function generateProjectKey(sheet: ISheet): Promise<string | null> {
  if (sheet.kind !== 'project' || !sheet.project) return null;

  // Atomically increment the counter — never reuse numbers
  const updated = await Sheet.findOneAndUpdate(
    { _id: sheet._id },
    { $inc: { 'project.nextKeyNumber': 1 } },
    { new: false }, // returns doc BEFORE increment → old value IS the number to use
  );
  if (!updated || !updated.project) return null;

  const num = updated.project.nextKeyNumber; // pre-increment value
  return `${updated.project.keyPrefix}-${num}`;
}

/**
 * Validates that a cell value conforms to project field constraints.
 * Throws AppError(400) if the value is invalid for status or type system fields.
 */
function validateProjectFieldValue(
  sheet: ISheet,
  col: ColumnDef,
  value: unknown,
): void {
  if (sheet.kind !== 'project' || !sheet.project) return;
  if (!col.systemField) return;

  // Allow empty/null/undefined values
  if (value === null || value === undefined || value === '') return;

  const strValue = String(value);

  if (col.systemField === 'status') {
    const validStatuses = sheet.project.statuses.map((s) => s.name);
    if (!validStatuses.includes(strValue)) {
      throw new AppError('Invalid status value for this project', 400);
    }
  } else if (col.systemField === 'type') {
    const validTypes = sheet.project.itemTypes.map((t) => t.name);
    if (!validTypes.includes(strValue)) {
      throw new AppError('Invalid type value for this project', 400);
    }
  }
}

// ─── addRow ───────────────────────────────────────────────────────────────

/** Adds a row. Optionally insert after or before a specific row. Requires editor+. */
export async function addRow(
  sheetId: string,
  userId: string,
  data?: { afterRowId?: string; beforeRowId?: string; cells?: Record<string, unknown>; parentId?: string | null; isParentExpanded?: boolean },
) {
  const { sheet } = await getSheetWithAccess(sheetId, userId, 'editor');

  const validatedCells: Record<string, unknown> = {};
  if (data?.cells) {
    const columns = sheet.columns || [];
    const colMap = new Map(columns.map((c) => [c.id, c]));
    for (const [colId, val] of Object.entries(data.cells)) {
      const col = colMap.get(colId);
      if (col) {
        const validated = validateCellValue(col.type, val);
        validateProjectFieldValue(sheet, col, validated);
        validatedCells[colId] = validated;
      }
    }
  }

  // Load current hierarchy
  const hierarchyRows = await loadHierarchyRows(sheetId);

  // Generate new ID
  const newObjectId = new mongoose.Types.ObjectId();
  const newId = newObjectId.toString();

  // Delegate to pure function
  let result: HierarchyRow[];
  try {
    result = pureInsertRow(hierarchyRows, newId, {
      beforeRowId: data?.beforeRowId,
      afterRowId: data?.afterRowId,
      parentId: data?.parentId ?? undefined,
      isParentExpanded: data?.isParentExpanded,
    });
    validateHierarchy(result);
  } catch (err) {
    throw new AppError((err as Error).message, 400);
  }

  // Find the new row's computed position
  const newRowHierarchy = result.find((r) => r.id === newId)!;

  // Generate project key BEFORE creating the row so it's included in the initial document
  const columns = sheet.columns || [];
  const keyCol = columns.find((c) => c.systemField === 'key');
  const projectKey = await generateProjectKey(sheet);
  if (projectKey && keyCol) {
    validatedCells[keyCol.id] = projectKey;
  }

  // Compute assigneeIds from contact cells if any
  const assigneeIds = Object.keys(validatedCells).length > 0
    ? computeAssigneeIds(validatedCells, columns)
    : [];

  // Create the row document (already includes the key cell if applicable)
  const row = await Row.create({
    _id: newObjectId,
    sheetId: new mongoose.Types.ObjectId(sheetId),
    order: newRowHierarchy.order,
    cells: validatedCells,
    parentId: newRowHierarchy.parentId ? new mongoose.Types.ObjectId(newRowHierarchy.parentId) : null,
    depth: newRowHierarchy.depth,
    assigneeIds,
  });

  // Bulk-write hierarchy changes for all other rows
  await bulkWriteHierarchy(sheetId, result.filter((r) => r.id !== newId));

  // Record activity (fire-and-forget)
  const primaryCol = columns.find((c) => c.isPrimary);
  const rowName = primaryCol ? String(validatedCells[primaryCol.id] ?? '') : '';
  const keyColForLog = columns.find((c) => c.systemField === 'key');
  const rowKey = keyColForLog ? String(validatedCells[keyColForLog.id] ?? '') : undefined;
  recordActivity({
    sheetId,
    rowId: newId,
    actorId: userId,
    action: 'row.created',
    details: { name: rowName, ...(rowKey ? { key: rowKey } : {}) },
  });

  // Return the new row plus full updated rows list
  const rowsList = await getSerializedRows(sheetId);
  return { row: formatRow(row), rows: rowsList };
}

// ─── updateCell ───────────────────────────────────────────────────────────

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

  // Prevent editing system key cells
  if (col.systemField === 'key') {
    throw new AppError("Work item keys can't be edited", 400);
  }

  const row = await Row.findById(rowId);
  if (!row || row.sheetId.toString() !== sheetId) {
    throw new AppError('Row not found', 404);
  }

  const validated = validateCellValue(col.type, value);

  // Validate project field constraints (status, type)
  validateProjectFieldValue(sheet, col, validated);

  // Capture old value for activity logging before update
  const oldValue = row.cells instanceof Map ? row.cells.get(columnId) : (row.toObject().cells as unknown as Record<string, unknown>)?.[columnId];

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

  // If the updated column is a contact type, recompute assigneeIds for this row
  if (col.type === 'contact') {
    const updatedRow = await Row.findById(rowId).select('cells');
    if (updatedRow) {
      const cells = (updatedRow.toObject().cells as unknown as Record<string, unknown>) ?? {};
      const columns = sheet.columns || [];
      const newAssigneeIds = computeAssigneeIds(cells, columns);
      await Row.findByIdAndUpdate(rowId, { $set: { assigneeIds: newAssigneeIds } });
    }
  }

  // Collect all cell updates to return (includes the directly edited cell plus any computed cells)
  const cellUpdates: Array<{ rowId: string; columnId: string; value: unknown }> = [
    { rowId, columnId, value: validated },
  ];

  // Duration calculation for project sheets
  if (sheet.kind === 'project' && col.systemField) {
    const durationCol = columns.find((c) => c.systemField === 'duration');
    const startCol = columns.find((c) => c.systemField === 'start');
    const dueCol = columns.find((c) => c.systemField === 'due');

    if (durationCol && startCol && dueCol) {
      // Reload current row cells after the save
      const updatedRow = await Row.findById(rowId).select('cells');
      if (updatedRow) {
        const currentCells = (updatedRow.toObject().cells as unknown as Record<string, unknown>) ?? {};
        const startVal = currentCells[startCol.id] as string | null | undefined;
        const dueVal = currentCells[dueCol.id] as string | null | undefined;
        const durationVal = currentCells[durationCol.id] as number | null | undefined;

        if (col.systemField === 'start' || col.systemField === 'due') {
          // Recalculate Duration from Start and Due using pure UTC date math
          if (startVal && dueVal) {
            const newDuration = calculateDuration(String(startVal), String(dueVal));
            if (newDuration !== null) {
              await Row.findByIdAndUpdate(rowId, {
                $set: { [`cells.${durationCol.id}`]: newDuration },
              });
              cellUpdates.push({ rowId, columnId: durationCol.id, value: newDuration });
            }
          }
        } else if (col.systemField === 'duration') {
          // Recalculate Due from Start and Duration using pure UTC date math
          if (startVal && validated != null) {
            const dur = Number(validated);
            const newDueStr = calculateDueDate(String(startVal), dur);
            if (newDueStr !== null) {
              await Row.findByIdAndUpdate(rowId, {
                $set: { [`cells.${dueCol.id}`]: newDueStr },
              });
              cellUpdates.push({ rowId, columnId: dueCol.id, value: newDueStr });
            }
          }
        }
      }
    }
  }

  // Record cell.updated activity if value actually changed (fire-and-forget)
  const oldStr = JSON.stringify(oldValue ?? null);
  const newStr = JSON.stringify(validated ?? null);
  if (oldStr !== newStr) {
    // Build enriched details for readable activity sentences
    const details: Record<string, unknown> = {
      columnId,
      columnName: col.name,
      oldValue: oldValue ?? null,
      newValue: validated,
      columnType: col.type,
      isPrimary: !!col.isPrimary,
    };

    // For dropdown columns, include options for pill rendering
    if (col.type === 'dropdown' && col.options) {
      details.options = col.options;
      // Find colors for old and new values
      const oldOpt = col.options.find((o) => o.label === oldValue);
      const newOpt = col.options.find((o) => o.label === validated);
      if (oldOpt) details.oldColor = oldOpt.color;
      if (newOpt) details.newColor = newOpt.color;
    }

    // For contact columns, resolve user names at recording time
    if (col.type === 'contact') {
      const resolveNames = async () => {
        const idsToResolve: string[] = [];
        if (oldValue && typeof oldValue === 'string') idsToResolve.push(oldValue);
        if (validated && typeof validated === 'string') idsToResolve.push(validated);

        if (idsToResolve.length > 0) {
          try {
            const users = await User.find({ _id: { $in: idsToResolve } }).select('fullName');
            const nameMap = new Map(users.map((u) => [u._id.toString(), u.fullName]));
            if (oldValue && typeof oldValue === 'string') {
              details.oldPersonName = nameMap.get(oldValue) ?? null;
            }
            if (validated && typeof validated === 'string') {
              details.newPersonName = nameMap.get(validated) ?? null;
            }
          } catch (err) {
            console.error('[rowService] Failed to resolve contact names for activity:', err);
          }
        }

        recordActivity({
          sheetId,
          rowId,
          actorId: userId,
          action: 'cell.updated',
          details,
        });
      };
      resolveNames();
    } else {
      recordActivity({
        sheetId,
        rowId,
        actorId: userId,
        action: 'cell.updated',
        details,
      });
    }
  }

  return cellUpdates;
}

// ─── deleteRows ───────────────────────────────────────────────────────────

/** Deletes multiple rows. Requires editor+. */
export async function deleteRows(
  sheetId: string,
  userId: string,
  rowIds: string[],
  includeDescendants = false,
) {
  const { sheet } = await getSheetWithAccess(sheetId, userId, 'editor');

  const validIds = rowIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
  if (validIds.length === 0) throw new AppError('No valid row IDs provided', 400);

  const hierarchyRows = await loadHierarchyRows(sheetId);

  let result: HierarchyRow[];
  try {
    result = pureDeleteRows(hierarchyRows, validIds, { cascade: includeDescendants });
    validateHierarchy(result);
  } catch (err) {
    throw new AppError((err as Error).message, 400);
  }

  // Determine which rows were deleted
  const remainingIds = new Set(result.map((r) => r.id));
  const idsToDelete = hierarchyRows.filter((r) => !remainingIds.has(r.id)).map((r) => r.id);

  // Load deleted rows for activity logging (before DB deletion)
  const deletedRowDocs = await Row.find({
    _id: { $in: idsToDelete.map((id) => new mongoose.Types.ObjectId(id)) },
    sheetId: new mongoose.Types.ObjectId(sheetId),
  }).select('cells');

  // Delete removed rows from DB
  await Row.deleteMany({
    _id: { $in: idsToDelete.map((id) => new mongoose.Types.ObjectId(id)) },
    sheetId: new mongoose.Types.ObjectId(sheetId),
  });

  // Soft-delete comments on deleted rows
  if (idsToDelete.length > 0) {
    Comment.updateMany(
      { rowId: { $in: idsToDelete.map((id) => new mongoose.Types.ObjectId(id)) } },
      { deletedAt: new Date() },
    ).catch((err) => {
      console.error('[rowService] Failed to soft-delete comments on deleted rows:', err);
    });

    // Soft-delete attachments on deleted rows (fire-and-forget)
    deleteAttachmentsForRows(idsToDelete).catch((err) => {
      console.error('[rowService] Failed to soft-delete attachments on deleted rows:', err);
    });
  }

  // Record row.deleted activities (fire-and-forget)
  const primaryColForDel = (sheet.columns || []).find((c) => c.isPrimary);
  const keyColForDel = (sheet.columns || []).find((c) => c.systemField === 'key');
  recordActivities(deletedRowDocs.map((doc) => {
    const cells = doc.cells instanceof Map ? Object.fromEntries(doc.cells) : (doc.toObject().cells as unknown as Record<string, unknown>) ?? {};
    const name = primaryColForDel ? String(cells[primaryColForDel.id] ?? '') : '';
    const key = keyColForDel ? String(cells[keyColForDel.id] ?? '') : undefined;
    return {
      sheetId,
      rowId: doc._id.toString(),
      actorId: userId,
      action: 'row.deleted' as const,
      details: { name, ...(key ? { key } : {}) },
    };
  }));

  // Bulk-write hierarchy for remaining rows
  await bulkWriteHierarchy(sheetId, result);

  const rowsList = await getSerializedRows(sheetId);
  return { deleted: idsToDelete.length, rows: rowsList };
}

// ─── reorderRows ──────────────────────────────────────────────────────────

/** Reorders rows by providing an ordered array of row IDs. Requires editor+. */
export async function reorderRows(
  sheetId: string,
  userId: string,
  orderedIds: string[],
  parentUpdates?: Array<{ rowId: string; parentId: string | null; depth: number }>,
) {
  await getSheetWithAccess(sheetId, userId, 'editor');

  const hierarchyRows = await loadHierarchyRows(sheetId);

  // If parentUpdates are provided, use them to compute the new hierarchy
  if (parentUpdates && parentUpdates.length > 0) {
    // Validate parent updates
    for (const update of parentUpdates) {
      if (update.depth < 0 || update.depth > 10) {
        throw new AppError(`Depth must be between 0 and 10, got ${update.depth}`, 400);
      }
      if (update.parentId === update.rowId) {
        throw new AppError('A row cannot be its own parent', 400);
      }
    }

    // Apply parentUpdates to create a modified hierarchy, then reorder
    const rowMap = new Map(hierarchyRows.map((r) => [r.id, r]));
    let modified = [...hierarchyRows];

    // Apply parent/depth changes
    for (const u of parentUpdates) {
      const idx = modified.findIndex((r) => r.id === u.rowId);
      if (idx !== -1) {
        modified[idx] = { ...modified[idx], parentId: u.parentId, depth: u.depth };
      }
    }

    // Adjust descendant depths for each updated root
    for (const u of parentUpdates) {
      const childMap = new Map<string, string[]>();
      for (const r of modified) {
        if (r.parentId !== null) {
          if (!childMap.has(r.parentId)) childMap.set(r.parentId, []);
          childMap.get(r.parentId)!.push(r.id);
        }
      }

      const queue: Array<{ id: string; depth: number }> = [];
      const children = childMap.get(u.rowId) || [];
      for (const cid of children) {
        queue.push({ id: cid, depth: u.depth + 1 });
      }
      while (queue.length > 0) {
        const { id, depth } = queue.shift()!;
        const idx = modified.findIndex((r) => r.id === id);
        if (idx !== -1) {
          modified[idx] = { ...modified[idx], depth };
        }
        const grandChildren = childMap.get(id) || [];
        for (const gcId of grandChildren) {
          queue.push({ id: gcId, depth: depth + 1 });
        }
      }
    }

    // Now reorder according to orderedIds
    const orderMap = new Map(orderedIds.map((id, i) => [id, i]));
    modified.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
    modified = modified.map((r, i) => ({ ...r, order: i }));

    try {
      validateHierarchy(modified);
    } catch (err) {
      throw new AppError((err as Error).message, 400);
    }

    await bulkWriteHierarchy(sheetId, modified);

    // Record row.moved activities for each parent update (fire-and-forget)
    const rowMapBefore = new Map(hierarchyRows.map((r) => [r.id, r]));
    recordActivities(parentUpdates.map((u) => ({
      sheetId,
      rowId: u.rowId,
      actorId: userId,
      action: 'row.moved' as const,
      details: {
        oldParentId: rowMapBefore.get(u.rowId)?.parentId ?? null,
        newParentId: u.parentId,
      },
    })));
  } else {
    // Simple reorder without parent changes
    const orderMap = new Map(orderedIds.map((id, i) => [id, i]));
    const reordered = [...hierarchyRows].sort(
      (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0),
    );
    const result = reordered.map((r, i) => ({ ...r, order: i }));

    try {
      validateHierarchy(result);
    } catch (err) {
      throw new AppError((err as Error).message, 400);
    }

    await bulkWriteHierarchy(sheetId, result);
  }

  const rowsList = await getSerializedRows(sheetId);
  return { reordered: orderedIds.length, rows: rowsList };
}

// ─── updateRowHeights ─────────────────────────────────────────────────────

/** Updates row heights in bulk. Requires editor+. */
export async function updateRowHeights(
  sheetId: string,
  userId: string,
  updates: Array<{ rowId: string; height: number }>,
): Promise<{ updated: number }> {
  await getSheetWithAccess(sheetId, userId, 'editor');

  if (!updates || updates.length === 0) return { updated: 0 };

  const validUpdates = updates.filter(
    (u) => mongoose.Types.ObjectId.isValid(u.rowId),
  );
  if (validUpdates.length === 0) return { updated: 0 };

  const ops = validUpdates.map((u) => ({
    updateOne: {
      filter: {
        _id: new mongoose.Types.ObjectId(u.rowId),
        sheetId: new mongoose.Types.ObjectId(sheetId),
      },
      update: {
        $set: { height: Math.max(34, Math.min(400, Math.round(u.height))) },
      },
    },
  }));

  const result = await Row.bulkWrite(ops);
  return { updated: result.modifiedCount };
}

// ─── indentRows ───────────────────────────────────────────────────────────

/** Indents rows — makes each row a child of the row immediately above it. Requires editor+. */
export async function indentRows(
  sheetId: string,
  userId: string,
  rowIds: string[],
) {
  await getSheetWithAccess(sheetId, userId, 'editor');

  const hierarchyRows = await loadHierarchyRows(sheetId);

  let result: HierarchyRow[];
  try {
    result = pureIndentRows(hierarchyRows, rowIds);
    validateHierarchy(result);
  } catch (err) {
    throw new AppError((err as Error).message, 400);
  }

  await bulkWriteHierarchy(sheetId, result);

  // Record row.indented activity (fire-and-forget)
  recordActivity({
    sheetId,
    actorId: userId,
    action: 'row.indented',
    details: { rowIds },
  });

  const rowsList = await getSerializedRows(sheetId);
  return { updated: rowIds.length, rows: rowsList };
}

// ─── outdentRows ──────────────────────────────────────────────────────────

/** Outdents rows — moves each row up one level in the hierarchy. Requires editor+. */
export async function outdentRows(
  sheetId: string,
  userId: string,
  rowIds: string[],
) {
  await getSheetWithAccess(sheetId, userId, 'editor');

  const hierarchyRows = await loadHierarchyRows(sheetId);

  let result: HierarchyRow[];
  try {
    result = pureOutdentRows(hierarchyRows, rowIds);
    validateHierarchy(result);
  } catch (err) {
    throw new AppError((err as Error).message, 400);
  }

  await bulkWriteHierarchy(sheetId, result);

  // Record row.outdented activity (fire-and-forget)
  recordActivity({
    sheetId,
    actorId: userId,
    action: 'row.outdented',
    details: { rowIds },
  });

  const rowsList = await getSerializedRows(sheetId);
  return { updated: rowIds.length, rows: rowsList };
}
