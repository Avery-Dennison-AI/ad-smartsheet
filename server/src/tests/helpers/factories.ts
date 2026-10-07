import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User, { type IUser } from '../../models/User';
import Workspace, { type IWorkspace } from '../../models/Workspace';
import Sheet, { type ISheet, type ColumnDef } from '../../models/Sheet';
import Row, { type IRow } from '../../models/Row';
import { buildTemplateColumns, getTemplate, type TemplateKey } from '../../services/projectTemplates';

// ─── createUser ────────────────────────────────────────────────────────────────

interface CreateUserOverrides {
  fullName?: string;
  email?: string;
  role?: 'admin' | 'member' | 'guest';
  isActive?: boolean;
  passwordHash?: string;
}

let userCounter = 0;

export async function createUser(overrides: CreateUserOverrides = {}): Promise<IUser> {
  userCounter++;
  const hash = overrides.passwordHash ?? await bcrypt.hash('Test@1234', 4);
  return User.create({
    fullName: overrides.fullName ?? `User ${userCounter}`,
    email: overrides.email ?? `user${userCounter}@test.com`,
    role: overrides.role ?? 'member',
    isActive: overrides.isActive ?? true,
    passwordHash: hash,
  });
}

// ─── createWorkspace ───────────────────────────────────────────────────────────

interface CreateWorkspaceOverrides {
  name?: string;
  color?: string;
  members?: Array<{ user: mongoose.Types.ObjectId; role: string }>;
  owner?: mongoose.Types.ObjectId;
}

let wsCounter = 0;

export async function createWorkspace(overrides: CreateWorkspaceOverrides = {}): Promise<IWorkspace> {
  wsCounter++;
  const ownerId = overrides.owner ?? new mongoose.Types.ObjectId();
  const members = overrides.members ?? [{ user: ownerId, role: 'admin' as const }];
  return Workspace.create({
    name: overrides.name ?? `Workspace ${wsCounter}`,
    color: overrides.color ?? 'teal',
    owner: ownerId,
    members,
  });
}

// ─── createSheet ───────────────────────────────────────────────────────────────

interface CreateSheetOverrides {
  workspaceId?: mongoose.Types.ObjectId;
  name?: string;
  createdBy?: mongoose.Types.ObjectId;
  kind?: 'sheet' | 'project';
  columns?: ColumnDef[];
  members?: Array<{ userId: mongoose.Types.ObjectId; role: string }>;
  project?: Record<string, unknown>;
}

let sheetCounter = 0;

export async function createSheet(overrides: CreateSheetOverrides = {}): Promise<ISheet> {
  sheetCounter++;
  const defaultCol: ColumnDef = {
    id: new mongoose.Types.ObjectId().toString(),
    name: 'Name',
    type: 'text',
    order: 0,
    isPrimary: true,
  };
  return Sheet.create({
    workspaceId: overrides.workspaceId ?? new mongoose.Types.ObjectId(),
    name: overrides.name ?? `Sheet ${sheetCounter}`,
    createdBy: overrides.createdBy ?? new mongoose.Types.ObjectId(),
    kind: overrides.kind ?? 'sheet',
    columns: overrides.columns ?? [defaultCol],
    members: overrides.members ?? [],
    project: overrides.project,
  });
}

// ─── createProject ─────────────────────────────────────────────────────────────

interface CreateProjectOverrides {
  workspaceId?: mongoose.Types.ObjectId;
  name?: string;
  createdBy?: mongoose.Types.ObjectId;
  keyPrefix?: string;
  template?: TemplateKey;
  members?: Array<{ userId: mongoose.Types.ObjectId; role: string }>;
  nextKeyNumber?: number;
}

let projectCounter = 0;

export async function createProject(overrides: CreateProjectOverrides = {}): Promise<ISheet> {
  projectCounter++;
  const templateKey = overrides.template ?? 'waterfall';
  const templateDef = getTemplate(templateKey);
  const resolvedCols = buildTemplateColumns(templateDef);

  const allColumns: ColumnDef[] = [
    {
      id: new mongoose.Types.ObjectId().toString(),
      name: 'Name',
      type: 'text',
      order: 0,
      isPrimary: true,
    },
  ];

  for (let i = 0; i < resolvedCols.length; i++) {
    const tplCol = resolvedCols[i];
    allColumns.push({
      id: new mongoose.Types.ObjectId().toString(),
      name: tplCol.name,
      type: tplCol.type,
      order: i + 1,
      isPrimary: false,
      options: tplCol.options ? tplCol.options.map((o) => ({ label: o.label, color: o.color || 'gray' })) : undefined,
      systemField: tplCol.systemField,
    });
  }

  return Sheet.create({
    workspaceId: overrides.workspaceId ?? new mongoose.Types.ObjectId(),
    name: overrides.name ?? `Project ${projectCounter}`,
    createdBy: overrides.createdBy ?? new mongoose.Types.ObjectId(),
    kind: 'project',
    columns: allColumns,
    members: overrides.members ?? [],
    project: {
      keyPrefix: overrides.keyPrefix ?? 'PROJ',
      template: templateKey,
      statuses: templateDef.statuses,
      itemTypes: templateDef.itemTypes,
      nextKeyNumber: overrides.nextKeyNumber ?? 1,
    },
  });
}

// ─── createRow ─────────────────────────────────────────────────────────────────

interface CreateRowOverrides {
  cells?: Record<string, unknown>;
  order?: number;
  parentId?: mongoose.Types.ObjectId | null;
  depth?: number;
  assigneeIds?: mongoose.Types.ObjectId[];
}

let rowCounter = 0;

export async function createRow(sheetId: string | mongoose.Types.ObjectId, overrides: CreateRowOverrides = {}): Promise<IRow> {
  rowCounter++;
  return Row.create({
    sheetId: typeof sheetId === 'string' ? new mongoose.Types.ObjectId(sheetId) : sheetId,
    order: overrides.order ?? rowCounter,
    cells: overrides.cells ?? {},
    parentId: overrides.parentId ?? null,
    depth: overrides.depth ?? 0,
    assigneeIds: overrides.assigneeIds ?? [],
  });
}
