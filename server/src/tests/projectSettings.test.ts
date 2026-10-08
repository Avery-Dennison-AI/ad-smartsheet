import { describe, it, expect } from 'vitest';
import { createUser, createWorkspace, createProject, createRow } from './helpers/factories';
import { getProjectUsage, updateStatuses, updateItemTypes } from '../services/projectSettingsService';
import Sheet from '../models/Sheet';
import Row from '../models/Row';

// ─── Helper ────────────────────────────────────────────────────────────────

/** Creates a project with an admin user who has workspace membership. */
async function setupProjectWithAdmin() {
  const admin = await createUser({ role: 'admin' });
  const workspace = await createWorkspace({
    owner: admin._id,
    members: [{ user: admin._id, role: 'admin' }],
  });
  const project = await createProject({
    workspaceId: workspace._id,
    createdBy: admin._id,
    members: [{ userId: admin._id, role: 'admin' }],
  });
  return { admin, workspace, project };
}

/** Creates a viewer user with access to the given project. */
async function createViewerFor(project: Awaited<ReturnType<typeof createProject>>) {
  const viewer = await createUser({ role: 'member' });
  // Add viewer as sheet member
  await Sheet.findByIdAndUpdate(project._id, {
    $push: { members: { userId: viewer._id, role: 'viewer' } },
  });
  return viewer;
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('Project Settings', () => {
  // ── Status renaming ───────────────────────────────────────────────────────

  describe('updateStatuses', () => {
    it('renaming a status updates all row cells and column dropdown options', async () => {
      const { admin, project } = await setupProjectWithAdmin();
      const statuses = project.project!.statuses;
      const statusCol = project.columns.find((c) => c.systemField === 'status')!;

      // Create rows using the first status
      await createRow(project._id, {
        cells: { [statusCol.id]: statuses[0].name },
      });
      await createRow(project._id, {
        cells: { [statusCol.id]: statuses[0].name },
      });

      // Rename the first status
      const updatedStatuses = statuses.map((s, i) =>
        i === 0 ? { ...s, name: 'Renamed Status' } : s,
      );

      const result = await updateStatuses(
        project._id.toString(),
        admin._id.toString(),
        { statuses: updatedStatuses },
      );

      // Verify project statuses updated
      expect(result.project!.statuses[0].name).toBe('Renamed Status');

      // Verify column options updated
      const updatedSheet = await Sheet.findById(project._id);
      const updatedStatusCol = updatedSheet!.columns.find((c) => c.systemField === 'status')!;
      expect(updatedStatusCol.options![0].label).toBe('Renamed Status');

      // Verify row cells updated
      const rows = await Row.find({ sheetId: project._id }).lean();
      for (const row of rows) {
        const cells = (row.cells as unknown as Record<string, unknown>) ?? {};
        expect(cells[statusCol.id]).toBe('Renamed Status');
      }
    });

    it('removing a status used by rows without replacement returns 400', async () => {
      const { admin, project } = await setupProjectWithAdmin();
      const statuses = project.project!.statuses;
      const statusCol = project.columns.find((c) => c.systemField === 'status')!;

      // Create a row using the second status
      await createRow(project._id, {
        cells: { [statusCol.id]: statuses[1].name },
      });

      // Remove the second status without replacement
      const reducedStatuses = statuses.filter((_, i) => i !== 1);

      await expect(
        updateStatuses(project._id.toString(), admin._id.toString(), {
          statuses: reducedStatuses,
        }),
      ).rejects.toThrow('Choose where to move the items that use this status');
    });

    it('removing a status with valid replacement moves row cells', async () => {
      const { admin, project } = await setupProjectWithAdmin();
      const statuses = project.project!.statuses;
      const statusCol = project.columns.find((c) => c.systemField === 'status')!;

      // Create a row using the second status
      await createRow(project._id, {
        cells: { [statusCol.id]: statuses[1].name },
      });

      // Remove the second status with replacement pointing to the first
      const reducedStatuses = statuses.filter((_, i) => i !== 1);
      const replacements = { [statuses[1].id]: statuses[0].id };

      const result = await updateStatuses(
        project._id.toString(),
        admin._id.toString(),
        { statuses: reducedStatuses, replacements },
      );

      expect(result.project!.statuses.length).toBe(statuses.length - 1);

      // Verify row cell was moved
      const rows = await Row.find({ sheetId: project._id }).lean();
      for (const row of rows) {
        const cells = (row.cells as unknown as Record<string, unknown>) ?? {};
        expect(cells[statusCol.id]).toBe(statuses[0].name);
      }
    });

    it('requires at least one todo status', async () => {
      const { admin, project } = await setupProjectWithAdmin();
      const statuses = project.project!.statuses;

      // Remove all todo statuses
      const noTodoStatuses = statuses.filter((s) => s.category !== 'todo');

      await expect(
        updateStatuses(project._id.toString(), admin._id.toString(), {
          statuses: noTodoStatuses,
        }),
      ).rejects.toThrow('At least one "To do" status is required');
    });

    it('requires at least one done status', async () => {
      const { admin, project } = await setupProjectWithAdmin();
      const statuses = project.project!.statuses;

      // Remove all done statuses
      const noDoneStatuses = statuses.filter((s) => s.category !== 'done');

      await expect(
        updateStatuses(project._id.toString(), admin._id.toString(), {
          statuses: noDoneStatuses,
        }),
      ).rejects.toThrow('At least one "Done" status is required');
    });

    it('rejects duplicate status names (case-insensitive)', async () => {
      const { admin, project } = await setupProjectWithAdmin();
      const statuses = project.project!.statuses;

      // Make two statuses have the same name (different case)
      const dupeStatuses = [...statuses];
      dupeStatuses[1] = { ...dupeStatuses[1], name: dupeStatuses[0].name.toUpperCase() };

      await expect(
        updateStatuses(project._id.toString(), admin._id.toString(), {
          statuses: dupeStatuses,
        }),
      ).rejects.toThrow('Duplicate status name');
    });

    it('viewer cannot call updateStatuses (403)', async () => {
      const { project } = await setupProjectWithAdmin();
      const viewer = await createViewerFor(project);
      const statuses = project.project!.statuses;

      await expect(
        updateStatuses(project._id.toString(), viewer._id.toString(), {
          statuses,
        }),
      ).rejects.toThrow('Access denied');
    });

    it('plain sheet returns 400 (not a project)', async () => {
      const admin = await createUser({ role: 'admin' });
      const workspace = await createWorkspace({
        owner: admin._id,
        members: [{ user: admin._id, role: 'admin' }],
      });

      const { default: SheetModel } = await import('../models/Sheet');
      const plainSheet = await SheetModel.create({
        workspaceId: workspace._id,
        name: 'Plain Sheet',
        createdBy: admin._id,
        kind: 'sheet',
        columns: [],
        members: [{ userId: admin._id, role: 'admin' }],
      });

      await expect(
        updateStatuses(plainSheet._id.toString(), admin._id.toString(), {
          statuses: [{ name: 'Test', color: 'gray', category: 'todo' }],
        }),
      ).rejects.toThrow('Not a project sheet');
    });
  });

  // ── Item types ────────────────────────────────────────────────────────────

  describe('updateItemTypes', () => {
    it('renaming an item type updates Type cells and column options', async () => {
      const { admin, project } = await setupProjectWithAdmin();
      const itemTypes = project.project!.itemTypes;
      const typeCol = project.columns.find((c) => c.systemField === 'type');

      if (typeCol && itemTypes.length > 0) {
        // Create a row using the first type
        await createRow(project._id, {
          cells: { [typeCol.id]: itemTypes[0].name },
        });

        // Rename the first type
        const updatedTypes = itemTypes.map((t, i) =>
          i === 0 ? { ...t, name: 'Renamed Type' } : t,
        );

        const result = await updateItemTypes(
          project._id.toString(),
          admin._id.toString(),
          { itemTypes: updatedTypes },
        );

        expect(result.project!.itemTypes[0].name).toBe('Renamed Type');

        // Verify column options
        const updatedSheet = await Sheet.findById(project._id);
        const updatedTypeCol = updatedSheet!.columns.find((c) => c.systemField === 'type')!;
        expect(updatedTypeCol.options![0].label).toBe('Renamed Type');

        // Verify row cells
        const rows = await Row.find({ sheetId: project._id }).lean();
        for (const row of rows) {
          const cells = (row.cells as unknown as Record<string, unknown>) ?? {};
          expect(cells[typeCol.id]).toBe('Renamed Type');
        }
      }
    });

    it('removing a type used by rows without replacement returns 400', async () => {
      const { admin, project } = await setupProjectWithAdmin();
      const itemTypes = project.project!.itemTypes;
      const typeCol = project.columns.find((c) => c.systemField === 'type');

      if (typeCol && itemTypes.length > 1) {
        await createRow(project._id, {
          cells: { [typeCol.id]: itemTypes[1].name },
        });

        const reducedTypes = itemTypes.filter((_, i) => i !== 1);

        await expect(
          updateItemTypes(project._id.toString(), admin._id.toString(), {
            itemTypes: reducedTypes,
          }),
        ).rejects.toThrow('Choose where to move the items that use this type');
      }
    });

    it('removing a type with valid replacement moves row cells', async () => {
      const { admin, project } = await setupProjectWithAdmin();
      const itemTypes = project.project!.itemTypes;
      const typeCol = project.columns.find((c) => c.systemField === 'type');

      if (typeCol && itemTypes.length > 1) {
        await createRow(project._id, {
          cells: { [typeCol.id]: itemTypes[1].name },
        });

        const reducedTypes = itemTypes.filter((_, i) => i !== 1);
        const replacements = { [itemTypes[1].id]: itemTypes[0].id };

        const result = await updateItemTypes(
          project._id.toString(),
          admin._id.toString(),
          { itemTypes: reducedTypes, replacements },
        );

        expect(result.project!.itemTypes.length).toBe(itemTypes.length - 1);

        const rows = await Row.find({ sheetId: project._id }).lean();
        for (const row of rows) {
          const cells = (row.cells as unknown as Record<string, unknown>) ?? {};
          expect(cells[typeCol.id]).toBe(itemTypes[0].name);
        }
      }
    });

    it('rejects duplicate item type names (case-insensitive)', async () => {
      const { admin, project } = await setupProjectWithAdmin();
      const itemTypes = project.project!.itemTypes;

      if (itemTypes.length >= 2) {
        const dupeTypes = [...itemTypes];
        dupeTypes[1] = { ...dupeTypes[1], name: dupeTypes[0].name.toUpperCase() };

        await expect(
          updateItemTypes(project._id.toString(), admin._id.toString(), {
            itemTypes: dupeTypes,
          }),
        ).rejects.toThrow('Duplicate item type name');
      }
    });
  });

  // ── Usage counts ──────────────────────────────────────────────────────────

  describe('getProjectUsage', () => {
    it('returns correct counts per status id and type id', async () => {
      const { admin, project } = await setupProjectWithAdmin();
      const statuses = project.project!.statuses;
      const itemTypes = project.project!.itemTypes;
      const statusCol = project.columns.find((c) => c.systemField === 'status')!;
      const typeCol = project.columns.find((c) => c.systemField === 'type');

      // Create rows with specific statuses
      await createRow(project._id, {
        cells: { [statusCol.id]: statuses[0].name },
      });
      await createRow(project._id, {
        cells: { [statusCol.id]: statuses[0].name },
      });
      await createRow(project._id, {
        cells: { [statusCol.id]: statuses[1].name },
      });

      // Create rows with specific types
      if (typeCol && itemTypes.length > 0) {
        await createRow(project._id, {
          cells: { [typeCol.id]: itemTypes[0].name },
        });
        await createRow(project._id, {
          cells: { [typeCol.id]: itemTypes[0].name },
        });
      }

      const usage = await getProjectUsage(project._id.toString(), admin._id.toString());

      expect(usage.statusUsage[statuses[0].id]).toBe(2);
      expect(usage.statusUsage[statuses[1].id]).toBe(1);

      if (typeCol && itemTypes.length > 0) {
        expect(usage.typeUsage[itemTypes[0].id]).toBe(2);
      }
    });
  });
});
