import mongoose from 'mongoose';
import Sheet, { type ISheet, type ColumnDef } from '../models/Sheet';
import Row, { type IRow } from '../models/Row';
import Workspace, { type IWorkspace } from '../models/Workspace';
import User from '../models/User';
import { calculateEffectiveRole } from './permissionService';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface MyWorkItem {
  rowId: string;
  taskName: string;
  rowKey?: string;
  key?: string;
  sheetId: string;
  sheetName: string;
  workspaceName: string;
  status: { label: string; color: string } | null;
  statusColor?: string;
  dueDate: string | null;
}

export interface MyWorkGroup {
  items: MyWorkItem[];
  total: number;
}

export interface MyWorkResponse {
  overdue: MyWorkGroup;
  dueToday: MyWorkGroup;
  dueThisWeek: MyWorkGroup;
  later: MyWorkGroup;
  noDueDate: MyWorkGroup;
}

const MAX_PER_GROUP = 50;

// ─── Pure helpers (exported for testing) ────────────────────────────────────────

/**
 * Returns true if the row should be excluded because it is "completed".
 * Checks for a checkbox column matching /done|complete/i that is true,
 * or a dropdown column named /status/i whose value is "Complete" or "Done".
 */
export function isRowCompleted(
  row: { cells: Record<string, unknown> },
  columns: ColumnDef[],
): boolean {
  // Check checkbox columns named /done|complete/i
  for (const col of columns) {
    if (col.type === 'checkbox' && /done|complete/i.test(col.name)) {
      const val = row.cells[col.id];
      if (val === true || val === 'true') return true;
    }
  }

  // Check dropdown columns named /status/i
  for (const col of columns) {
    if (col.type === 'dropdown' && /status/i.test(col.name)) {
      const val = row.cells[col.id];
      if (typeof val === 'string' && /^(complete|done)$/i.test(val)) return true;
    }
  }

  return false;
}

/**
 * Groups enriched MyWorkItems into 5 buckets based on due date relative to `now`.
 * Each bucket is sorted and capped at MAX_PER_GROUP.
 */
export function groupMyWorkItems(
  items: MyWorkItem[],
  now: Date,
): MyWorkResponse {
  // UTC midnight for today
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const weekEnd = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  const overdue: MyWorkItem[] = [];
  const dueToday: MyWorkItem[] = [];
  const dueThisWeek: MyWorkItem[] = [];
  const later: MyWorkItem[] = [];
  const noDueDate: MyWorkItem[] = [];

  for (const item of items) {
    if (!item.dueDate) {
      noDueDate.push(item);
      continue;
    }

    const due = new Date(item.dueDate);
    // Normalise due date to its UTC date boundary for comparison
    const dueDay = new Date(Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate()));

    if (dueDay < todayStart) {
      overdue.push(item);
    } else if (dueDay.getTime() === todayStart.getTime()) {
      dueToday.push(item);
    } else if (dueDay < weekEnd) {
      dueThisWeek.push(item);
    } else {
      later.push(item);
    }
  }

  // Sort each bucket
  overdue.sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
  dueToday.sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
  dueThisWeek.sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
  later.sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
  noDueDate.sort((a, b) => a.taskName.localeCompare(b.taskName));

  const cap = (arr: MyWorkItem[]): MyWorkGroup => ({
    items: arr.slice(0, MAX_PER_GROUP),
    total: arr.length,
  });

  return {
    overdue: cap(overdue),
    dueToday: cap(dueToday),
    dueThisWeek: cap(dueThisWeek),
    later: cap(later),
    noDueDate: cap(noDueDate),
  };
}

// ─── Main service function ──────────────────────────────────────────────────────

/**
 * Retrieves all rows assigned to the given user across accessible sheets,
 * filters out completed rows, enriches them, and groups by due date.
 */
export async function getMyWork(userId: string): Promise<MyWorkResponse> {
  // 1. Load the user for permission checks
  const user = await User.findById(userId).select('role guestExpiresAt isActive');
  if (!user || !user.isActive) {
    return emptyResponse();
  }

  const userData = {
    role: user.role,
    isActive: user.isActive,
    guestExpiresAt: user.guestExpiresAt,
  };

  // 2. Find all workspaces the user is a member of
  const workspaces = await Workspace.find({ 'members.user': userId }).select('_id name members');
  const workspaceIds = workspaces.map((ws) => ws._id);
  const workspaceMap = new Map<string, IWorkspace>();
  for (const ws of workspaces) {
    workspaceMap.set(ws._id.toString(), ws);
  }

  // 3. Find candidate sheets — in those workspaces OR directly shared with user
  const candidateSheets = await Sheet.find({
    $or: [
      { workspaceId: { $in: workspaceIds } },
      { 'members.userId': new mongoose.Types.ObjectId(userId) },
    ],
  }).select('_id workspaceId name columns members kind project');

  // 4. Filter to sheets the user truly has access to, and identify contact columns
  interface AccessibleSheet {
    sheet: ISheet;
    workspaceName: string;
    contactColumnIds: string[];
  }

  const accessibleSheets: AccessibleSheet[] = [];

  for (const sheet of candidateSheets) {
    const workspace = workspaceMap.get(sheet.workspaceId.toString()) ?? null;
    const wsForCheck = workspace
      ? { members: workspace.members.map((m) => ({ user: m.user, role: m.role })) }
      : null;

    const effectiveRole = calculateEffectiveRole(
      userData,
      wsForCheck,
      { members: sheet.members.map((m) => ({ userId: m.userId, role: m.role })) },
      userId,
    );

    if (!effectiveRole) continue;

    // Identify contact columns
    const contactColumnIds = sheet.columns
      .filter((c) => c.type === 'contact')
      .map((c) => c.id);

    if (contactColumnIds.length === 0) continue;

    const workspaceName = workspace?.name ?? 'Unknown';
    accessibleSheets.push({ sheet, workspaceName, contactColumnIds });
  }

  if (accessibleSheets.length === 0) {
    return emptyResponse();
  }

  // 5. Query rows in bulk for accessible sheets, filtered by assigneeIds
  const accessibleSheetIds = accessibleSheets.map((s) => s.sheet._id);
  const rows = await Row.find({
    sheetId: { $in: accessibleSheetIds },
    assigneeIds: new mongoose.Types.ObjectId(userId),
  })
    .select('_id sheetId cells')
    .lean();

  // Build a lookup map: sheetId → AccessibleSheet
  const sheetLookup = new Map<string, AccessibleSheet>();
  for (const as of accessibleSheets) {
    sheetLookup.set(as.sheet._id.toString(), as);
  }

  // 6. Process matching rows — all are already assigned to this user via assigneeIds
  const enrichedItems: MyWorkItem[] = [];

  for (const row of rows) {
    const sheetInfo = sheetLookup.get(row.sheetId.toString());
    if (!sheetInfo) continue;

    const cells = (row.cells ?? {}) as Record<string, unknown>;
    const isProject = sheetInfo.sheet.kind === 'project';

    // ── Completion check ────────────────────────────────────────────────────
    if (isProject && sheetInfo.sheet.project) {
      // Project: a row is done when its status matches a status with category === 'done'
      const statusCol = sheetInfo.sheet.columns.find((c) => c.systemField === 'status');
      if (statusCol) {
        const statusVal = cells[statusCol.id];
        if (typeof statusVal === 'string' && statusVal) {
          const projectStatus = sheetInfo.sheet.project.statuses.find(
            (s) => s.name.toLowerCase() === statusVal.toLowerCase(),
          );
          if (projectStatus?.category === 'done') continue;
        }
      }
    } else {
      // Plain sheet: use name-based heuristics
      if (isRowCompleted({ cells }, sheetInfo.sheet.columns)) continue;
    }

    // ── Enrich ──────────────────────────────────────────────────────────────
    const primaryCol = sheetInfo.sheet.columns.find((c) => c.isPrimary) ?? sheetInfo.sheet.columns[0];
    const taskName = primaryCol ? String(cells[primaryCol.id] ?? '') : '';

    let status: { label: string; color: string } | null = null;
    let statusColor: string | undefined;
    let dueDate: string | null = null;
    let key: string | undefined;

    if (isProject && sheetInfo.sheet.project) {
      // ── Project-aware column lookups via systemField ──────────────────────

      // Key: column with systemField === 'key'
      const keyCol = sheetInfo.sheet.columns.find((c) => c.systemField === 'key');
      if (keyCol) {
        key = (cells[keyCol.id] as string | undefined) ?? undefined;
      }

      // Status: column with systemField === 'status', look up in project.statuses for color
      const statusCol = sheetInfo.sheet.columns.find((c) => c.systemField === 'status');
      if (statusCol) {
        const statusVal = cells[statusCol.id];
        if (typeof statusVal === 'string' && statusVal) {
          const projectStatus = sheetInfo.sheet.project.statuses.find(
            (s) => s.name.toLowerCase() === statusVal.toLowerCase(),
          );
          status = {
            label: statusVal,
            color: projectStatus?.color ?? 'gray',
          };
          statusColor = projectStatus?.color;
        }
      }

      // Due date: column with systemField === 'due'
      const dueCol = sheetInfo.sheet.columns.find((c) => c.systemField === 'due');
      if (dueCol) {
        const raw = cells[dueCol.id];
        if (raw != null && raw !== '') {
          const parsed = new Date(raw as string);
          if (!isNaN(parsed.getTime())) {
            dueDate = parsed.toISOString();
          }
        }
      }
    } else {
      // ── Plain sheet: name-based heuristics ────────────────────────────────

      // Status: first dropdown column named /status/i
      const statusCol = sheetInfo.sheet.columns.find(
        (c) => c.type === 'dropdown' && /status/i.test(c.name),
      );
      if (statusCol) {
        const statusVal = cells[statusCol.id];
        if (typeof statusVal === 'string' && statusVal) {
          const option = statusCol.options?.find(
            (o) => o.label.toLowerCase() === statusVal.toLowerCase(),
          );
          status = {
            label: statusVal,
            color: option?.color ?? 'gray',
          };
        }
      }

      // Due date: first date column named /due|end/i, fallback to last date column
      const dateCols = sheetInfo.sheet.columns.filter((c) => c.type === 'date');
      const dueCol = dateCols.find((c) => /due|end/i.test(c.name)) ?? dateCols[dateCols.length - 1];
      if (dueCol) {
        const raw = cells[dueCol.id];
        if (raw != null && raw !== '') {
          const parsed = new Date(raw as string);
          if (!isNaN(parsed.getTime())) {
            dueDate = parsed.toISOString();
          }
        }
      }

      // Row key for plain sheets (if systemField exists)
      const keyCol = sheetInfo.sheet.columns.find((c) => c.systemField === 'key');
      if (keyCol) {
        key = (cells[keyCol.id] as string | undefined) ?? undefined;
      }
    }

    enrichedItems.push({
      rowId: (row._id as mongoose.Types.ObjectId).toString(),
      taskName,
      rowKey: key,
      key,
      sheetId: sheetInfo.sheet._id.toString(),
      sheetName: sheetInfo.sheet.name,
      workspaceName: sheetInfo.workspaceName,
      status,
      statusColor,
      dueDate,
    });
  }

  // 7. Group into buckets
  return groupMyWorkItems(enrichedItems, new Date());
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Checks whether a contact cell value contains the given userId.
 * Contact cells may be stored as a string ID, an array of IDs, or objects with id fields.
 */
function isContactCellContainingUser(cellValue: unknown, userId: string): boolean {
  if (cellValue == null) return false;

  const uid = String(userId);

  if (typeof cellValue === 'string') {
    return cellValue === uid;
  }

  if (Array.isArray(cellValue)) {
    return cellValue.some((v) => {
      if (typeof v === 'string') return v === uid;
      if (v && typeof v === 'object' && 'id' in v) return String((v as { id: unknown }).id) === uid;
      return false;
    });
  }

  if (typeof cellValue === 'object' && cellValue !== null && 'id' in cellValue) {
    return String((cellValue as { id: unknown }).id) === uid;
  }

  return false;
}

function emptyResponse(): MyWorkResponse {
  return {
    overdue: { items: [], total: 0 },
    dueToday: { items: [], total: 0 },
    dueThisWeek: { items: [], total: 0 },
    later: { items: [], total: 0 },
    noDueDate: { items: [], total: 0 },
  };
}
