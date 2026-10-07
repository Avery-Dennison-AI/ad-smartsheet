import crypto from 'crypto';
import mongoose from 'mongoose';
import Sheet, { type ColumnDef, type ColumnType } from '../models/Sheet';
import Row from '../models/Row';
import { getSheetWithAccess, serializeColumn } from './gridShared';
import { computeAssigneeIds } from './rowService';
import { AppError } from '../utils/AppError';

/** Adds a column to the sheet. Requires editor+. */
export async function addColumn(
  sheetId: string,
  userId: string,
  data: { name: string; type: ColumnType; position?: number; options?: { label: string; color: string }[] },
) {
  const { sheet } = await getSheetWithAccess(sheetId, userId, 'editor');

  const sorted = [...(sheet.columns || [])].map(serializeColumn);
  sorted.sort((a, b) => a.order - b.order);

  let insertIndex: number;
  if (data.position !== undefined && data.position !== null) {
    insertIndex = Math.max(1, Math.min(data.position, sorted.length));
  } else {
    insertIndex = sorted.length;
  }

  const newCol: ColumnDef = {
    id: crypto.randomUUID(),
    name: data.name.trim(),
    type: data.type,
    order: 0,
    isPrimary: false,
    options: data.type === 'dropdown' ? (data.options || []) : undefined,
  };

  sorted.splice(insertIndex, 0, newCol);
  sorted.forEach((c, i) => { c.order = i; });

  await Sheet.findByIdAndUpdate(sheetId, { $set: { columns: sorted } });
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
      await Row.updateMany(
        { sheetId: new mongoose.Types.ObjectId(sheetId) },
        { $unset: { [`cells.${columnId}`]: '' } },
      );
    }

    if (patch.type === 'dropdown') {
      col.options = patch.options || [];
    } else {
      col.options = undefined;
    }

    // Recalculate assigneeIds when contact type is gained or lost
    if (oldType === 'contact' || patch.type === 'contact') {
      columns[colIndex] = col;
      const updatedColumns = columns.map(serializeColumn);
      const contactColumns = updatedColumns.filter((c) => c.type === 'contact');

      if (contactColumns.length > 0) {
        const BATCH_SIZE = 500;
        const cursor = Row.find({ sheetId: new mongoose.Types.ObjectId(sheetId) }).cursor();
        const batch: Array<{ rowId: string; assigneeIds: mongoose.Types.ObjectId[] }> = [];

        for await (const row of cursor) {
          const cells = (row.toObject().cells as unknown as Record<string, unknown>) ?? {};
          const assigneeIds = computeAssigneeIds(cells, contactColumns);
          batch.push({ rowId: row._id.toString(), assigneeIds });

          if (batch.length >= BATCH_SIZE) {
            await Row.bulkWrite(batch.map((item) => ({
              updateOne: {
                filter: { _id: item.rowId },
                update: { $set: { assigneeIds: item.assigneeIds } },
              },
            })));
            batch.length = 0;
          }
        }

        if (batch.length > 0) {
          await Row.bulkWrite(batch.map((item) => ({
            updateOne: {
              filter: { _id: item.rowId },
              update: { $set: { assigneeIds: item.assigneeIds } },
            },
          })));
        }
      } else {
        // No contact columns remain — clear assigneeIds on all rows
        await Row.updateMany(
          { sheetId: new mongoose.Types.ObjectId(sheetId) },
          { $set: { assigneeIds: [] } },
        );
      }
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

  const oldPrimaryIndex = columns.findIndex((c) => c.isPrimary);

  if (oldPrimaryIndex !== -1 && oldPrimaryIndex !== targetIndex) {
    const oldPrimary = serializeColumn(columns[oldPrimaryIndex]);
    oldPrimary.isPrimary = false;
    oldPrimary.order = 1;
    columns[oldPrimaryIndex] = oldPrimary;
  }

  targetCol.isPrimary = true;
  targetCol.order = 0;
  columns[targetIndex] = targetCol;

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

  const remaining = columns
    .filter((_, i) => i !== colIndex)
    .map(serializeColumn);

  remaining.sort((a, b) => a.order - b.order);
  remaining.forEach((c, i) => { c.order = i; });

  await Row.updateMany(
    { sheetId: new mongoose.Types.ObjectId(sheetId) },
    { $unset: { [`cells.${columnId}`]: '' } },
  );

  // Recalculate assigneeIds for all rows in the sheet after removing a column
  if (columns.some((c) => c.type === 'contact')) {
    const contactColumns = remaining.filter((c) => c.type === 'contact');
    if (contactColumns.length > 0) {
      const BATCH_SIZE = 500;
      const cursor = Row.find({ sheetId: new mongoose.Types.ObjectId(sheetId) }).cursor();
      const batch: Array<{ rowId: string; assigneeIds: mongoose.Types.ObjectId[] }> = [];

      for await (const row of cursor) {
        const cells = (row.toObject().cells as unknown as Record<string, unknown>) ?? {};
        const assigneeIds = computeAssigneeIds(cells, contactColumns);
        batch.push({ rowId: row._id.toString(), assigneeIds });

        if (batch.length >= BATCH_SIZE) {
          await Row.bulkWrite(batch.map((item) => ({
            updateOne: {
              filter: { _id: item.rowId },
              update: { $set: { assigneeIds: item.assigneeIds } },
            },
          })));
          batch.length = 0;
        }
      }

      if (batch.length > 0) {
        await Row.bulkWrite(batch.map((item) => ({
          updateOne: {
            filter: { _id: item.rowId },
            update: { $set: { assigneeIds: item.assigneeIds } },
          },
        })));
      }
    } else {
      // No contact columns remain — clear assigneeIds on all rows
      await Row.updateMany(
        { sheetId: new mongoose.Types.ObjectId(sheetId) },
        { $set: { assigneeIds: [] } },
      );
    }
  }

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

/** Updates a column's width. Requires editor+. */
export async function updateColumnWidth(
  sheetId: string,
  userId: string,
  columnId: string,
  width: number,
): Promise<ColumnDef> {
  const { sheet } = await getSheetWithAccess(sheetId, userId, 'editor');

  const columns = [...(sheet.columns || [])];
  const colIndex = columns.findIndex((c) => c.id === columnId);
  if (colIndex === -1) throw new AppError('Column not found', 404);

  const clampedWidth = Math.max(60, Math.min(800, Math.round(width)));

  const col = serializeColumn(columns[colIndex]);
  col.width = clampedWidth;
  columns[colIndex] = col;

  await Sheet.findByIdAndUpdate(sheetId, { $set: { columns } });
  return col;
}
