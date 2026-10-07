import mongoose from 'mongoose';
import Sheet, { type ISheet, type ColumnDef } from '../models/Sheet';
import UserSheetMeta from '../models/UserSheetMeta';
import Workspace from '../models/Workspace';
import { getMemberRole } from './workspaceService';
import { getOrgPolicy, enforceWorkspaceCreationPolicy } from './orgPolicyService';
import { PROJECT_TEMPLATES, buildTemplateColumns, getTemplate } from './projectTemplates';
import type { TemplateKey } from './projectTemplates';
import { AppError } from '../utils/AppError';

const CREATED_BY_POPULATE = '_id fullName email';

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

export async function createProject(
  workspaceId: string,
  userId: string,
  input: { name: string; keyPrefix: string; template: string },
) {
  // Validate workspace ID
  if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
    throw new AppError('Invalid workspace ID', 400);
  }

  // Look up the workspace and verify membership + role
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new AppError('Workspace not found', 404);

  const role = getMemberRole(workspace, userId);
  if (!role) throw new AppError('Workspace not found', 404);
  if (role !== 'editor' && role !== 'admin' && role !== 'owner') {
    throw new AppError('Only editors and above can create projects', 403);
  }

  // Enforce org-level workspace creation policy
  const policy = await getOrgPolicy();
  enforceWorkspaceCreationPolicy({ role }, policy);

  // Duplicate key prefix check (case-insensitive since validation enforces uppercase)
  const existingSheet = await Sheet.findOne({
    workspaceId: new mongoose.Types.ObjectId(workspaceId),
    'project.keyPrefix': input.keyPrefix.toUpperCase(),
  });
  if (existingSheet) {
    throw new AppError('This key prefix is already used in this workspace', 409);
  }

  // Resolve the template definition
  const templateKey = input.template as TemplateKey;
  const templateDef = getTemplate(templateKey);

  // Build system columns from the template
  const resolvedTemplateCols = buildTemplateColumns(templateDef);

  // Build all columns: Name (primary) first, then template columns
  const allColumns: ColumnDef[] = [];

  // Primary Name column at order 0
  allColumns.push({
    id: new mongoose.Types.ObjectId().toString(),
    name: 'Name',
    type: 'text',
    order: 0,
    isPrimary: true,
  });

  // System columns from template, starting at order 1
  for (let i = 0; i < resolvedTemplateCols.length; i++) {
    const tplCol = resolvedTemplateCols[i];
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

  // Create the Sheet document
  const sheet = await Sheet.create({
    workspaceId: new mongoose.Types.ObjectId(workspaceId),
    name: input.name,
    createdBy: new mongoose.Types.ObjectId(userId),
    kind: 'project',
    project: {
      keyPrefix: input.keyPrefix.toUpperCase(),
      template: templateKey,
      statuses: templateDef.statuses,
      itemTypes: templateDef.itemTypes,
      nextKeyNumber: 1,
    },
    columns: allColumns,
    members: [],
  });

  // Record recents — upsert UserSheetMeta for the creator
  await UserSheetMeta.findOneAndUpdate(
    { userId: new mongoose.Types.ObjectId(userId), sheetId: sheet._id },
    {
      $set: { lastOpenedAt: new Date(), workspaceId: sheet.workspaceId },
    },
    { upsert: true, new: true },
  );

  // Populate and return
  const populated = await Sheet.findById(sheet._id).populate('createdBy', CREATED_BY_POPULATE);
  if (!populated) throw new AppError('Failed to create project', 500);
  return formatSheet(populated);
}
