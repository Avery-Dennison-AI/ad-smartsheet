import mongoose from 'mongoose';
import Sheet from '../models/Sheet';
import Row from '../models/Row';
import Workspace from '../models/Workspace';
import { getSheetWithAccess, validateCellValue, formatRow } from './gridShared';
import { AppError } from '../utils/AppError';

/** Adds a row. Optionally insert after or before a specific row. Requires editor+. */
export async function addRow(
  sheetId: string,
  userId: string,
  data?: { afterRowId?: string; beforeRowId?: string; cells?: Record<string, unknown> },
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
  } else {
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
) {
  await getSheetWithAccess(sheetId, userId, 'editor');

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
