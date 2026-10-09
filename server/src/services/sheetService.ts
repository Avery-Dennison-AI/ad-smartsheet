import crypto from 'crypto';
import mongoose from 'mongoose';
import Sheet, { type ISheet } from '../models/Sheet';
import Row from '../models/Row';
import Comment from '../models/Comment';
import UserSheetMeta, { type IUserSheetMeta } from '../models/UserSheetMeta';
import Workspace, { type IWorkspace } from '../models/Workspace';
import { getMemberRole } from './workspaceService';
import { recordActivity } from './activityService';
import { deleteAttachmentsForSheet } from './attachmentService';
import { AppError } from '../utils/AppError';
import { requireSheetAccess, hasMinRole as permHasMinRole, getEffectiveRole } from './permissionService';
import type { SheetRole } from './permissionService';

const CREATED_BY_POPULATE = '_id fullName email';

/** Role hierarchy for permission checks. */
const ROLE_LEVEL: Record<string, number> = {
  viewer: 1,
  editor: 2,
  admin: 3,
  owner: 4,
};

function hasMinRole(userRole: string, minRole: string): boolean {
  return (ROLE_LEVEL[userRole] ?? 0) >= (ROLE_LEVEL[minRole] ?? 0);
}

/** Formats a sheet document for API responses. */
function formatSheet(sheet: ISheet) {
  const obj = sheet.toObject();
  const createdBy = sheet.createdBy as unknown as { _id?: string; id?: string; fullName: string; email: string } | string;
  let createdByFormatted: { id: string; fullName: string; email: string } | string = String(createdBy);
  if (createdBy && typeof createdBy === 'object' && 'fullName' in createdBy) {
    createdByFormatted = {
      id: ((createdBy._id || createdBy.id) ?? '').toString(),
      fullName: createdBy.fullName,
      email: createdBy.email,
    };
  }
  return {
    ...obj,
    id: sheet._id.toString(),
    _id: undefined,
    __v: undefined,
    workspaceId: sheet.workspaceId.toString(),
    createdBy: createdByFormatted,
  };
}

// ─── Shared access-check helper ────────────────────────────────────────────

type WorkspaceRole = 'viewer' | 'editor' | 'admin' | 'owner';

interface SheetWithAccess {
  sheet: ISheet;
  workspace: IWorkspace;
  userRole: WorkspaceRole;
}

/**
 * Validates sheetId, loads the sheet and its workspace, checks membership,
 * and verifies the user has at least `requiredRole`. Returns all three together.
 * Delegates to the central permissionService.
 */
async function getSheetWithAccess(
  sheetId: string,
  userId: string,
  requiredRole: WorkspaceRole = 'viewer',
): Promise<SheetWithAccess> {
  const result = await requireSheetAccess(userId, sheetId, requiredRole as SheetRole);
  return {
    sheet: result.sheet,
    workspace: result.workspace,
    userRole: result.effectiveRole as WorkspaceRole,
  };
}

// ─── Shared meta formatter ─────────────────────────────────────────────────

interface SheetMetaResponse {
  sheet: {
    id: string;
    name: string;
    updatedAt: Date;
    workspaceId: string;
    kind: 'sheet' | 'project';
    keyPrefix?: string;
  };
  workspace: {
    id: string;
    name: string;
  };
  lastOpenedAt: Date | null;
  isFavorite: boolean;
}

function formatSheetMeta(
  sheetDoc: { _id: mongoose.Types.ObjectId; name: string; updatedAt: Date; workspaceId: mongoose.Types.ObjectId; kind?: string; project?: { keyPrefix?: string } },
  workspaceDoc: { _id: mongoose.Types.ObjectId; name: string },
  meta: IUserSheetMeta,
): SheetMetaResponse {
  const kind = (sheetDoc.kind === 'project' ? 'project' : 'sheet') as 'sheet' | 'project';
  const result: SheetMetaResponse = {
    sheet: {
      id: sheetDoc._id.toString(),
      name: sheetDoc.name,
      updatedAt: sheetDoc.updatedAt,
      workspaceId: sheetDoc.workspaceId.toString(),
      kind,
    },
    workspace: {
      id: workspaceDoc._id.toString(),
      name: workspaceDoc.name,
    },
    lastOpenedAt: meta.lastOpenedAt,
    isFavorite: meta.isFavorite,
  };
  if (kind === 'project' && sheetDoc.project?.keyPrefix) {
    result.sheet.keyPrefix = sheetDoc.project.keyPrefix;
  }
  return result;
}

// ─── Public service functions ──────────────────────────────────────────────

/** Lists all sheets in a workspace. Requires viewer+ membership. */
export async function listSheets(workspaceId: string, userId: string) {
  if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
    throw new AppError('Invalid workspace ID', 400);
  }

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new AppError('Workspace not found', 404);

  const role = getMemberRole(workspace, userId);
  if (!role) throw new AppError('Workspace not found', 404);

  const sheets = await Sheet.find({ workspaceId })
    .sort({ updatedAt: -1 })
    .populate('createdBy', CREATED_BY_POPULATE);

  return sheets.map(formatSheet);
}

/** Gets a single sheet and records it as recently opened. Requires viewer+ membership. */
export async function getSheet(sheetId: string, userId: string) {
  const { sheet, workspace, userRole } = await getSheetWithAccess(sheetId, userId, 'viewer');

  // Record recent access
  await UserSheetMeta.findOneAndUpdate(
    { userId: new mongoose.Types.ObjectId(userId), sheetId: new mongoose.Types.ObjectId(sheetId) },
    {
      $set: { lastOpenedAt: new Date(), workspaceId: sheet.workspaceId },
    },
    { upsert: true, new: true },
  );

  return {
    ...formatSheet(sheet),
    workspaceName: workspace.name,
    userRole,
  };
}

/** Creates a new sheet in a workspace. Requires editor+ membership. */
export async function createSheet(workspaceId: string, name: string, userId: string) {
  if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
    throw new AppError('Invalid workspace ID', 400);
  }

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new AppError('Workspace not found', 404);

  const role = getMemberRole(workspace, userId);
  if (!role) throw new AppError('Workspace not found', 404);
  if (!hasMinRole(role, 'editor')) {
    throw new AppError('Only editors and above can create sheets', 403);
  }

  const sheet = await Sheet.create({
    workspaceId: new mongoose.Types.ObjectId(workspaceId),
    name,
    createdBy: new mongoose.Types.ObjectId(userId),
  });

  const populated = await Sheet.findById(sheet._id).populate('createdBy', CREATED_BY_POPULATE);
  if (!populated) throw new AppError('Failed to create sheet', 500);

  // Record sheet.created activity (fire-and-forget)
  recordActivity({
    sheetId: sheet._id.toString(),
    actorId: userId,
    action: 'sheet.created',
    details: { name },
  });

  return formatSheet(populated);
}

/** Updates sheet details (name and/or description). Requires editor+ membership. */
export async function updateSheetDetails(
  sheetId: string,
  patch: { name?: string; description?: string },
  userId: string,
) {
  const { sheet } = await getSheetWithAccess(sheetId, userId, 'editor');

  // Capture old name for activity logging
  const oldName = sheet.name;

  const updates: Record<string, unknown> = {};
  if (patch.name !== undefined) updates.name = patch.name;
  if (patch.description !== undefined) updates.description = patch.description || undefined;

  const updated = await Sheet.findByIdAndUpdate(
    sheet._id,
    { $set: updates },
    { new: true, runValidators: true },
  ).populate('createdBy', CREATED_BY_POPULATE);

  if (!updated) throw new AppError('Sheet not found', 404);

  // Record sheet.renamed activity if name changed (fire-and-forget)
  if (patch.name !== undefined && oldName !== patch.name) {
    recordActivity({
      sheetId,
      actorId: userId,
      action: 'sheet.renamed',
      details: { oldName, newName: patch.name },
    });
  }

  return formatSheet(updated);
}

/** Renames a sheet. Requires editor+ membership. (Legacy — prefer updateSheetDetails.) */
export async function renameSheet(sheetId: string, name: string, userId: string) {
  return updateSheetDetails(sheetId, { name }, userId);
}

/** Duplicates a sheet within the same workspace. Requires editor+ membership. */
export async function duplicateSheet(sheetId: string, userId: string) {
  const { sheet } = await getSheetWithAccess(sheetId, userId, 'editor');

  // Truncate name so "Copy of " + name <= 100 characters
  const prefix = 'Copy of ';
  const maxNameLen = 100 - prefix.length; // 92
  const truncatedName = sheet.name.length > maxNameLen
    ? sheet.name.slice(0, maxNameLen)
    : sheet.name;
  const copyName = `${prefix}${truncatedName}`;

  // Build the new sheet document data
  const createData: Record<string, unknown> = {
    workspaceId: sheet.workspaceId,
    name: copyName,
    createdBy: new mongoose.Types.ObjectId(userId),
    // Preserve all column properties including systemField, formatting, width
    columns: (sheet.columns || []).map((col) => ({ ...col })),
  };

  // Handle project-specific duplication
  if (sheet.kind === 'project' && sheet.project) {
    // Generate a unique key prefix
    const newKeyPrefix = await generateUniqueKeyPrefix(sheet.workspaceId, sheet.project.keyPrefix);

    createData.kind = 'project';
    createData.project = {
      keyPrefix: newKeyPrefix,
      template: sheet.project.template,
      statuses: sheet.project.statuses.map((s) => ({ ...s, id: crypto.randomUUID() })),
      itemTypes: sheet.project.itemTypes.map((t) => ({ ...t, id: crypto.randomUUID() })),
      nextKeyNumber: 1,
    };
  }

  const newSheet = await Sheet.create(createData);

  // Copy all rows from the original sheet, preserving hierarchy
  const sourceRows = await Row.find({ sheetId: sheet._id }).sort({ order: 1 });
  if (sourceRows.length > 0) {
    // First pass: create new rows and build old→new ID mapping
    const idMap = new Map<string, mongoose.Types.ObjectId>();
    const newRows: Array<Record<string, unknown>> = [];

    for (const r of sourceRows) {
      const newId = new mongoose.Types.ObjectId();
      idMap.set(r._id.toString(), newId);
      newRows.push({
        _id: newId,
        sheetId: newSheet._id,
        order: r.order,
        cells: r.cells instanceof Map ? Object.fromEntries(r.cells) : (r.toObject().cells || {}),
        formatting: r.formatting instanceof Map ? Object.fromEntries(r.formatting) : (r.toObject().formatting || {}),
        height: r.height ?? undefined,
        parentId: null, // will be fixed up below
        depth: r.depth ?? 0,
        assigneeIds: r.assigneeIds || [],
      });
    }

    // Fix up parentId references to use new IDs
    for (let i = 0; i < newRows.length; i++) {
      const srcRow = sourceRows[i];
      if (srcRow.parentId) {
        const newParentId = idMap.get(srcRow.parentId.toString());
        newRows[i].parentId = newParentId ?? null;
      }
    }

    await Row.insertMany(newRows as any[]);

    // For project sheets, re-key all copied rows in order
    if (sheet.kind === 'project' && sheet.project) {
      const keyCol = (sheet.columns || []).find((c) => c.systemField === 'key');
      if (keyCol) {
        const newProject = createData.project as { keyPrefix: string; nextKeyNumber: number };
        const bulkOps: Array<{ updateOne: { filter: { _id: mongoose.Types.ObjectId }; update: Record<string, unknown> } }> = [];

        for (let i = 0; i < newRows.length; i++) {
          // Atomically increment the counter — new: false returns pre-increment value
          const updated = await Sheet.findOneAndUpdate(
            { _id: newSheet._id },
            { $inc: { 'project.nextKeyNumber': 1 } },
            { new: false },
          );
          if (updated && updated.project) {
            const num = updated.project.nextKeyNumber; // pre-increment value
            const newKey = `${newProject.keyPrefix}-${num}`;
            const rowId = newRows[i]._id as mongoose.Types.ObjectId;
            bulkOps.push({
              updateOne: {
                filter: { _id: rowId },
                update: { $set: { [`cells.${keyCol.id}`]: newKey } },
              },
            });
          }
        }

        if (bulkOps.length > 0) {
          await Row.bulkWrite(bulkOps);
        }
      }
    }
  }

  const populated = await Sheet.findById(newSheet._id).populate('createdBy', CREATED_BY_POPULATE);
  if (!populated) throw new AppError('Failed to duplicate sheet', 500);

  // Record sheet.duplicated activity (fire-and-forget)
  try {
    recordActivity({
      sheetId: newSheet._id.toString(),
      actorId: userId,
      action: 'sheet.duplicated',
      details: {
        originalSheetId: sheet._id.toString(),
        originalName: sheet.name,
        newName: newSheet.name,
      },
    });
  } catch (err) {
    console.error('[sheetService] Failed to record sheet.duplicated activity:', err);
  }

  return formatSheet(populated);
}

/**
 * Generates a unique key prefix for a duplicated project sheet.
 * Appends "2", "3", etc. to the base prefix; truncates base if over 6 chars total.
 */
async function generateUniqueKeyPrefix(workspaceId: mongoose.Types.ObjectId, originalPrefix: string): Promise<string> {
  let candidate = `${originalPrefix}2`;
  if (candidate.length > 6) {
    candidate = `${originalPrefix.slice(0, 5)}2`;
  }

  let suffix = 2;
  while (true) {
    const existing = await Sheet.findOne({
      workspaceId,
      'project.keyPrefix': candidate,
    }).select('_id');
    if (!existing) return candidate;

    suffix++;
    candidate = `${originalPrefix}${suffix}`;
    if (candidate.length > 6) {
      const maxBase = 6 - String(suffix).length;
      candidate = `${originalPrefix.slice(0, Math.max(1, maxBase))}${suffix}`;
    }
  }
}

/** Deletes a sheet and its associated user meta and rows. Requires admin/owner membership. */
export async function deleteSheet(sheetId: string, userId: string) {
  const { sheet } = await getSheetWithAccess(sheetId, userId, 'admin');

  // Delete all rows for this sheet
  await Row.deleteMany({ sheetId: sheet._id });

  // Soft-delete all comments for this sheet
  Comment.updateMany(
    { sheetId: sheet._id },
    { deletedAt: new Date() },
  ).catch((err) => {
    console.error('[sheetService] Failed to soft-delete comments on deleted sheet:', err);
  });

  // Soft-delete all attachments for this sheet (fire-and-forget)
  deleteAttachmentsForSheet(sheet._id.toString()).catch((err) => {
    console.error('[sheetService] Failed to soft-delete attachments on deleted sheet:', err);
  });

  await Sheet.findByIdAndDelete(sheet._id);
  await UserSheetMeta.deleteMany({ sheetId: sheet._id });

  return { deleted: true, sheetId: sheet._id.toString() };
}

/** Deletes all sheets, rows, and user meta for a workspace. Called internally during workspace deletion. */
export async function deleteSheetsByWorkspace(workspaceId: string): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(workspaceId)) return;

  const wsObjectId = new mongoose.Types.ObjectId(workspaceId);

  // Delete all rows for all sheets in this workspace
  const sheets = await Sheet.find({ workspaceId: wsObjectId }).select('_id');
  const sheetIds = sheets.map((s) => s._id);
  if (sheetIds.length > 0) {
    await Row.deleteMany({ sheetId: { $in: sheetIds } });
  }

  await Sheet.deleteMany({ workspaceId: wsObjectId });
  await UserSheetMeta.deleteMany({ workspaceId: wsObjectId });
}

/** Returns recently opened sheets for the user. Includes sheets accessible via direct sharing. */
export async function getRecents(userId: string, limit = 20) {
  const metas = await UserSheetMeta.find({
    userId: new mongoose.Types.ObjectId(userId),
    lastOpenedAt: { $ne: null },
  })
    .sort({ lastOpenedAt: -1 })
    .populate('sheetId', 'name updatedAt workspaceId kind project')
    .populate('workspaceId', 'name');

  // Filter out entries where the sheet or workspace no longer exists
  const validMetas = metas.filter((m) => m.sheetId && m.workspaceId);

  // Batch-load all referenced workspaces in one query
  const workspaceIds = [...new Set(validMetas.map((m) =>
    (m.workspaceId as unknown as { _id: mongoose.Types.ObjectId })._id?.toString()
    ?? m.workspaceId.toString(),
  ))];

  const workspaces = await Workspace.find({ _id: { $in: workspaceIds } });
  const wsMap = new Map(workspaces.map((ws) => [ws._id.toString(), ws]));

  // Filter by membership (workspace OR direct sheet share) and build results
  const results: SheetMetaResponse[] = [];
  for (const meta of validMetas) {
    const wsId = (meta.workspaceId as unknown as { _id: mongoose.Types.ObjectId })._id?.toString()
      ?? meta.workspaceId.toString();
    const workspace = wsMap.get(wsId);
    if (!workspace) continue;

    // Check workspace membership first
    const wsRole = getMemberRole(workspace, userId);
    if (wsRole) {
      const sheetObj = meta.sheetId as unknown as { _id: mongoose.Types.ObjectId; name: string; updatedAt: Date; workspaceId: mongoose.Types.ObjectId; kind?: string; project?: { keyPrefix?: string } };
      const wsObj = meta.workspaceId as unknown as { _id: mongoose.Types.ObjectId; name: string };
      results.push(formatSheetMeta(sheetObj, wsObj, meta));
      continue;
    }

    // If not a workspace member, check direct sheet share
    const sheetId = (meta.sheetId as unknown as { _id: mongoose.Types.ObjectId })._id?.toString()
      ?? meta.sheetId.toString();
    const effectiveRole = await getEffectiveRole(userId, sheetId);
    if (effectiveRole) {
      const sheetObj = meta.sheetId as unknown as { _id: mongoose.Types.ObjectId; name: string; updatedAt: Date; workspaceId: mongoose.Types.ObjectId; kind?: string; project?: { keyPrefix?: string } };
      const wsObj = meta.workspaceId as unknown as { _id: mongoose.Types.ObjectId; name: string };
      results.push(formatSheetMeta(sheetObj, wsObj, meta));
    }
  }

  return results.slice(0, limit);
}

/** Returns favorite sheets for the user. Includes sheets accessible via direct sharing. */
export async function getFavorites(userId: string) {
  const metas = await UserSheetMeta.find({
    userId: new mongoose.Types.ObjectId(userId),
    isFavorite: true,
  })
    .populate('sheetId', 'name updatedAt workspaceId kind project')
    .populate('workspaceId', 'name');

  // Filter out entries where the sheet or workspace no longer exists
  const validMetas = metas.filter((m) => m.sheetId && m.workspaceId);

  // Batch-load all referenced workspaces in one query
  const workspaceIds = [...new Set(validMetas.map((m) =>
    (m.workspaceId as unknown as { _id: mongoose.Types.ObjectId })._id?.toString()
    ?? m.workspaceId.toString(),
  ))];

  const workspaces = await Workspace.find({ _id: { $in: workspaceIds } });
  const wsMap = new Map(workspaces.map((ws) => [ws._id.toString(), ws]));

  // Filter by membership (workspace OR direct sheet share) and build results
  const results: SheetMetaResponse[] = [];
  for (const meta of validMetas) {
    const wsId = (meta.workspaceId as unknown as { _id: mongoose.Types.ObjectId })._id?.toString()
      ?? meta.workspaceId.toString();
    const workspace = wsMap.get(wsId);
    if (!workspace) continue;

    // Check workspace membership first
    const wsRole = getMemberRole(workspace, userId);
    if (wsRole) {
      const sheetObj = meta.sheetId as unknown as { _id: mongoose.Types.ObjectId; name: string; updatedAt: Date; workspaceId: mongoose.Types.ObjectId; kind?: string; project?: { keyPrefix?: string } };
      const wsObj = meta.workspaceId as unknown as { _id: mongoose.Types.ObjectId; name: string };
      results.push(formatSheetMeta(sheetObj, wsObj, meta));
      continue;
    }

    // If not a workspace member, check direct sheet share
    const sheetId = (meta.sheetId as unknown as { _id: mongoose.Types.ObjectId })._id?.toString()
      ?? meta.sheetId.toString();
    const effectiveRole = await getEffectiveRole(userId, sheetId);
    if (effectiveRole) {
      const sheetObj = meta.sheetId as unknown as { _id: mongoose.Types.ObjectId; name: string; updatedAt: Date; workspaceId: mongoose.Types.ObjectId; kind?: string; project?: { keyPrefix?: string } };
      const wsObj = meta.workspaceId as unknown as { _id: mongoose.Types.ObjectId; name: string };
      results.push(formatSheetMeta(sheetObj, wsObj, meta));
    }
  }

  // Sort by sheet updatedAt desc
  results.sort((a, b) => {
    const dateA = new Date(a.sheet.updatedAt).getTime();
    const dateB = new Date(b.sheet.updatedAt).getTime();
    return dateB - dateA;
  });

  return results;
}

/** Sets the favorite status of a sheet for the user. */
export async function setFavorite(sheetId: string, userId: string, starred: boolean) {
  const { sheet } = await getSheetWithAccess(sheetId, userId, 'viewer');

  await UserSheetMeta.findOneAndUpdate(
    { userId: new mongoose.Types.ObjectId(userId), sheetId: new mongoose.Types.ObjectId(sheetId) },
    {
      $set: {
        isFavorite: starred,
        workspaceId: sheet.workspaceId,
      },
    },
    { upsert: true },
  );

  return { sheetId, isFavorite: starred };
}
