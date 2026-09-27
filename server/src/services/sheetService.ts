import mongoose from 'mongoose';
import Sheet, { type ISheet } from '../models/Sheet';
import UserSheetMeta, { type IUserSheetMeta } from '../models/UserSheetMeta';
import Workspace, { type IWorkspace } from '../models/Workspace';
import { getMemberRole } from './workspaceService';
import { AppError } from '../utils/AppError';

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
 */
async function getSheetWithAccess(
  sheetId: string,
  userId: string,
  requiredRole: WorkspaceRole = 'viewer',
): Promise<SheetWithAccess> {
  if (!mongoose.Types.ObjectId.isValid(sheetId)) {
    throw new AppError('Invalid sheet ID', 400);
  }

  const sheet = await Sheet.findById(sheetId).populate('createdBy', CREATED_BY_POPULATE);
  if (!sheet) throw new AppError('Sheet not found', 404);

  const workspace = await Workspace.findById(sheet.workspaceId);
  if (!workspace) throw new AppError('Sheet not found', 404);

  const role = getMemberRole(workspace, userId);
  if (!role) throw new AppError('Access denied', 403);
  if (!hasMinRole(role, requiredRole)) {
    throw new AppError('Access denied', 403);
  }

  return { sheet, workspace, userRole: role as WorkspaceRole };
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

/** Renames a sheet. Requires editor+ membership. */
export async function renameSheet(sheetId: string, name: string, userId: string) {
  const { sheet } = await getSheetWithAccess(sheetId, userId, 'editor');

  const updated = await Sheet.findByIdAndUpdate(
    sheet._id,
    { $set: { name } },
    { new: true, runValidators: true },
  ).populate('createdBy', CREATED_BY_POPULATE);

  if (!updated) throw new AppError('Sheet not found', 404);
  return formatSheet(updated);
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
  });

  const populated = await Sheet.findById(newSheet._id).populate('createdBy', CREATED_BY_POPULATE);
  if (!populated) throw new AppError('Failed to duplicate sheet', 500);
  return formatSheet(populated);
}

/** Deletes a sheet and its associated user meta. Requires admin/owner membership. */
export async function deleteSheet(sheetId: string, userId: string) {
  const { sheet } = await getSheetWithAccess(sheetId, userId, 'admin');

  await Sheet.findByIdAndDelete(sheet._id);
  await UserSheetMeta.deleteMany({ sheetId: sheet._id });

  return { deleted: true, sheetId: sheet._id.toString() };
}

/** Deletes all sheets and user meta for a workspace. Called internally during workspace deletion. */
export async function deleteSheetsByWorkspace(workspaceId: string): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(workspaceId)) return;

  await Sheet.deleteMany({ workspaceId: new mongoose.Types.ObjectId(workspaceId) });
  await UserSheetMeta.deleteMany({ workspaceId: new mongoose.Types.ObjectId(workspaceId) });
}

/** Returns recently opened sheets for the user. */
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

  // Filter by membership and build results
  const results: SheetMetaResponse[] = [];
  for (const meta of validMetas) {
    const wsId = (meta.workspaceId as unknown as { _id: mongoose.Types.ObjectId })._id?.toString()
      ?? meta.workspaceId.toString();
    const workspace = wsMap.get(wsId);
    if (!workspace) continue;

    const role = getMemberRole(workspace, userId);
    if (!role) continue;

    const sheetObj = meta.sheetId as unknown as { _id: mongoose.Types.ObjectId; name: string; updatedAt: Date; workspaceId: mongoose.Types.ObjectId };
    const wsObj = meta.workspaceId as unknown as { _id: mongoose.Types.ObjectId; name: string };
    results.push(formatSheetMeta(sheetObj, wsObj, meta));
  }

  return results.slice(0, limit);
}

/** Returns favorite sheets for the user. */
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

  // Filter by membership and build results
  const results: SheetMetaResponse[] = [];
  for (const meta of validMetas) {
    const wsId = (meta.workspaceId as unknown as { _id: mongoose.Types.ObjectId })._id?.toString()
      ?? meta.workspaceId.toString();
    const workspace = wsMap.get(wsId);
    if (!workspace) continue;

    const role = getMemberRole(workspace, userId);
    if (!role) continue;

    const sheetObj = meta.sheetId as unknown as { _id: mongoose.Types.ObjectId; name: string; updatedAt: Date; workspaceId: mongoose.Types.ObjectId };
    const wsObj = meta.workspaceId as unknown as { _id: mongoose.Types.ObjectId; name: string };
    results.push(formatSheetMeta(sheetObj, wsObj, meta));
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
