import mongoose from 'mongoose';
import Sheet, { type ISheet } from '../models/Sheet';
import Row from '../models/Row';
import UserSheetMeta, { type IUserSheetMeta } from '../models/UserSheetMeta';
import Workspace, { type IWorkspace } from '../models/Workspace';
import { getMemberRole } from './workspaceService';
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
  };
  workspace: {
    id: string;
    name: string;
  };
  lastOpenedAt: Date | null;
  isFavorite: boolean;
}

function formatSheetMeta(
  sheetDoc: { _id: mongoose.Types.ObjectId; name: string; updatedAt: Date; workspaceId: mongoose.Types.ObjectId },
  workspaceDoc: { _id: mongoose.Types.ObjectId; name: string },
  meta: IUserSheetMeta,
): SheetMetaResponse {
  return {
    sheet: {
      id: sheetDoc._id.toString(),
      name: sheetDoc.name,
      updatedAt: sheetDoc.updatedAt,
      workspaceId: sheetDoc.workspaceId.toString(),
    },
    workspace: {
      id: workspaceDoc._id.toString(),
      name: workspaceDoc.name,
    },
    lastOpenedAt: meta.lastOpenedAt,
    isFavorite: meta.isFavorite,
  };
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
  return formatSheet(populated);
}

/** Updates sheet details (name and/or description). Requires editor+ membership. */
export async function updateSheetDetails(
  sheetId: string,
  patch: { name?: string; description?: string },
  userId: string,
) {
  const { sheet } = await getSheetWithAccess(sheetId, userId, 'editor');

  const updates: Record<string, unknown> = {};
  if (patch.name !== undefined) updates.name = patch.name;
  if (patch.description !== undefined) updates.description = patch.description || undefined;

  const updated = await Sheet.findByIdAndUpdate(
    sheet._id,
    { $set: updates },
    { new: true, runValidators: true },
  ).populate('createdBy', CREATED_BY_POPULATE);

  if (!updated) throw new AppError('Sheet not found', 404);
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

  const newSheet = await Sheet.create({
    workspaceId: sheet.workspaceId,
    name: copyName,
    createdBy: new mongoose.Types.ObjectId(userId),
    columns: sheet.columns || [],
  });

  // Copy all rows from the original sheet, preserving hierarchy
  const sourceRows = await Row.find({ sheetId: sheet._id }).sort({ order: 1 });
  if (sourceRows.length > 0) {
    // First pass: create new rows and build old→new ID mapping
    const idMap = new Map<string, mongoose.Types.ObjectId>();
    const newRows: Array<{
      sheetId: mongoose.Types.ObjectId;
      order: number;
      cells: Record<string, unknown>;
      formatting: Record<string, unknown>;
      height?: number;
      parentId: mongoose.Types.ObjectId | null;
      depth: number;
    }> = [];

    for (const r of sourceRows) {
      const newId = new mongoose.Types.ObjectId();
      idMap.set(r._id.toString(), newId);
      newRows.push({
        _id: newId,
        sheetId: newSheet._id,
        order: r.order,
        cells: r.cells || {},
        formatting: r.formatting instanceof Map ? Object.fromEntries(r.formatting) : (r.toObject().formatting || {}),
        height: r.height ?? undefined,
        parentId: r.parentId ? (idMap.get(r.parentId.toString()) ?? r.parentId) : null,
        depth: r.depth ?? 0,
        assigneeIds: r.assigneeIds || [],
      } as any);
    }

    // Fix up parentId references to use new IDs
    for (let i = 0; i < newRows.length; i++) {
      const srcRow = sourceRows[i];
      if (srcRow.parentId) {
        const newParentId = idMap.get(srcRow.parentId.toString());
        (newRows[i] as any).parentId = newParentId ?? null;
      }
    }

    await Row.insertMany(newRows as any[]);
  }

  const populated = await Sheet.findById(newSheet._id).populate('createdBy', CREATED_BY_POPULATE);
  if (!populated) throw new AppError('Failed to duplicate sheet', 500);
  return formatSheet(populated);
}

/** Deletes a sheet and its associated user meta and rows. Requires admin/owner membership. */
export async function deleteSheet(sheetId: string, userId: string) {
  const { sheet } = await getSheetWithAccess(sheetId, userId, 'admin');

  // Delete all rows for this sheet
  await Row.deleteMany({ sheetId: sheet._id });

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
    .populate('sheetId', 'name updatedAt workspaceId')
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
      const sheetObj = meta.sheetId as unknown as { _id: mongoose.Types.ObjectId; name: string; updatedAt: Date; workspaceId: mongoose.Types.ObjectId };
      const wsObj = meta.workspaceId as unknown as { _id: mongoose.Types.ObjectId; name: string };
      results.push(formatSheetMeta(sheetObj, wsObj, meta));
      continue;
    }

    // If not a workspace member, check direct sheet share
    const sheetId = (meta.sheetId as unknown as { _id: mongoose.Types.ObjectId })._id?.toString()
      ?? meta.sheetId.toString();
    const effectiveRole = await getEffectiveRole(userId, sheetId);
    if (effectiveRole) {
      const sheetObj = meta.sheetId as unknown as { _id: mongoose.Types.ObjectId; name: string; updatedAt: Date; workspaceId: mongoose.Types.ObjectId };
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
    .populate('sheetId', 'name updatedAt workspaceId')
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
      const sheetObj = meta.sheetId as unknown as { _id: mongoose.Types.ObjectId; name: string; updatedAt: Date; workspaceId: mongoose.Types.ObjectId };
      const wsObj = meta.workspaceId as unknown as { _id: mongoose.Types.ObjectId; name: string };
      results.push(formatSheetMeta(sheetObj, wsObj, meta));
      continue;
    }

    // If not a workspace member, check direct sheet share
    const sheetId = (meta.sheetId as unknown as { _id: mongoose.Types.ObjectId })._id?.toString()
      ?? meta.sheetId.toString();
    const effectiveRole = await getEffectiveRole(userId, sheetId);
    if (effectiveRole) {
      const sheetObj = meta.sheetId as unknown as { _id: mongoose.Types.ObjectId; name: string; updatedAt: Date; workspaceId: mongoose.Types.ObjectId };
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
