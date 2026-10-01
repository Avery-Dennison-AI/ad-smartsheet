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
  data?: { afterRowId?: string; beforeRowId?: string; cells?: Record<string, unknown>; parentId?: string | null },
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

  // Resolve parentId and depth
  let parentId: mongoose.Types.ObjectId | null = null;
  let depth = 0;

  if (data?.parentId) {
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

  let order: number;

  if (data?.beforeRowId) {
    const beforeRow = await Row.findById(data.beforeRowId);
    if (!beforeRow || beforeRow.sheetId.toString() !== sheetId) {
      throw new AppError('Row not found', 404);
    }

    const prevRow = await Row.findOne({
      sheetId: new mongoose.Types.ObjectId(sheetId),
      order: { $lt: beforeRow.order },
    }).sort({ order: -1 });

    if (prevRow) {
      order = (prevRow.order + beforeRow.order) / 2;
    } else {
      order = beforeRow.order - 1;
    }

    if (prevRow && Math.abs(order - prevRow.order) < 0.001) {
      const allRows = await Row.find({ sheetId: new mongoose.Types.ObjectId(sheetId) })
        .sort({ order: 1 });
      const ops = allRows.map((r, i) => ({
        updateOne: {
          filter: { _id: r._id },
          update: { $set: { order: i } },
        },
      }));
      if (ops.length > 0) await Row.bulkWrite(ops);
      const normalizedBeforeRow = await Row.findById(data.beforeRowId);
      const normalizedPrevRow = await Row.findOne({
        sheetId: new mongoose.Types.ObjectId(sheetId),
        order: { $lt: normalizedBeforeRow!.order },
      }).sort({ order: -1 });
      order = normalizedPrevRow ? (normalizedPrevRow.order + normalizedBeforeRow!.order) / 2 : normalizedBeforeRow!.order - 1;
    }
  } else if (data?.afterRowId) {
    const afterRow = await Row.findById(data.afterRowId);
    if (!afterRow || afterRow.sheetId.toString() !== sheetId) {
      throw new AppError('Row not found', 404);
    }
    order = afterRow.order + 1;

    await Row.updateMany(
      { sheetId: new mongoose.Types.ObjectId(sheetId), order: { $gte: order } },
      { $inc: { order: 1 } },
    );
  } else if (parentId) {
    // Insert immediately after the parent and its last descendant
    const parentRow = await Row.findById(parentId);
    if (!parentRow) throw new AppError('Parent row not found', 404);

    // Find the last descendant by walking rows after the parent
    const rowsAfterParent = await Row.find({
      sheetId: new mongoose.Types.ObjectId(sheetId),
      order: { $gt: parentRow.order },
    }).sort({ order: 1 });

    let lastOrder = parentRow.order;
    for (const r of rowsAfterParent) {
      if ((r.depth ?? 0) > depth - 1) {
        lastOrder = r.order;
      } else {
        break;
      }
    }

    order = lastOrder + 1;
    await Row.updateMany(
      { sheetId: new mongoose.Types.ObjectId(sheetId), order: { $gte: order } },
      { $inc: { order: 1 } },
    );
  } else {
    const lastRow = await Row.findOne({ sheetId: new mongoose.Types.ObjectId(sheetId) })
      .sort({ order: -1 });
    order = lastRow ? lastRow.order + 1 : 0;
  }

  const row = await Row.create({
    sheetId: new mongoose.Types.ObjectId(sheetId),
    order,
    cells: validatedCells,
    parentId,
    depth,
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

  const result = await Row.deleteMany({
    _id: { $in: idsToDelete },
    sheetId: sheetObjId,
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

  const ops = orderedIds.map((id, index) => ({
    updateOne: {
      filter: { _id: new mongoose.Types.ObjectId(id), sheetId: new mongoose.Types.ObjectId(sheetId) },
      update: { $set: { order: index } },
    },
  }));

  if (ops.length > 0) {
    await Row.bulkWrite(ops);
  }

  // Re-derive depth from parent chain after reorder
  const allRows = await Row.find({ sheetId: new mongoose.Types.ObjectId(sheetId) }).sort({ order: 1 });
  const depthOps: Array<{ updateOne: { filter: { _id: mongoose.Types.ObjectId }; update: { $set: { depth: number } } } }> = [];
  for (const row of allRows) {
    let d = 0;
    let pid = row.parentId;
    while (pid) {
      const parent = allRows.find((r) => r._id.equals(pid));
      if (!parent) break;
      d++;
      pid = parent.parentId;
    }
    if (d !== (row.depth ?? 0)) {
      depthOps.push({
        updateOne: {
          filter: { _id: row._id },
          update: { $set: { depth: Math.min(d, 10) } },
        },
      });
    }
  }
  if (depthOps.length > 0) {
    await Row.bulkWrite(depthOps);
  }

  return { reordered: orderedIds.length };
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
