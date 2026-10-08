import crypto from 'crypto';
import mongoose from 'mongoose';
import Sheet, { type ISheet, type ColumnDef, type ProjectStatus, type ProjectItemType } from '../models/Sheet';
import Row from '../models/Row';
import { requireSheetAccess } from './permissionService';
import { recordActivity } from './activityService';
import { AppError } from '../utils/AppError';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Find the Status system-field column in a sheet's columns. */
function findStatusColumn(columns: ColumnDef[]): ColumnDef | undefined {
  return columns.find((c) => c.systemField === 'status');
}

/** Find the Type system-field column in a sheet's columns. */
function findTypeColumn(columns: ColumnDef[]): ColumnDef | undefined {
  return columns.find((c) => c.systemField === 'type');
}

/** Ensure the sheet is a project. Throws 400 if not. */
function ensureProject(sheet: ISheet): void {
  if (sheet.kind !== 'project' || !sheet.project) {
    throw new AppError('Not a project sheet', 400);
  }
}

// ─── getProjectUsage ────────────────────────────────────────────────────────

export interface ProjectUsage {
  statusUsage: Record<string, number>;
  typeUsage: Record<string, number>;
}

/**
 * Returns usage counts per status id and type id by aggregating Row cells
 * for the Status and Type system-field columns.
 */
export async function getProjectUsage(sheetId: string, userId: string): Promise<ProjectUsage> {
  const { sheet } = await requireSheetAccess(userId, sheetId, 'viewer');
  ensureProject(sheet);

  const statusCol = findStatusColumn(sheet.columns);
  const typeCol = findTypeColumn(sheet.columns);

  const rows = await Row.find({ sheetId: new mongoose.Types.ObjectId(sheetId) })
    .select('cells')
    .lean();

  const statusUsage: Record<string, number> = {};
  const typeUsage: Record<string, number> = {};

  // Build name→id maps from project settings
  const statusNameToId = new Map<string, string>();
  for (const s of sheet.project!.statuses) {
    statusNameToId.set(s.name.toLowerCase(), s.id);
  }

  const typeNameToId = new Map<string, string>();
  for (const t of sheet.project!.itemTypes) {
    typeNameToId.set(t.name.toLowerCase(), t.id);
  }

  for (const row of rows) {
    const cells = (row.cells as unknown as Record<string, unknown>) ?? {};

    if (statusCol) {
      const cellValue = cells[statusCol.id];
      if (typeof cellValue === 'string' && cellValue) {
        const id = statusNameToId.get(cellValue.toLowerCase());
        if (id) {
          statusUsage[id] = (statusUsage[id] || 0) + 1;
        }
      }
    }

    if (typeCol) {
      const cellValue = cells[typeCol.id];
      if (typeof cellValue === 'string' && cellValue) {
        const id = typeNameToId.get(cellValue.toLowerCase());
        if (id) {
          typeUsage[id] = (typeUsage[id] || 0) + 1;
        }
      }
    }
  }

  return { statusUsage, typeUsage };
}

// ─── updateStatuses ─────────────────────────────────────────────────────────

interface StatusPayload {
  id?: string;
  name: string;
  color: string;
  category: 'todo' | 'in_progress' | 'done';
}

interface UpdateStatusesInput {
  statuses: StatusPayload[];
  replacements?: Record<string, string>;
}

/**
 * Updates the project's statuses list. Handles renaming, adding, removing,
 * and reordering. Propagates changes to row cells and column dropdown options.
 */
export async function updateStatuses(
  sheetId: string,
  userId: string,
  payload: UpdateStatusesInput,
): Promise<ISheet> {
  const { sheet } = await requireSheetAccess(userId, sheetId, 'admin');
  ensureProject(sheet);

  const { statuses: incoming, replacements = {} } = payload;

  // Validate: at least one entry
  if (incoming.length === 0) {
    throw new AppError('At least one status is required', 400);
  }

  // Validate: names ≤ 40 chars
  for (const s of incoming) {
    if (s.name.length > 40) {
      throw new AppError(`Status name "${s.name}" exceeds 40 characters`, 400);
    }
  }

  // Validate: unique case-insensitively
  const seenNames = new Set<string>();
  for (const s of incoming) {
    const lower = s.name.trim().toLowerCase();
    if (seenNames.has(lower)) {
      throw new AppError(`Duplicate status name: "${s.name}"`, 400);
    }
    seenNames.add(lower);
  }

  // Validate: at least one todo and one done
  const hasTodo = incoming.some((s) => s.category === 'todo');
  const hasDone = incoming.some((s) => s.category === 'done');
  if (!hasTodo) {
    throw new AppError('At least one "To do" status is required', 400);
  }
  if (!hasDone) {
    throw new AppError('At least one "Done" status is required', 400);
  }

  const oldStatuses = sheet.project!.statuses;
  const oldStatusMap = new Map<string, ProjectStatus>();
  for (const s of oldStatuses) {
    oldStatusMap.set(s.id, s);
  }

  // Build the new statuses array with IDs assigned
  const newStatuses: ProjectStatus[] = [];
  for (const s of incoming) {
    const id = s.id || crypto.randomUUID();
    newStatuses.push({
      id,
      name: s.name.trim(),
      color: s.color,
      category: s.category,
    });
  }

  const newStatusIds = new Set(newStatuses.map((s) => s.id));
  const newStatusMap = new Map<string, ProjectStatus>();
  for (const s of newStatuses) {
    newStatusMap.set(s.id, s);
  }

  // Detect removed IDs
  const removedIds = oldStatuses
    .map((s) => s.id)
    .filter((id) => !newStatusIds.has(id));

  // Check usage for removed statuses — need replacement
  if (removedIds.length > 0) {
    const statusCol = findStatusColumn(sheet.columns);
    if (statusCol) {
      // Count rows using each removed status name
      const rows = await Row.find({ sheetId: new mongoose.Types.ObjectId(sheetId) }).select('cells').lean();
      for (const removedId of removedIds) {
        const oldStatus = oldStatusMap.get(removedId);
        if (!oldStatus) continue;

        const usedCount = rows.filter((r) => {
          const cells = (r.cells as unknown as Record<string, unknown>) ?? {};
          return typeof cells[statusCol.id] === 'string' &&
            (cells[statusCol.id] as string).toLowerCase() === oldStatus.name.toLowerCase();
        }).length;

        if (usedCount > 0 && !replacements[removedId]) {
          throw new AppError('Choose where to move the items that use this status', 400);
        }

        // Validate replacement target exists in new list
        if (replacements[removedId] && !newStatusMap.has(replacements[removedId])) {
          throw new AppError(`Replacement status not found`, 400);
        }
      }
    }
  }

  // Perform row updates atomically
  const rowOps: Array<{ updateMany: { filter: Record<string, unknown>; update: Record<string, unknown> } }> = [];
  const statusCol = findStatusColumn(sheet.columns);

  if (statusCol) {
    // Handle replacements for removed statuses
    for (const removedId of removedIds) {
      const replacementId = replacements[removedId];
      if (!replacementId) continue;

      const oldStatus = oldStatusMap.get(removedId);
      const newStatus = newStatusMap.get(replacementId);
      if (!oldStatus || !newStatus) continue;

      rowOps.push({
        updateMany: {
          filter: {
            sheetId: new mongoose.Types.ObjectId(sheetId),
            [`cells.${statusCol.id}`]: oldStatus.name,
          },
          update: {
            $set: { [`cells.${statusCol.id}`]: newStatus.name },
          },
        },
      });
    }

    // Handle renames (same ID, different name)
    for (const newStatus of newStatuses) {
      const oldStatus = oldStatusMap.get(newStatus.id);
      if (oldStatus && oldStatus.name !== newStatus.name) {
        rowOps.push({
          updateMany: {
            filter: {
              sheetId: new mongoose.Types.ObjectId(sheetId),
              [`cells.${statusCol.id}`]: oldStatus.name,
            },
            update: {
              $set: { [`cells.${statusCol.id}`]: newStatus.name },
            },
          },
        });
      }
    }
  }

  // Update column dropdown options for the Status column
  const updatedColumns = sheet.columns.map((col) => {
    if (col.systemField === 'status') {
      return {
        ...col,
        options: newStatuses.map((s) => ({ label: s.name, color: s.color })),
      };
    }
    return col;
  });

  // Count rows that will be moved due to replacements (before transaction)
  let rowsMoved = 0;
  if (statusCol && removedIds.length > 0) {
    const allRows = await Row.find({ sheetId: new mongoose.Types.ObjectId(sheetId) }).select('cells').lean();
    for (const removedId of removedIds) {
      if (replacements[removedId]) {
        const oldStatus = oldStatusMap.get(removedId);
        if (oldStatus) {
          rowsMoved += allRows.filter((r) => {
            const cells = (r.cells as unknown as Record<string, unknown>) ?? {};
            return typeof cells[statusCol.id] === 'string' &&
              (cells[statusCol.id] as string).toLowerCase() === oldStatus.name.toLowerCase();
          }).length;
        }
      }
    }
  }

  // Execute row updates and sheet update atomically
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    if (rowOps.length > 0) {
      await Row.bulkWrite(rowOps, { session });
    }

    await Sheet.findByIdAndUpdate(
      sheetId,
      {
        $set: {
          'project.statuses': newStatuses,
          columns: updatedColumns,
        },
      },
      { session },
    );

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }

  // Return the updated sheet
  const updated = await Sheet.findById(sheetId);
  if (!updated) throw new AppError('Failed to update statuses', 500);

  // Compute summary for activity log
  try {
    const addedNames: string[] = [];
    const renamedList: Array<{ from: string; to: string }> = [];
    const removedNames: string[] = [];

    const oldIds = new Set(oldStatuses.map((s) => s.id));
    const newIds = new Set(newStatuses.map((s) => s.id));

    for (const s of newStatuses) {
      if (!oldIds.has(s.id)) {
        addedNames.push(s.name);
      } else {
        const oldS = oldStatusMap.get(s.id);
        if (oldS && oldS.name !== s.name) {
          renamedList.push({ from: oldS.name, to: s.name });
        }
      }
    }

    for (const s of oldStatuses) {
      if (!newIds.has(s.id)) {
        removedNames.push(s.name);
      }
    }

    recordActivity({
      sheetId,
      actorId: userId,
      action: 'project.statuses_changed',
      details: { added: addedNames, renamed: renamedList, removed: removedNames, rowsMoved },
    });
  } catch (err) {
    console.error('[projectSettingsService] Failed to record project.statuses_changed activity:', err);
  }

  return updated;
}

// ─── updateItemTypes ────────────────────────────────────────────────────────

interface ItemTypePayload {
  id?: string;
  name: string;
}

interface UpdateItemTypesInput {
  itemTypes: ItemTypePayload[];
  replacements?: Record<string, string>;
}

/**
 * Updates the project's item types list. Mirror of updateStatuses but for
 * the Type system-field column.
 */
export async function updateItemTypes(
  sheetId: string,
  userId: string,
  payload: UpdateItemTypesInput,
): Promise<ISheet> {
  const { sheet } = await requireSheetAccess(userId, sheetId, 'admin');
  ensureProject(sheet);

  const { itemTypes: incoming, replacements = {} } = payload;

  // Validate: at least one entry
  if (incoming.length === 0) {
    throw new AppError('At least one item type is required', 400);
  }

  // Validate: names ≤ 40 chars
  for (const t of incoming) {
    if (t.name.length > 40) {
      throw new AppError(`Item type name "${t.name}" exceeds 40 characters`, 400);
    }
  }

  // Validate: unique case-insensitively
  const seenNames = new Set<string>();
  for (const t of incoming) {
    const lower = t.name.trim().toLowerCase();
    if (seenNames.has(lower)) {
      throw new AppError(`Duplicate item type name: "${t.name}"`, 400);
    }
    seenNames.add(lower);
  }

  const oldTypes = sheet.project!.itemTypes;
  const oldTypeMap = new Map<string, ProjectItemType>();
  for (const t of oldTypes) {
    oldTypeMap.set(t.id, t);
  }

  // Build new item types with IDs
  const newTypes: ProjectItemType[] = [];
  for (const t of incoming) {
    const id = t.id || crypto.randomUUID();
    newTypes.push({
      id,
      name: t.name.trim(),
    });
  }

  const newTypeIds = new Set(newTypes.map((t) => t.id));
  const newTypeMap = new Map<string, ProjectItemType>();
  for (const t of newTypes) {
    newTypeMap.set(t.id, t);
  }

  // Detect removed IDs
  const removedIds = oldTypes
    .map((t) => t.id)
    .filter((id) => !newTypeIds.has(id));

  // Check usage for removed types
  if (removedIds.length > 0) {
    const typeCol = findTypeColumn(sheet.columns);
    if (typeCol) {
      const rows = await Row.find({ sheetId: new mongoose.Types.ObjectId(sheetId) }).select('cells').lean();
      for (const removedId of removedIds) {
        const oldType = oldTypeMap.get(removedId);
        if (!oldType) continue;

        const usedCount = rows.filter((r) => {
          const cells = (r.cells as unknown as Record<string, unknown>) ?? {};
          return typeof cells[typeCol.id] === 'string' &&
            (cells[typeCol.id] as string).toLowerCase() === oldType.name.toLowerCase();
        }).length;

        if (usedCount > 0 && !replacements[removedId]) {
          throw new AppError('Choose where to move the items that use this type', 400);
        }

        if (replacements[removedId] && !newTypeMap.has(replacements[removedId])) {
          throw new AppError(`Replacement item type not found`, 400);
        }
      }
    }
  }

  // Perform row updates
  const rowOps: Array<{ updateMany: { filter: Record<string, unknown>; update: Record<string, unknown> } }> = [];
  const typeCol = findTypeColumn(sheet.columns);

  if (typeCol) {
    // Handle replacements for removed types
    for (const removedId of removedIds) {
      const replacementId = replacements[removedId];
      if (!replacementId) continue;

      const oldType = oldTypeMap.get(removedId);
      const newType = newTypeMap.get(replacementId);
      if (!oldType || !newType) continue;

      rowOps.push({
        updateMany: {
          filter: {
            sheetId: new mongoose.Types.ObjectId(sheetId),
            [`cells.${typeCol.id}`]: oldType.name,
          },
          update: {
            $set: { [`cells.${typeCol.id}`]: newType.name },
          },
        },
      });
    }

    // Handle renames
    for (const newType of newTypes) {
      const oldType = oldTypeMap.get(newType.id);
      if (oldType && oldType.name !== newType.name) {
        rowOps.push({
          updateMany: {
            filter: {
              sheetId: new mongoose.Types.ObjectId(sheetId),
              [`cells.${typeCol.id}`]: oldType.name,
            },
            update: {
              $set: { [`cells.${typeCol.id}`]: newType.name },
            },
          },
        });
      }
    }
  }

  // Update column dropdown options for the Type column
  const updatedColumns = sheet.columns.map((col) => {
    if (col.systemField === 'type') {
      return {
        ...col,
        options: newTypes.map((t) => ({ label: t.name })),
      };
    }
    return col;
  });

  // Count rows that will be moved due to replacements (before transaction)
  let itemTypesRowsMoved = 0;
  if (typeCol && removedIds.length > 0) {
    const allRows = await Row.find({ sheetId: new mongoose.Types.ObjectId(sheetId) }).select('cells').lean();
    for (const removedId of removedIds) {
      if (replacements[removedId]) {
        const oldType = oldTypeMap.get(removedId);
        if (oldType) {
          itemTypesRowsMoved += allRows.filter((r) => {
            const cells = (r.cells as unknown as Record<string, unknown>) ?? {};
            return typeof cells[typeCol.id] === 'string' &&
              (cells[typeCol.id] as string).toLowerCase() === oldType.name.toLowerCase();
          }).length;
        }
      }
    }
  }

  // Execute atomically
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    if (rowOps.length > 0) {
      await Row.bulkWrite(rowOps, { session });
    }

    await Sheet.findByIdAndUpdate(
      sheetId,
      {
        $set: {
          'project.itemTypes': newTypes,
          columns: updatedColumns,
        },
      },
      { session },
    );

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }

  const updated = await Sheet.findById(sheetId);
  if (!updated) throw new AppError('Failed to update item types', 500);

  // Compute summary for activity log
  try {
    const addedNames: string[] = [];
    const renamedList: Array<{ from: string; to: string }> = [];
    const removedNames: string[] = [];

    const oldIds = new Set(oldTypes.map((t) => t.id));
    const newIds = new Set(newTypes.map((t) => t.id));

    for (const t of newTypes) {
      if (!oldIds.has(t.id)) {
        addedNames.push(t.name);
      } else {
        const oldT = oldTypeMap.get(t.id);
        if (oldT && oldT.name !== t.name) {
          renamedList.push({ from: oldT.name, to: t.name });
        }
      }
    }

    for (const t of oldTypes) {
      if (!newIds.has(t.id)) {
        removedNames.push(t.name);
      }
    }

    recordActivity({
      sheetId,
      actorId: userId,
      action: 'project.item_types_changed',
      details: { added: addedNames, renamed: renamedList, removed: removedNames, rowsMoved: itemTypesRowsMoved },
    });
  } catch (err) {
    console.error('[projectSettingsService] Failed to record project.item_types_changed activity:', err);
  }

  return updated;
}
