import { describe, it, expect } from 'vitest';
import { createUser, createWorkspace, createProject, createRow } from './helpers/factories';
import { calculateDuration, calculateDueDate, parseDateUTC, formatDateUTC } from '../services/rowService';
import { duplicateSheet } from '../services/sheetService';
import Sheet from '../models/Sheet';
import Row from '../models/Row';

// ─── Tests: Date format helpers (pure functions — no DB) ──────────────────────

describe('date format helpers', () => {
  it('calculateDueDate produces YYYY-MM-DD from start + duration', () => {
    const result = calculateDueDate('2026-01-15', 5);
    expect(result).toBe('2026-01-19');
  });

  it('calculateDuration produces correct inclusive days from start and due', () => {
    const result = calculateDuration('2026-01-15', '2026-01-19');
    expect(result).toBe(5);
  });

  it('parseDateUTC handles plain YYYY-MM-DD strings', () => {
    const ms = parseDateUTC('2026-01-15');
    expect(isNaN(ms)).toBe(false);
    // Verify roundtrip
    expect(formatDateUTC(ms)).toBe('2026-01-15');
  });

  it('parseDateUTC handles ISO timestamp strings by extracting date part', () => {
    const ms = parseDateUTC('2026-01-15T00:00:00.000Z');
    expect(isNaN(ms)).toBe(false);
    expect(formatDateUTC(ms)).toBe('2026-01-15');
  });

  it('formatDateUTC always returns YYYY-MM-DD without time component', () => {
    const ms = Date.UTC(2026, 0, 15); // Jan 15, 2026 UTC
    expect(formatDateUTC(ms)).toBe('2026-01-15');
  });

  it('calculateDuration returns null for invalid input', () => {
    expect(calculateDuration('', '2026-01-15')).toBeNull();
    expect(calculateDuration('invalid', '2026-01-15')).toBeNull();
  });

  it('calculateDueDate returns null for invalid input', () => {
    expect(calculateDueDate('', 5)).toBeNull();
    expect(calculateDueDate('invalid', 5)).toBeNull();
  });
});

// ─── Tests: Project duplication (real DB) ─────────────────────────────────────

describe('project duplication', () => {
  it('produces new keys in order when duplicating a project with rows', async () => {
    const user = await createUser();
    const workspace = await createWorkspace({
      owner: user._id,
      members: [{ user: user._id, role: 'editor' }],
    });

    // Create a scrum project with nextKeyNumber=4 (keys HR-1..HR-3 already used)
    const sourceSheet = await createProject({
      workspaceId: workspace._id,
      createdBy: user._id,
      keyPrefix: 'HR',
      template: 'scrum',
      members: [{ userId: user._id, role: 'admin' }],
      nextKeyNumber: 4,
    });

    // Find the key column ID
    const keyCol = sourceSheet.columns.find((c) => c.systemField === 'key')!;

    // Create 3 source rows with existing keys
    await createRow(sourceSheet._id, { order: 0, cells: { [keyCol.id]: 'HR-1' } });
    await createRow(sourceSheet._id, { order: 1, cells: { [keyCol.id]: 'HR-2' } });
    await createRow(sourceSheet._id, { order: 2, cells: { [keyCol.id]: 'HR-3' } });

    // Duplicate the sheet
    const result = await duplicateSheet(sourceSheet._id.toString(), user._id.toString());

    // Query the duplicated sheet from DB
    const duplicatedSheet = await Sheet.findById(result.id);
    expect(duplicatedSheet).toBeDefined();
    expect(duplicatedSheet!.kind).toBe('project');
    expect(duplicatedSheet!.project!.keyPrefix).toBe('HR2');
    expect(duplicatedSheet!.project!.nextKeyNumber).toBe(4); // 1 + 3 rows

    // Query copied rows
    const copiedRows = await Row.find({ sheetId: duplicatedSheet!._id }).sort({ order: 1 });
    expect(copiedRows.length).toBe(3);

    // Extract key values from copied rows
    const keys = copiedRows.map((r) => {
      const cells = (r.toObject().cells as unknown as Record<string, unknown>) ?? {};
      return cells[keyCol.id];
    });
    expect(keys).toEqual(['HR2-1', 'HR2-2', 'HR2-3']);
  });

  it('generates unique key prefix when HR2 is taken', async () => {
    const user = await createUser();
    const workspace = await createWorkspace({
      owner: user._id,
      members: [{ user: user._id, role: 'editor' }],
    });

    // Create source project with prefix HR
    const sourceSheet = await createProject({
      workspaceId: workspace._id,
      createdBy: user._id,
      keyPrefix: 'HR',
      template: 'scrum',
      members: [{ userId: user._id, role: 'admin' }],
    });

    // Create another project that takes the HR2 prefix
    await createProject({
      workspaceId: workspace._id,
      createdBy: user._id,
      keyPrefix: 'HR2',
      template: 'scrum',
      members: [{ userId: user._id, role: 'admin' }],
    });

    // Duplicate the source — should skip HR2 and use HR3
    const result = await duplicateSheet(sourceSheet._id.toString(), user._id.toString());

    const duplicatedSheet = await Sheet.findById(result.id);
    expect(duplicatedSheet).toBeDefined();
    expect(duplicatedSheet!.project!.keyPrefix).toBe('HR3');
  });

  it('preserves systemField on all duplicate columns', async () => {
    const user = await createUser();
    const workspace = await createWorkspace({
      owner: user._id,
      members: [{ user: user._id, role: 'editor' }],
    });

    const sourceSheet = await createProject({
      workspaceId: workspace._id,
      createdBy: user._id,
      keyPrefix: 'HR',
      template: 'scrum',
      members: [{ userId: user._id, role: 'admin' }],
    });

    const result = await duplicateSheet(sourceSheet._id.toString(), user._id.toString());

    const duplicatedSheet = await Sheet.findById(result.id);
    expect(duplicatedSheet).toBeDefined();

    const keyCol = duplicatedSheet!.columns.find((c) => c.systemField === 'key');
    const statusCol = duplicatedSheet!.columns.find((c) => c.systemField === 'status');

    expect(keyCol).toBeDefined();
    expect(keyCol!.systemField).toBe('key');
    expect(statusCol).toBeDefined();
    expect(statusCol!.systemField).toBe('status');
  });
});

// ─── Tests: kind and keyPrefix in list responses ──────────────────────────────

describe('kind and keyPrefix in list responses', () => {
  it('listSheets includes kind and keyPrefix for project sheets', async () => {
    const user = await createUser();
    const workspace = await createWorkspace({
      owner: user._id,
      members: [{ user: user._id, role: 'editor' }],
    });

    // Create a project
    await createProject({
      workspaceId: workspace._id,
      createdBy: user._id,
      keyPrefix: 'HR',
      template: 'scrum',
      name: 'My Project',
      members: [{ userId: user._id, role: 'admin' }],
    });

    // Import listSheets here to avoid circular deps
    const { listSheets } = await import('../services/sheetService');
    const results = await listSheets(workspace._id.toString(), user._id.toString());

    expect(results.length).toBeGreaterThanOrEqual(1);
    const projectResult = results.find((s: any) => s.kind === 'project');
    expect(projectResult).toBeDefined();
    expect(projectResult!.kind).toBe('project');
    expect(projectResult!.project.keyPrefix).toBe('HR');
  });

  it('listSheets returns kind=sheet and no keyPrefix for regular sheets', async () => {
    const user = await createUser();
    const workspace = await createWorkspace({
      owner: user._id,
      members: [{ user: user._id, role: 'editor' }],
    });

    // Create a plain sheet
    const { createSheet: createPlainSheet } = await import('./helpers/factories');
    await createPlainSheet({
      workspaceId: workspace._id,
      createdBy: user._id,
      name: 'Regular Sheet',
      kind: 'sheet',
    });

    const { listSheets } = await import('../services/sheetService');
    const results = await listSheets(workspace._id.toString(), user._id.toString());

    expect(results.length).toBeGreaterThanOrEqual(1);
    const sheetResult = results.find((s: any) => s.kind === 'sheet');
    expect(sheetResult).toBeDefined();
    expect(sheetResult!.kind).toBe('sheet');
    expect(sheetResult!.project).toBeUndefined();
  });
});
