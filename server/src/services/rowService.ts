import mongoose from 'mongoose';
import Row, { type IRow } from '../models/Row';
import Workspace from '../models/Workspace';
import { getSheetWithAccess, validateCellValue, formatRow } from './gridShared';
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

// ─── Helpers ──────────────────────────────────────────────────────────────

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
        validatedCells[colId] = validateCellValue(col.type, val);
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

  // Create the row document
  const row = await Row.create({
    _id: newObjectId,
    sheetId: new mongoose.Types.ObjectId(sheetId),
    order: newRowHierarchy.order,
    cells: validatedCells,
    parentId: newRowHierarchy.parentId ? new mongoose.Types.ObjectId(newRowHierarchy.parentId) : null,
    depth: newRowHierarchy.depth,
  });

  // Bulk-write hierarchy changes for all other rows
  await bulkWriteHierarchy(sheetId, result.filter((r) => r.id !== newId));

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

  const row = await Row.findById(rowId);
  if (!row || row.sheetId.toString() !== sheetId) {
    throw new AppError('Row not found', 404);
  }

  const validated = validateCellValue(col.type, value);

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

// ─── deleteRows ───────────────────────────────────────────────────────────

/** Deletes multiple rows. Requires editor+. */
export async function deleteRows(
  sheetId: string,
  userId: string,
  rowIds: string[],
  includeDescendants = false,
) {
  await getSheetWithAccess(sheetId, userId, 'editor');

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

  // Delete removed rows from DB
  await Row.deleteMany({
    _id: { $in: idsToDelete.map((id) => new mongoose.Types.ObjectId(id)) },
    sheetId: new mongoose.Types.ObjectId(sheetId),
  });

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

  const rowsList = await getSerializedRows(sheetId);
  return { updated: rowIds.length, rows: rowsList };
}
