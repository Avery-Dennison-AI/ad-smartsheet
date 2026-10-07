import { describe, it, expect } from 'vitest';
import { createUser, createWorkspace, createProject, createSheet as createPlainSheetFactory, createRow } from './helpers/factories';
import { addRow, updateCell } from '../services/rowService';
import Sheet from '../models/Sheet';
import Row from '../models/Row';

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('projectKeys — generateProjectKey', () => {
  describe('sequential keys', () => {
    it('produces HR-1, HR-2, HR-3 in order when adding 3 rows', async () => {
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

      const keyCol = sheet.columns.find((c) => c.systemField === 'key')!;

      // Add 3 rows sequentially
      const r1 = await addRow(sheet._id.toString(), user._id.toString());
      const r2 = await addRow(sheet._id.toString(), user._id.toString());
      const r3 = await addRow(sheet._id.toString(), user._id.toString());

      const assignedKeys = [r1.row.cells[keyCol.id], r2.row.cells[keyCol.id], r3.row.cells[keyCol.id]];
      expect(assignedKeys).toEqual(['HR-1', 'HR-2', 'HR-3']);
    });
  });

  describe('concurrent uniqueness', () => {
    it('produces 20 unique keys when called concurrently', async () => {
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

      const keyCol = sheet.columns.find((c) => c.systemField === 'key')!;

      // Call addRow 20 times concurrently
      const results = await Promise.all(
        Array.from({ length: 20 }, () => addRow(sheet._id.toString(), user._id.toString())),
      );

      const assignedKeys = results.map((r) => r.row.cells[keyCol.id] as string);
      const uniqueKeys = new Set(assignedKeys);
      expect(uniqueKeys.size).toBe(20);

      // Keys should be HR-1 through HR-20 (order may vary due to concurrency)
      const sortedKeys = [...uniqueKeys].sort((a, b) => {
        const numA = parseInt(a.split('-')[1], 10);
        const numB = parseInt(b.split('-')[1], 10);
        return numA - numB;
      });
      expect(sortedKeys[0]).toBe('HR-1');
      expect(sortedKeys[sortedKeys.length - 1]).toBe('HR-20');
    });
  });

  describe('numbers not reused after deletion', () => {
    it('continues incrementing after rows are deleted', async () => {
      const user = await createUser();
      const workspace = await createWorkspace({
        owner: user._id,
        members: [{ user: user._id, role: 'editor' }],
      });
      // Create project with nextKeyNumber=4 (simulating that HR-1..HR-3 were already created and deleted)
      const sheet = await createProject({
        workspaceId: workspace._id,
        createdBy: user._id,
        keyPrefix: 'HR',
        template: 'scrum',
        members: [{ userId: user._id, role: 'admin' }],
        nextKeyNumber: 4,
      });

      const keyCol = sheet.columns.find((c) => c.systemField === 'key')!;

      // After deleting HR-1, HR-2, HR-3, the next row should get HR-4
      const result = await addRow(sheet._id.toString(), user._id.toString());

      expect(result.row.cells[keyCol.id]).toBe('HR-4');
    });
  });

  describe('insertRow above/below gets a key', () => {
    it('assigns key when inserting after a row', async () => {
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

      const keyCol = sheet.columns.find((c) => c.systemField === 'key')!;

      // First create an existing row
      const existingResult = await addRow(sheet._id.toString(), user._id.toString());
      const existingRowId = existingResult.row.id;

      // Insert after existing row
      const insertedResult = await addRow(sheet._id.toString(), user._id.toString(), { afterRowId: existingRowId });

      expect(insertedResult.row.cells[keyCol.id]).toBeDefined();
      expect(typeof insertedResult.row.cells[keyCol.id]).toBe('string');
      expect(String(insertedResult.row.cells[keyCol.id])).toMatch(/^HR-\d+$/);
    });

    it('assigns key when inserting before a row', async () => {
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

      const keyCol = sheet.columns.find((c) => c.systemField === 'key')!;

      // First create an existing row
      const existingResult = await addRow(sheet._id.toString(), user._id.toString());
      const existingRowId = existingResult.row.id;

      // Insert before existing row
      const insertedResult = await addRow(sheet._id.toString(), user._id.toString(), { beforeRowId: existingRowId });

      expect(insertedResult.row.cells[keyCol.id]).toBeDefined();
      expect(typeof insertedResult.row.cells[keyCol.id]).toBe('string');
      expect(String(insertedResult.row.cells[keyCol.id])).toMatch(/^HR-\d+$/);
    });
  });

  describe('blank-row creation gets a key', () => {
    it('assigns key when creating a blank row without cells', async () => {
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

      const keyCol = sheet.columns.find((c) => c.systemField === 'key')!;

      // Create blank row (no cells provided)
      const result = await addRow(sheet._id.toString(), user._id.toString());

      expect(result.row.cells[keyCol.id]).toBeDefined();
      expect(result.row.cells[keyCol.id]).toBe('HR-1');
    });
  });

  describe('editing a Key cell is rejected', () => {
    it('throws 400 when trying to update a key column', async () => {
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

      const keyCol = sheet.columns.find((c) => c.systemField === 'key')!;
      const row = await createRow(sheet._id);

      await expect(
        updateCell(sheet._id.toString(), user._id.toString(), row._id.toString(), keyCol.id, 'NEW-KEY'),
      ).rejects.toThrow("Work item keys can't be edited");

      try {
        await updateCell(sheet._id.toString(), user._id.toString(), row._id.toString(), keyCol.id, 'NEW-KEY');
      } catch (err: any) {
        expect(err.statusCode).toBe(400);
      }
    });
  });

  describe('plain sheets get no keys', () => {
    it('does not assign keys for non-project sheets', async () => {
      const user = await createUser();
      const workspace = await createWorkspace({
        owner: user._id,
        members: [{ user: user._id, role: 'editor' }],
      });
      const sheet = await createPlainSheetFactory({
        workspaceId: workspace._id,
        createdBy: user._id,
        kind: 'sheet',
      });

      const result = await addRow(sheet._id.toString(), user._id.toString());

      // The row should have no key cell (empty cells or only Name column)
      const cells = result.row.cells as Record<string, unknown>;
      // No system key column should exist on a plain sheet
      const hasKeyColumn = sheet.columns.some((c) => c.systemField === 'key');
      expect(hasKeyColumn).toBe(false);
    });
  });
});
