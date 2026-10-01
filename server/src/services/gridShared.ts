import mongoose from 'mongoose';
import Sheet, { type ISheet, type ColumnDef, type ColumnType } from '../models/Sheet';
import Row, { type IRow } from '../models/Row';
import Workspace from '../models/Workspace';
import { getMemberRole, getMemberId } from './workspaceService';
import { AppError } from '../utils/AppError';

// ─── Role hierarchy ────────────────────────────────────────────────────────

export const ROLE_LEVEL: Record<string, number> = {
  viewer: 1,
  editor: 2,
  admin: 3,
  owner: 4,
};

export function hasMinRole(userRole: string, minRole: string): boolean {
  return (ROLE_LEVEL[userRole] ?? 0) >= (ROLE_LEVEL[minRole] ?? 0);
}

export type WorkspaceRole = 'viewer' | 'editor' | 'admin' | 'owner';

export interface SheetWithAccess {
  sheet: ISheet;
  workspace: typeof Workspace.prototype;
  userRole: WorkspaceRole;
}

/**
 * Validates sheetId, loads the sheet and its workspace, checks membership,
 * and verifies the user has at least `requiredRole`.
 */
export async function getSheetWithAccess(
  sheetId: string,
  userId: string,
  requiredRole: WorkspaceRole = 'viewer',
): Promise<SheetWithAccess> {
  if (!mongoose.Types.ObjectId.isValid(sheetId)) {
    throw new AppError('Invalid sheet ID', 400);
  }

  const sheet = await Sheet.findById(sheetId);
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

// ─── Cell validation ───────────────────────────────────────────────────────

export function validateCellValue(type: ColumnType, value: unknown): unknown {
  if (value === null || value === undefined || value === '') return null;

  switch (type) {
    case 'text':
      return String(value);
    case 'number': {
      const num = Number(value);
      if (isNaN(num)) throw new AppError('Invalid number value', 400);
      return num;
    }
    case 'date': {
      const str = String(value);
      const d = new Date(str);
      if (isNaN(d.getTime())) throw new AppError('Invalid date value', 400);
      return str;
    }
    case 'dropdown':
      return String(value);
    case 'checkbox':
      return Boolean(value);
    case 'contact':
      return String(value);
    default:
      return value;
  }
}

// ─── Column serialization ──────────────────────────────────────────────────

/**
 * Extracts explicit fields from a column (whether a raw object or a Mongoose
 * subdocument) and returns a plain JS object.
 */
export function serializeColumn(col: any): ColumnDef {
  return {
    id: col.id ?? col._id?.toString(),
    name: col.name,
    type: col.type,
    order: col.order,
    isPrimary: col.isPrimary ?? false,
    options: col.options ? col.options.map((o: any) => ({ label: o.label, color: o.color })) : undefined,
    formatting: col.formatting ?? undefined,
    width: col.width ?? undefined,
  };
}

// ─── Row serialization ─────────────────────────────────────────────────────

export function formatRow(row: IRow) {
  const obj = row.toObject();
  return {
    id: row._id.toString(),
    order: row.order,
    cells: obj.cells || {},
    formatting: row.formatting instanceof Map ? Object.fromEntries(row.formatting) : (obj.formatting || {}),
    height: row.height ?? undefined,
    parentId: row.parentId ? row.parentId.toString() : null,
    depth: row.depth ?? 0,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
