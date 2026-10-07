import { describe, it, expect } from 'vitest';
import { createUser, createWorkspace, createProject, createRow } from './helpers/factories';
import { updateCell } from '../services/rowService';
import { deleteColumn, updateColumn } from '../services/columnService';
import Sheet from '../models/Sheet';

// ─── Tests: System field column protection ─────────────────────────────────────

describe('projectFields — system field column protection', () => {
  describe('deleteColumn', () => {
    it('returns 400 when deleting a system field column', async () => {
      const user = await createUser();
      const workspace = await createWorkspace({
        owner: user._id,
        members: [{ user: user._id, role: 'admin' }],
      });
      const sheet = await createProject({
        workspaceId: workspace._id,
        createdBy: user._id,
        keyPrefix: 'HR',
        template: 'scrum',
        members: [{ userId: user._id, role: 'admin' }],
      });

      const statusCol = sheet.columns.find((c) => c.systemField === 'status')!;

      await expect(
        deleteColumn(sheet._id.toString(), user._id.toString(), statusCol.id),
      ).rejects.toThrow('This is a project field');

      try {
        await deleteColumn(sheet._id.toString(), user._id.toString(), statusCol.id);
      } catch (err: any) {
        expect(err.statusCode).toBe(400);
      }
    });

    it('allows deleting a non-system column', async () => {
      const user = await createUser();
      const workspace = await createWorkspace({
        owner: user._id,
        members: [{ user: user._id, role: 'admin' }],
      });
      const sheet = await createProject({
        workspaceId: workspace._id,
        createdBy: user._id,
        keyPrefix: 'HR',
        template: 'scrum',
        members: [{ userId: user._id, role: 'admin' }],
      });

      // Add a regular column first
      const { addColumn } = await import('../services/columnService');
      const updatedCols = await addColumn(sheet._id.toString(), user._id.toString(), { name: 'Notes', type: 'text' });
      const notesCol = updatedCols.find((c) => c.name === 'Notes')!;

      const result = await deleteColumn(sheet._id.toString(), user._id.toString(), notesCol.id);
      expect(result).toEqual({ deleted: true, columnId: notesCol.id });
    });
  });

  describe('updateColumn', () => {
    it('returns 400 when changing the type of a system field column', async () => {
      const user = await createUser();
      const workspace = await createWorkspace({
        owner: user._id,
        members: [{ user: user._id, role: 'admin' }],
      });
      const sheet = await createProject({
        workspaceId: workspace._id,
        createdBy: user._id,
        keyPrefix: 'HR',
        template: 'scrum',
        members: [{ userId: user._id, role: 'admin' }],
      });

      const statusCol = sheet.columns.find((c) => c.systemField === 'status')!;

      await expect(
        updateColumn(sheet._id.toString(), user._id.toString(), statusCol.id, { type: 'text' }),
      ).rejects.toThrow('This is a project field');

      try {
        await updateColumn(sheet._id.toString(), user._id.toString(), statusCol.id, { type: 'text' });
      } catch (err: any) {
        expect(err.statusCode).toBe(400);
      }
    });

    it('allows renaming a system field column', async () => {
      const user = await createUser();
      const workspace = await createWorkspace({
        owner: user._id,
        members: [{ user: user._id, role: 'admin' }],
      });
      const sheet = await createProject({
        workspaceId: workspace._id,
        createdBy: user._id,
        keyPrefix: 'HR',
        template: 'scrum',
        members: [{ userId: user._id, role: 'admin' }],
      });

      const statusCol = sheet.columns.find((c) => c.systemField === 'status')!;

      const result = await updateColumn(sheet._id.toString(), user._id.toString(), statusCol.id, { name: 'Custom Status' });
      expect(result).toBeDefined();
      expect(result.name).toBe('Custom Status');
      expect(result.systemField).toBe('status');
    });
  });
});

// ─── Tests: Status and Type validation ─────────────────────────────────────────

describe('projectFields — status and type validation', () => {
  it('returns 400 when setting Status to an invalid value', async () => {
    const user = await createUser();
    const workspace = await createWorkspace({
      owner: user._id,
      members: [{ user: user._id, role: 'editor' }],
    });
    const sheet = await createProject({
      workspaceId: workspace._id,
      createdBy: user._id,
      keyPrefix: 'HR',
      template: 'scrum',
      members: [{ userId: user._id, role: 'admin' }],
    });
    const row = await createRow(sheet._id);

    const statusCol = sheet.columns.find((c) => c.systemField === 'status')!;

    await expect(
      updateCell(sheet._id.toString(), user._id.toString(), row._id.toString(), statusCol.id, 'InvalidStatus'),
    ).rejects.toThrow('Invalid status value for this project');

    try {
      await updateCell(sheet._id.toString(), user._id.toString(), row._id.toString(), statusCol.id, 'InvalidStatus');
    } catch (err: any) {
      expect(err.statusCode).toBe(400);
    }
  });

  it('succeeds when setting Status to a valid value', async () => {
    const user = await createUser();
    const workspace = await createWorkspace({
      owner: user._id,
      members: [{ user: user._id, role: 'editor' }],
    });
    const sheet = await createProject({
      workspaceId: workspace._id,
      createdBy: user._id,
      keyPrefix: 'HR',
      template: 'scrum',
      members: [{ userId: user._id, role: 'admin' }],
    });
    const row = await createRow(sheet._id);

    const statusCol = sheet.columns.find((c) => c.systemField === 'status')!;

    const result = await updateCell(sheet._id.toString(), user._id.toString(), row._id.toString(), statusCol.id, 'Backlog');
    expect(result).toBeDefined();
    const directUpdate = result.find((u: any) => u.columnId === statusCol.id);
    expect(directUpdate).toBeDefined();
    expect(directUpdate!.value).toBe('Backlog');
  });

  it('returns 400 when setting Type to an invalid value', async () => {
    const user = await createUser();
    const workspace = await createWorkspace({
      owner: user._id,
      members: [{ user: user._id, role: 'editor' }],
    });
    const sheet = await createProject({
      workspaceId: workspace._id,
      createdBy: user._id,
      keyPrefix: 'HR',
      template: 'scrum',
      members: [{ userId: user._id, role: 'admin' }],
    });
    const row = await createRow(sheet._id);

    const typeCol = sheet.columns.find((c) => c.systemField === 'type')!;

    await expect(
      updateCell(sheet._id.toString(), user._id.toString(), row._id.toString(), typeCol.id, 'Epic-invalid'),
    ).rejects.toThrow('Invalid type value for this project');

    try {
      await updateCell(sheet._id.toString(), user._id.toString(), row._id.toString(), typeCol.id, 'Epic-invalid');
    } catch (err: any) {
      expect(err.statusCode).toBe(400);
    }
  });

  it('succeeds when setting Type to empty value', async () => {
    const user = await createUser();
    const workspace = await createWorkspace({
      owner: user._id,
      members: [{ user: user._id, role: 'editor' }],
    });
    const sheet = await createProject({
      workspaceId: workspace._id,
      createdBy: user._id,
      keyPrefix: 'HR',
      template: 'scrum',
      members: [{ userId: user._id, role: 'admin' }],
    });
    const row = await createRow(sheet._id);

    const typeCol = sheet.columns.find((c) => c.systemField === 'type')!;

    const result = await updateCell(sheet._id.toString(), user._id.toString(), row._id.toString(), typeCol.id, '');
    expect(result).toBeDefined();
    const directUpdate = result.find((u: any) => u.columnId === typeCol.id);
    expect(directUpdate).toBeDefined();
    expect(directUpdate!.value).toBeNull();
  });
});

// ─── Tests: Duration calculation ───────────────────────────────────────────────

describe('projectFields — duration calculation', () => {
  it('calculates Duration when Start is changed and Due is set', async () => {
    const user = await createUser();
    const workspace = await createWorkspace({
      owner: user._id,
      members: [{ user: user._id, role: 'editor' }],
    });
    const sheet = await createProject({
      workspaceId: workspace._id,
      createdBy: user._id,
      keyPrefix: 'WF',
      template: 'waterfall',
      members: [{ userId: user._id, role: 'admin' }],
    });

    const startCol = sheet.columns.find((c) => c.systemField === 'start')!;
    const dueCol = sheet.columns.find((c) => c.systemField === 'due')!;
    const durationCol = sheet.columns.find((c) => c.systemField === 'duration')!;

    const startDate = '2025-01-01';
    const dueDate = '2025-01-05';

    // Create a row with Due already set
    const row = await createRow(sheet._id, { cells: { [dueCol.id]: dueDate } });

    // Update Start → should compute Duration
    const result = await updateCell(sheet._id.toString(), user._id.toString(), row._id.toString(), startCol.id, startDate);

    const durationUpdate = result.find((u: any) => u.columnId === durationCol.id);
    expect(durationUpdate).toBeDefined();
    // Jan 1 to Jan 5 = 5 days inclusive
    expect(durationUpdate!.value).toBe(5);
  });

  it('calculates Duration when Due is changed and Start is set', async () => {
    const user = await createUser();
    const workspace = await createWorkspace({
      owner: user._id,
      members: [{ user: user._id, role: 'editor' }],
    });
    const sheet = await createProject({
      workspaceId: workspace._id,
      createdBy: user._id,
      keyPrefix: 'WF',
      template: 'waterfall',
      members: [{ userId: user._id, role: 'admin' }],
    });

    const startCol = sheet.columns.find((c) => c.systemField === 'start')!;
    const dueCol = sheet.columns.find((c) => c.systemField === 'due')!;
    const durationCol = sheet.columns.find((c) => c.systemField === 'duration')!;

    const startDate = '2025-01-01';
    const dueDate = '2025-01-10';

    // Create a row with Start already set
    const row = await createRow(sheet._id, { cells: { [startCol.id]: startDate } });

    const result = await updateCell(sheet._id.toString(), user._id.toString(), row._id.toString(), dueCol.id, dueDate);

    const durationUpdate = result.find((u: any) => u.columnId === durationCol.id);
    expect(durationUpdate).toBeDefined();
    // Jan 1 to Jan 10 = 10 days inclusive
    expect(durationUpdate!.value).toBe(10);
  });

  it('calculates Due when Duration is changed and Start is set', async () => {
    const user = await createUser();
    const workspace = await createWorkspace({
      owner: user._id,
      members: [{ user: user._id, role: 'editor' }],
    });
    const sheet = await createProject({
      workspaceId: workspace._id,
      createdBy: user._id,
      keyPrefix: 'WF',
      template: 'waterfall',
      members: [{ userId: user._id, role: 'admin' }],
    });

    const startCol = sheet.columns.find((c) => c.systemField === 'start')!;
    const dueCol = sheet.columns.find((c) => c.systemField === 'due')!;
    const durationCol = sheet.columns.find((c) => c.systemField === 'duration')!;

    const startDate = '2025-01-01';
    const duration = 7;

    // Create a row with Start already set
    const row = await createRow(sheet._id, { cells: { [startCol.id]: startDate } });

    const result = await updateCell(sheet._id.toString(), user._id.toString(), row._id.toString(), durationCol.id, duration);

    const dueUpdate = result.find((u: any) => u.columnId === dueCol.id);
    expect(dueUpdate).toBeDefined();
    // Start Jan 1 + 7 days - 1 = Jan 7 → "2025-01-07"
    expect(dueUpdate!.value).toBe('2025-01-07');
  });
});
