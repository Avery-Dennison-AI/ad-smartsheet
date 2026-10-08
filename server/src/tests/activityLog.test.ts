import { describe, it, expect, vi } from 'vitest';
import mongoose from 'mongoose';
import ActivityLog from '../models/ActivityLog';
import { createUser, createWorkspace, createSheet, createRow } from './helpers/factories';
import * as rowService from '../services/rowService';
import * as columnService from '../services/columnService';
import * as sheetService from '../services/sheetService';
import * as sheetSharingService from '../services/sheetSharingService';
import * as activityService from '../services/activityService';
import type { ColumnDef } from '../models/Sheet';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Wait for fire-and-forget activity recording to complete. */
async function waitForActivity(ms = 200): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/** Create a standard test environment with user, workspace, and sheet. */
async function createTestEnv() {
  const user = await createUser();
  const workspace = await createWorkspace({
    owner: user._id,
    members: [{ user: user._id, role: 'admin' }],
  });
  const textColId = new mongoose.Types.ObjectId().toString();
  const primaryCol: ColumnDef = {
    id: textColId,
    name: 'Name',
    type: 'text',
    order: 0,
    isPrimary: true,
  };
  const sheet = await createSheet({
    workspaceId: workspace._id,
    createdBy: user._id,
    columns: [primaryCol],
  });
  return { user, workspace, sheet, primaryColId: textColId };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Activity Log', () => {
  // 1. cell.updated recorded
  it('records cell.updated when updateCell changes a value', async () => {
    const { user, sheet, primaryColId } = await createTestEnv();
    const row = await createRow(sheet._id.toString(), {
      cells: { [primaryColId]: 'Original' },
      order: 0,
    });

    await rowService.updateCell(
      sheet._id.toString(),
      user._id.toString(),
      row._id.toString(),
      primaryColId,
      'Updated',
    );
    await waitForActivity();

    const logs = await ActivityLog.find({ action: 'cell.updated' });
    expect(logs.length).toBe(1);
    expect(logs[0].details).toMatchObject({
      columnId: primaryColId,
      columnName: 'Name',
      oldValue: 'Original',
      newValue: 'Updated',
    });
  });

  // 2. cell.updated skipped when value unchanged
  it('does not record cell.updated when value is unchanged', async () => {
    const { user, sheet, primaryColId } = await createTestEnv();
    const row = await createRow(sheet._id.toString(), {
      cells: { [primaryColId]: 'Same Value' },
      order: 0,
    });

    await rowService.updateCell(
      sheet._id.toString(),
      user._id.toString(),
      row._id.toString(),
      primaryColId,
      'Same Value',
    );
    await waitForActivity();

    const logs = await ActivityLog.find({ action: 'cell.updated' });
    expect(logs.length).toBe(0);
  });

  // 3. row.created recorded
  it('records row.created when addRow is called', async () => {
    const { user, sheet, primaryColId } = await createTestEnv();

    await rowService.addRow(sheet._id.toString(), user._id.toString(), {
      cells: { [primaryColId]: 'New Task' },
    });
    await waitForActivity();

    const logs = await ActivityLog.find({ action: 'row.created' });
    expect(logs.length).toBe(1);
    expect(logs[0].details).toMatchObject({ name: 'New Task' });
  });

  // 4. row.deleted recorded
  it('records row.deleted for each deleted row', async () => {
    const { user, sheet, primaryColId } = await createTestEnv();
    const row1 = await createRow(sheet._id.toString(), {
      cells: { [primaryColId]: 'Row A' },
      order: 0,
    });
    const row2 = await createRow(sheet._id.toString(), {
      cells: { [primaryColId]: 'Row B' },
      order: 1,
    });

    await rowService.deleteRows(
      sheet._id.toString(),
      user._id.toString(),
      [row1._id.toString(), row2._id.toString()],
    );
    await waitForActivity();

    const logs = await ActivityLog.find({ action: 'row.deleted' }).sort({ createdAt: 1 });
    expect(logs.length).toBe(2);
    const names = logs.map((l) => (l.details as any)?.name).sort();
    expect(names).toEqual(['Row A', 'Row B']);
  });

  // 5. row.indented recorded
  it('records row.indented when indentRows is called', async () => {
    const { user, sheet } = await createTestEnv();
    const parent = await createRow(sheet._id.toString(), { order: 0 });
    const child = await createRow(sheet._id.toString(), { order: 1 });

    await rowService.indentRows(
      sheet._id.toString(),
      user._id.toString(),
      [child._id.toString()],
    );
    await waitForActivity();

    const logs = await ActivityLog.find({ action: 'row.indented' });
    expect(logs.length).toBe(1);
    expect(logs[0].details).toMatchObject({
      rowIds: [child._id.toString()],
    });
  });

  // 6. row.outdented recorded
  it('records row.outdented when outdentRows is called', async () => {
    const { user, sheet } = await createTestEnv();
    const parent = await createRow(sheet._id.toString(), { order: 0 });
    const child = await createRow(sheet._id.toString(), {
      order: 1,
      parentId: parent._id,
      depth: 1,
    });

    await rowService.outdentRows(
      sheet._id.toString(),
      user._id.toString(),
      [child._id.toString()],
    );
    await waitForActivity();

    const logs = await ActivityLog.find({ action: 'row.outdented' });
    expect(logs.length).toBe(1);
    expect(logs[0].details).toMatchObject({
      rowIds: [child._id.toString()],
    });
  });

  // 7. column.renamed recorded
  it('records column.renamed when updateColumn changes the name', async () => {
    const { user, sheet, primaryColId } = await createTestEnv();

    // Add a non-primary column to rename
    const cols = await columnService.addColumn(
      sheet._id.toString(),
      user._id.toString(),
      { name: 'Old Name', type: 'text' },
    );
    const newCol = cols.find((c) => c.name === 'Old Name')!;

    await columnService.updateColumn(
      sheet._id.toString(),
      user._id.toString(),
      newCol.id,
      { name: 'New Name' },
    );
    await waitForActivity();

    const logs = await ActivityLog.find({ action: 'column.renamed' });
    expect(logs.length).toBe(1);
    expect(logs[0].details).toMatchObject({
      columnId: newCol.id,
      oldName: 'Old Name',
      newName: 'New Name',
    });
  });

  // 8. formatting change not recorded
  it('does not record activity for column width changes', async () => {
    const { user, sheet, primaryColId } = await createTestEnv();

    // Clear any prior activity from setup
    await ActivityLog.deleteMany({});

    await columnService.updateColumnWidth(
      sheet._id.toString(),
      user._id.toString(),
      primaryColId,
      200,
    );
    await waitForActivity();

    const logs = await ActivityLog.find({});
    expect(logs.length).toBe(0);
  });

  // 9. sheet.renamed recorded
  it('records sheet.renamed when renameSheet is called', async () => {
    const { user, sheet } = await createTestEnv();

    await sheetService.renameSheet(
      sheet._id.toString(),
      'Renamed Sheet',
      user._id.toString(),
    );
    await waitForActivity();

    const logs = await ActivityLog.find({ action: 'sheet.renamed' });
    expect(logs.length).toBe(1);
    expect(logs[0].details).toMatchObject({
      oldName: sheet.name,
      newName: 'Renamed Sheet',
    });
  });

  // 10. sharing.changed recorded
  it('records sharing.changed when addOrUpdateSheetMember adds a member', async () => {
    const { user, sheet } = await createTestEnv();
    const targetUser = await createUser();

    await sheetSharingService.addOrUpdateSheetMember(
      sheet._id.toString(),
      user._id.toString(),
      { userId: targetUser._id.toString(), role: 'viewer' },
    );
    await waitForActivity();

    const logs = await ActivityLog.find({ action: 'sharing.changed' });
    expect(logs.length).toBe(1);
    expect(logs[0].details).toMatchObject({
      targetUserId: targetUser._id.toString(),
      change: 'added',
      newRole: 'viewer',
    });
  });

  // 11. viewer can read activity
  it('allows a viewer to read sheet activity', async () => {
    const { user, sheet } = await createTestEnv();
    const viewer = await createUser();

    // Add viewer to workspace
    const Workspace = (await import('../models/Workspace')).default;
    await Workspace.findByIdAndUpdate(sheet.workspaceId, {
      $push: { members: { user: viewer._id, role: 'viewer' } },
    });

    // Create some activity
    await sheetService.renameSheet(
      sheet._id.toString(),
      'New Name',
      user._id.toString(),
    );
    await waitForActivity();

    // Viewer should be able to read activity
    const result = await activityService.getSheetActivity(
      sheet._id.toString(),
      viewer._id.toString(),
    );
    expect(result.entries.length).toBeGreaterThan(0);
  });

  // 12. non-member gets 403
  it('throws 403 when non-member tries to read activity', async () => {
    const { user, sheet } = await createTestEnv();
    const outsider = await createUser();

    // Create some activity
    await sheetService.renameSheet(
      sheet._id.toString(),
      'New Name',
      user._id.toString(),
    );
    await waitForActivity();

    // Outsider should get an error
    await expect(
      activityService.getSheetActivity(sheet._id.toString(), outsider._id.toString()),
    ).rejects.toThrow();
  });

  // 13. cursor paging works
  it('supports cursor-based pagination', async () => {
    const { user, sheet } = await createTestEnv();

    // Insert 60 activity log documents directly
    const docs = [];
    for (let i = 0; i < 60; i++) {
      docs.push({
        sheetId: sheet._id,
        actorId: user._id,
        action: 'cell.updated',
        details: { index: i },
        createdAt: new Date(Date.now() - (60 - i) * 1000), // spread over time
      });
    }
    await ActivityLog.insertMany(docs);

    // First page — no cursor
    const page1 = await activityService.getSheetActivity(
      sheet._id.toString(),
      user._id.toString(),
    );
    expect(page1.entries.length).toBe(50);
    expect(page1.nextCursor).not.toBeNull();

    // Second page — with cursor
    const page2 = await activityService.getSheetActivity(
      sheet._id.toString(),
      user._id.toString(),
      { before: page1.nextCursor! },
    );
    expect(page2.entries.length).toBe(10);
    expect(page2.nextCursor).toBeNull();
  });

  // 14. recording failure doesn't break the operation
  it('updateCell still succeeds even if activity recording fails', async () => {
    const { user, sheet, primaryColId } = await createTestEnv();
    const row = await createRow(sheet._id.toString(), {
      cells: { [primaryColId]: 'Before' },
      order: 0,
    });

    // Spy on ActivityLog.create to make it throw
    const createSpy = vi.spyOn(ActivityLog, 'create').mockRejectedValueOnce(
      new Error('Simulated DB failure'),
    );

    // updateCell should still succeed
    const result = await rowService.updateCell(
      sheet._id.toString(),
      user._id.toString(),
      row._id.toString(),
      primaryColId,
      'After',
    );
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThanOrEqual(1);

    // Verify the cell was actually updated
    const Row = (await import('../models/Row')).default;
    const updatedRow = await Row.findById(row._id);
    const cells = updatedRow!.cells instanceof Map
      ? Object.fromEntries(updatedRow!.cells)
      : (updatedRow!.toObject().cells as unknown as Record<string, unknown>);
    expect(cells[primaryColId]).toBe('After');

    createSpy.mockRestore();
  });
});
