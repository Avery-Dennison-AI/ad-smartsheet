import mongoose from 'mongoose';
import Sheet from '../models/Sheet';
import Row, { type IRow } from '../models/Row';
import Workspace from '../models/Workspace';
import { getSheetWithAccess, validateCellValue, formatRow } from './gridShared';
import { AppError } from '../utils/AppError';

/** Adds a row. Optionally insert after or before a specific row. Requires editor+. */
export async function addRow(
  sheetId: string,
  userId: string,
  data?: { afterRowId?: string; beforeRowId?: string; cells?: Record<string, unknown>; parentId?: string | null; isParentExpanded?: boolean },
) {
  const { sheet } = await getSheetWithAccess(sheetId, userId, 'editor');
  const sheetObjId = new mongoose.Types.ObjectId(sheetId);

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

  // Resolve parentId and depth based on insertion context
  let parentId: mongoose.Types.ObjectId | null = null;
  let depth = 0;

  if (data?.afterRowId) {
    const refRow = await Row.findById(data.afterRowId);
    if (!refRow || refRow.sheetId.toString() !== sheetId) {
      throw new AppError('Row not found', 404);
    }

    const refDepth = refRow.depth ?? 0;
    const refHasChildren = await Row.exists({ parentId: refRow._id, sheetId: sheetObjId });

    if (data.isParentExpanded && refHasChildren) {
      // Insert as first child of expanded parent
      if (refDepth >= 10) {
        throw new AppError('Maximum nesting depth of 10 exceeded', 400);
      }
      parentId = refRow._id as mongoose.Types.ObjectId;
      depth = refDepth + 1;
    } else {
      // Sibling of reference row
      parentId = refRow.parentId ?? null;
      depth = refDepth;
    }
  } else if (data?.beforeRowId) {
    const refRow = await Row.findById(data.beforeRowId);
    if (!refRow || refRow.sheetId.toString() !== sheetId) {
      throw new AppError('Row not found', 404);
    }
    // Always sibling of reference row
    parentId = refRow.parentId ?? null;
    depth = refRow.depth ?? 0;
  } else if (data?.parentId) {
    if (!mongoose.Types.ObjectId.isValid(data.parentId)) {
      throw new AppError('Invalid parent row ID', 400);
    }
    const parentRow = await Row.findById(data.parentId);
    if (!parentRow || parentRow.sheetId.toString() !== sheetId) {
      throw new AppError('Parent row not found in this sheet', 404);
    }
    const parentDepth = parentRow.depth ?? 0;
    if (parentDepth >= 10) {
      throw new AppError('Maximum nesting depth of 10 exceeded', 400);
    }
    parentId = parentRow._id as mongoose.Types.ObjectId;
    depth = parentDepth + 1;
  }

  // Determine insertion order position
  let insertAfterOrder: number | null = null;

  if (data?.beforeRowId) {
    const refRow = await Row.findById(data.beforeRowId);
    if (!refRow) throw new AppError('Row not found', 404);
    // Insert just before the reference row — we'll place it at refRow.order and shift everything >= down
    insertAfterOrder = null; // special: insert before this order
    // We'll handle below by finding correct slot
  } else if (data?.afterRowId) {
    const refRow = await Row.findById(data.afterRowId);
    if (!refRow) throw new AppError('Row not found', 404);

    if (parentId && parentId.equals(refRow._id)) {
      // Inserting as first child of expanded parent → right after the parent
      insertAfterOrder = refRow.order;
    } else {
      // Inserting as sibling after the reference row
      // Find the last descendant of the reference row to insert after
      const rowsAfterRef = await Row.find({ sheetId: sheetObjId, order: { $gt: refRow.order } }).sort({ order: 1 });
      let lastOrder = refRow.order;
      for (const r of rowsAfterRef) {
        if ((r.depth ?? 0) > (refRow.depth ?? 0)) {
          lastOrder = r.order;
        } else {
          break;
        }
      }
      insertAfterOrder = lastOrder;
    }
  } else if (parentId) {
    // Explicit parentId without after/before → insert after parent and its descendants
    const parentRow = await Row.findById(parentId);
    if (!parentRow) throw new AppError('Parent row not found', 404);
    const rowsAfterParent = await Row.find({ sheetId: sheetObjId, order: { $gt: parentRow.order } }).sort({ order: 1 });
    let lastOrder = parentRow.order;
    for (const r of rowsAfterParent) {
      if ((r.depth ?? 0) > depth - 1) {
        lastOrder = r.order;
      } else {
        break;
      }
    }
    insertAfterOrder = lastOrder;
  } else {
    // Append at end
    const lastRow = await Row.findOne({ sheetId: sheetObjId }).sort({ order: -1 });
    insertAfterOrder = lastRow ? lastRow.order : -1;
  }

  // Create the row with a temporary order value
  const tempOrder = (insertAfterOrder ?? -1) + 0.5;
  const row = await Row.create({
    sheetId: sheetObjId,
    order: tempOrder,
    cells: validatedCells,
    parentId,
    depth,
  });

  // Renumber all rows with continuous integer orders
  const allRows = await Row.find({ sheetId: sheetObjId }).sort({ order: 1 });
  const ops = allRows.map((r, i) => ({
    updateOne: {
      filter: { _id: r._id },
      update: { $set: { order: i } },
    },
  }));
  if (ops.length > 0) await Row.bulkWrite(ops);

  // Return the new row plus full updated rows list
  const updatedAllRows = await Row.find({ sheetId: sheetObjId }).sort({ order: 1 });
  const rowsList = updatedAllRows.map(formatRow);

  return { row: formatRow(row), rows: rowsList };
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

  const sheetObjId = new mongoose.Types.ObjectId(sheetId);

  let idsToDelete: string[];

  if (includeDescendants) {
    // BFS to collect all descendants
    const allRows = await Row.find({ sheetId: sheetObjId }).sort({ order: 1 });
    const childMap = new Map<string, string[]>();
    for (const r of allRows) {
      const pid = r.parentId ? r.parentId.toString() : null;
      if (pid) {
        if (!childMap.has(pid)) childMap.set(pid, []);
        childMap.get(pid)!.push(r._id.toString());
      }
    }

    const toDelete = new Set(validIds);
    const queue = [...validIds];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const children = childMap.get(current) || [];
      for (const childId of children) {
        if (!toDelete.has(childId)) {
          toDelete.add(childId);
          queue.push(childId);
        }
      }
    }
    idsToDelete = [...toDelete];
  } else {
    // Re-parent direct children of deleted rows to their grandparent
    const deletedSet = new Set(validIds);
    const rowsToDelete = await Row.find({ _id: { $in: validIds }, sheetId: sheetObjId });

    for (const row of rowsToDelete) {
      const rowIdStr = row._id.toString();
      const grandparentId = row.parentId; // could be null
      // Find direct children of this row
      const children = await Row.find({ parentId: row._id, sheetId: sheetObjId });
      if (children.length > 0) {
        const ops = children.map((child) => ({
          updateOne: {
            filter: { _id: child._id },
            update: {
              $set: {
                parentId: grandparentId,
                depth: Math.max(0, (child.depth ?? 0) - 1),
              },
            },
          },
        }));
        await Row.bulkWrite(ops);
      }
    }
    idsToDelete = validIds;
  }

  await Row.deleteMany({
    _id: { $in: idsToDelete },
    sheetId: sheetObjId,
  });

  // Renumber remaining rows with continuous integer orders
  const remainingRows = await Row.find({ sheetId: sheetObjId }).sort({ order: 1 });
  const ops = remainingRows.map((r, i) => ({
    updateOne: {
      filter: { _id: r._id },
      update: { $set: { order: i } },
    },
  }));
  if (ops.length > 0) await Row.bulkWrite(ops);

  // Return full updated rows list
  const updatedRows = await Row.find({ sheetId: sheetObjId }).sort({ order: 1 });
  const rowsList = updatedRows.map(formatRow);

  return { deleted: idsToDelete.length, rows: rowsList };
}

/** Reorders rows by providing an ordered array of row IDs. Requires editor+. */
export async function reorderRows(
  sheetId: string,
  userId: string,
  orderedIds: string[],
  parentUpdates?: Array<{ rowId: string; parentId: string | null; depth: number }>,
) {
  await getSheetWithAccess(sheetId, userId, 'editor');

  const sheetObjId = new mongoose.Types.ObjectId(sheetId);

  // Apply parent/depth updates if provided
  if (parentUpdates && parentUpdates.length > 0) {
    // Validate: no cycles, all parentIds belong to same sheet, depth <= 10
    for (const update of parentUpdates) {
      if (update.depth < 0 || update.depth > 10) {
        throw new AppError(`Depth must be between 0 and 10, got ${update.depth}`, 400);
      }
      if (update.parentId) {
        if (!mongoose.Types.ObjectId.isValid(update.parentId)) {
          throw new AppError(`Invalid parent ID: ${update.parentId}`, 400);
        }
        // No row can be its own ancestor
        if (update.parentId === update.rowId) {
          throw new AppError('A row cannot be its own parent', 400);
        }
        const parentRow = await Row.findById(update.parentId);
        if (!parentRow || parentRow.sheetId.toString() !== sheetId) {
          throw new AppError(`Parent row ${update.parentId} not found in this sheet`, 404);
        }
      }
    }

    // Check for cycles: ensure no row becomes an ancestor of itself through the chain
    const allRows = await Row.find({ sheetId: sheetObjId });
    const rowMap = new Map(allRows.map((r) => [r._id.toString(), r]));
    // Apply pending updates to a virtual map for cycle detection
    const pendingParentMap = new Map<string, string | null>();
    for (const u of parentUpdates) {
      pendingParentMap.set(u.rowId, u.parentId);
    }

    for (const update of parentUpdates) {
      let current = update.parentId;
      const visited = new Set<string>([update.rowId]);
      while (current) {
        if (visited.has(current)) {
          throw new AppError('Cycle detected in parent chain', 400);
        }
        visited.add(current);
        // Check if this parent is also being updated
        const pendingParent = pendingParentMap.get(current);
        if (pendingParent !== undefined) {
          current = pendingParent;
        } else {
          const row = rowMap.get(current);
          current = row?.parentId ? row.parentId.toString() : null;
        }
      }
    }

    // Apply bulk parent/depth updates
    const parentOps = parentUpdates.map((u) => ({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(u.rowId), sheetId: sheetObjId },
        update: { $set: { parentId: u.parentId ? new mongoose.Types.ObjectId(u.parentId) : null, depth: u.depth } },
      },
    }));
    if (parentOps.length > 0) await Row.bulkWrite(parentOps);

    // Also update descendants' depths relative to their moved roots
    const updatedRowMap = new Map(parentUpdates.map((u) => [u.rowId, u]));
    const childMap = new Map<string, IRow[]>();
    const freshAllRows = await Row.find({ sheetId: sheetObjId }).sort({ order: 1 });
    for (const r of freshAllRows) {
      const pid = r.parentId ? r.parentId.toString() : null;
      if (pid) {
        if (!childMap.has(pid)) childMap.set(pid, []);
        childMap.get(pid)!.push(r);
      }
    }

    const depthOps: Array<{ updateOne: { filter: { _id: mongoose.Types.ObjectId }; update: { $set: { depth: number } } } }> = [];
    for (const [rowId, update] of updatedRowMap.entries()) {
      const queue: Array<{ id: string; depth: number }> = [];
      const children = childMap.get(rowId) || [];
      for (const child of children) {
        queue.push({ id: child._id.toString(), depth: update.depth + 1 });
      }
      while (queue.length > 0) {
        const { id, depth } = queue.shift()!;
        if (depth > 10) continue;
        depthOps.push({
          updateOne: {
            filter: { _id: new mongoose.Types.ObjectId(id) },
            update: { $set: { depth } },
          },
        });
        const grandChildren = childMap.get(id) || [];
        for (const gc of grandChildren) {
          queue.push({ id: gc._id.toString(), depth: depth + 1 });
        }
      }
    }
    if (depthOps.length > 0) await Row.bulkWrite(depthOps);
  }

  // Renumber all rows with continuous integer orders based on orderedIds
  const ops = orderedIds.map((id, index) => ({
    updateOne: {
      filter: { _id: new mongoose.Types.ObjectId(id), sheetId: sheetObjId },
      update: { $set: { order: index } },
    },
  }));
  if (ops.length > 0) await Row.bulkWrite(ops);

  // Return full updated rows list
  const allUpdatedRows = await Row.find({ sheetId: sheetObjId }).sort({ order: 1 });
  const rowsList = allUpdatedRows.map(formatRow);

  return { reordered: orderedIds.length, rows: rowsList };
}

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

/** Indents rows — makes each row a child of the row immediately above it. Requires editor+. */
export async function indentRows(
  sheetId: string,
  userId: string,
  rowIds: string[],
) {
  await getSheetWithAccess(sheetId, userId, 'editor');

  const sheetObjId = new mongoose.Types.ObjectId(sheetId);
  const allRows = await Row.find({ sheetId: sheetObjId }).sort({ order: 1 });
  const rowMap = new Map(allRows.map((r) => [r._id.toString(), r]));

  const ops: Array<{ updateOne: { filter: { _id: mongoose.Types.ObjectId }; update: { $set: { parentId: mongoose.Types.ObjectId | null; depth: number } } } }> = [];
  const updatedRows: Record<string, { parentId: string | null; depth: number }> = {};

  for (const rowId of rowIds) {
    const row = rowMap.get(rowId);
    if (!row) continue;

    // Find the row immediately above in the ordered list
    const idx = allRows.findIndex((r) => r._id.toString() === rowId);
    if (idx <= 0) continue; // Can't indent first row

    const aboveRow = allRows[idx - 1];
    const aboveDepth = aboveRow.depth ?? 0;
    const currentDepth = row.depth ?? 0;

    // Can only indent if the row above is at the same or higher depth (i.e., same level or deeper)
    if (aboveDepth < currentDepth) continue;

    // Check that we won't exceed max depth
    const newDepth = aboveDepth + 1;
    if (newDepth > 10) continue;

    // Prevent cycle: above row must not be a descendant of this row
    let pid = aboveRow.parentId;
    let isCycle = false;
    while (pid) {
      if (pid.toString() === rowId) {
        isCycle = true;
        break;
      }
      const parent = rowMap.get(pid.toString());
      pid = parent?.parentId ?? null;
    }
    if (isCycle) continue;

    ops.push({
      updateOne: {
        filter: { _id: row._id },
        update: { $set: { parentId: aboveRow._id as mongoose.Types.ObjectId, depth: newDepth } },
      },
    });
    updatedRows[rowId] = { parentId: aboveRow._id.toString(), depth: newDepth };
  }

  if (ops.length > 0) {
    await Row.bulkWrite(ops);
  }

  // Also update descendants' depths
  if (Object.keys(updatedRows).length > 0) {
    const childMap = new Map<string, IRow[]>();
    for (const r of allRows) {
      const pid = r.parentId ? r.parentId.toString() : null;
      if (pid) {
        if (!childMap.has(pid)) childMap.set(pid, []);
        childMap.get(pid)!.push(r);
      }
    }

    const depthOps: Array<{ updateOne: { filter: { _id: mongoose.Types.ObjectId }; update: { $set: { depth: number } } } }> = [];
    for (const [rowId, update] of Object.entries(updatedRows)) {
      const queue: Array<{ id: string; depth: number }> = [];
      const children = childMap.get(rowId) || [];
      for (const child of children) {
        queue.push({ id: child._id.toString(), depth: update.depth + 1 });
      }
      while (queue.length > 0) {
        const { id, depth } = queue.shift()!;
        if (depth > 10) continue;
        depthOps.push({
          updateOne: {
            filter: { _id: new mongoose.Types.ObjectId(id) },
            update: { $set: { depth } },
          },
        });
        const grandChildren = childMap.get(id) || [];
        for (const gc of grandChildren) {
          queue.push({ id: gc._id.toString(), depth: depth + 1 });
        }
      }
    }
    if (depthOps.length > 0) {
      await Row.bulkWrite(depthOps);
    }
  }

  return { updated: Object.keys(updatedRows).length, rows: updatedRows };
}

/** Outdents rows — moves each row up one level in the hierarchy. Requires editor+. */
export async function outdentRows(
  sheetId: string,
  userId: string,
  rowIds: string[],
) {
  await getSheetWithAccess(sheetId, userId, 'editor');

  const sheetObjId = new mongoose.Types.ObjectId(sheetId);
  const allRows = await Row.find({ sheetId: sheetObjId }).sort({ order: 1 });
  const rowMap = new Map(allRows.map((r) => [r._id.toString(), r]));

  const ops: Array<{ updateOne: { filter: { _id: mongoose.Types.ObjectId }; update: { $set: { parentId: mongoose.Types.ObjectId | null; depth: number } } } }> = [];
  const updatedRows: Record<string, { parentId: string | null; depth: number }> = {};

  for (const rowId of rowIds) {
    const row = rowMap.get(rowId);
    if (!row || !row.parentId) continue; // Already top-level

    const parentRow = rowMap.get(row.parentId.toString());
    const grandparentId = parentRow?.parentId ?? null;
    const newDepth = Math.max(0, (row.depth ?? 0) - 1);

    ops.push({
      updateOne: {
        filter: { _id: row._id },
        update: { $set: { parentId: grandparentId, depth: newDepth } },
      },
    });
    updatedRows[rowId] = { parentId: grandparentId ? grandparentId.toString() : null, depth: newDepth };
  }

  if (ops.length > 0) {
    await Row.bulkWrite(ops);
  }

  // Also update descendants' depths
  if (Object.keys(updatedRows).length > 0) {
    const childMap = new Map<string, IRow[]>();
    for (const r of allRows) {
      const pid = r.parentId ? r.parentId.toString() : null;
      if (pid) {
        if (!childMap.has(pid)) childMap.set(pid, []);
        childMap.get(pid)!.push(r);
      }
    }

    const depthOps: Array<{ updateOne: { filter: { _id: mongoose.Types.ObjectId }; update: { $set: { depth: number } } } }> = [];
    for (const [rowId, update] of Object.entries(updatedRows)) {
      const queue: Array<{ id: string; depth: number }> = [];
      const children = childMap.get(rowId) || [];
      for (const child of children) {
        queue.push({ id: child._id.toString(), depth: update.depth + 1 });
      }
      while (queue.length > 0) {
        const { id, depth } = queue.shift()!;
        if (depth > 10) continue;
        depthOps.push({
          updateOne: {
            filter: { _id: new mongoose.Types.ObjectId(id) },
            update: { $set: { depth } },
          },
        });
        const grandChildren = childMap.get(id) || [];
        for (const gc of grandChildren) {
          queue.push({ id: gc._id.toString(), depth: depth + 1 });
        }
      }
    }
    if (depthOps.length > 0) {
      await Row.bulkWrite(depthOps);
    }
  }

  return { updated: Object.keys(updatedRows).length, rows: updatedRows };
}
