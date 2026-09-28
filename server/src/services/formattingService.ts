import mongoose from 'mongoose';
import Sheet from '../models/Sheet';
import Row from '../models/Row';
import { getSheetWithAccess, serializeColumn } from './gridShared';
import { AppError } from '../utils/AppError';

// ─── Shared formatting validation constants ────────────────────────────────

const ALLOWED_FORMAT_KEYS = new Set([
  'fontFamily', 'fontSize', 'bold', 'italic', 'underline', 'strikethrough',
  'textAlign', 'verticalAlign', 'textColor', 'fillColor', 'wrapText',
]);
const HEX_RE = /^#[0-9A-Fa-f]{6}$/;
const TEXT_ALIGN_VALUES = new Set(['left', 'center', 'right']);
const VERTICAL_ALIGN_VALUES = new Set(['top', 'middle', 'bottom']);

function validateFormattingPatch(formatting: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(formatting)) {
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
    if (key === 'wrapText' && typeof value !== 'boolean') {
      throw new AppError(`Invalid wrapText value: ${value} (must be boolean)`, 400);
    }
  }
}

/** Updates cell formatting for multiple cells across rows. Requires editor+. */
export async function updateFormatting(
  sheetId: string,
  userId: string,
  cells: Array<{ rowId: string; columnId: string; formatting: Record<string, unknown> | null }>,
) {
  await getSheetWithAccess(sheetId, userId, 'editor');

  // Validate formatting keys and values
  for (const entry of cells) {
    if (entry.formatting === null) continue;
    validateFormattingPatch(entry.formatting);
  }

  const validRowIds = cells
    .map((e) => e.rowId)
    .filter((id) => mongoose.Types.ObjectId.isValid(id));

  if (validRowIds.length === 0) return { updated: 0 };

  const validRows = await Row.find({
    _id: { $in: validRowIds },
    sheetId: new mongoose.Types.ObjectId(sheetId),
  }).select('_id');

  const validRowIdSet = new Set(validRows.map((r) => r._id.toString()));

  const ops: Array<{ updateOne: { filter: Record<string, unknown>; update: Record<string, unknown> } }> = [];

  for (const entry of cells) {
    if (!validRowIdSet.has(entry.rowId)) continue;

    if (entry.formatting === null) {
      ops.push({
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(entry.rowId) },
          update: { $unset: { [`formatting.${entry.columnId}`]: '' } },
        },
      });
    } else if (Object.keys(entry.formatting).length > 0) {
      const setFields: Record<string, unknown> = {};
      const unsetFields: Record<string, string> = {};

      for (const [key, value] of Object.entries(entry.formatting)) {
        if (value === null) {
          unsetFields[`formatting.${entry.columnId}.${key}`] = '';
        } else if (value !== undefined) {
          setFields[`formatting.${entry.columnId}.${key}`] = value;
        }
      }

      const update: Record<string, unknown> = {};
      if (Object.keys(setFields).length > 0) update.$set = setFields;
      if (Object.keys(unsetFields).length > 0) update.$unset = unsetFields;

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

/** Updates column-level formatting for one or more columns. Requires editor+. */
export async function updateColumnFormatting(
  sheetId: string,
  userId: string,
  columns: Array<{ columnId: string; formatting: Record<string, unknown> | null }>,
  cascadePatch?: Record<string, unknown>,
) {
  const { sheet } = await getSheetWithAccess(sheetId, userId, 'editor');

  for (const entry of columns) {
    if (entry.formatting === null) continue;
    validateFormattingPatch(entry.formatting);
  }

  const sheetColumns = [...(sheet.columns || [])];
  let updatedCount = 0;

  for (const entry of columns) {
    const colIndex = sheetColumns.findIndex((c) => c.id === entry.columnId);
    if (colIndex === -1) continue;

    const col = serializeColumn(sheetColumns[colIndex]);
    if (entry.formatting === null) {
      col.formatting = undefined;
    } else if (Object.keys(entry.formatting).length > 0) {
      const existing = col.formatting ?? {};
      const merged: Record<string, unknown> = { ...existing };
      for (const [k, v] of Object.entries(entry.formatting)) {
        if (v === null) delete merged[k];
        else if (v !== undefined) merged[k] = v;
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

        const hasOverride = patchKeys.some((key) => key in cellFmt);
        if (!hasOverride) continue;

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
