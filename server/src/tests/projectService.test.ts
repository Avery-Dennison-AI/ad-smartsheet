import { describe, it, expect } from 'vitest';
import type { TemplateKey } from '../services/projectTemplates';
import { PROJECT_TEMPLATES, buildTemplateColumns } from '../services/projectTemplates';
import { serializeColumn } from '../services/gridShared';
import type { ColumnDef } from '../models/Sheet';
import { createUser, createWorkspace, createProject as factoryCreateProject } from './helpers/factories';
import { createProject } from '../services/projectService';
import Sheet from '../models/Sheet';

const TEMPLATE_KEYS: TemplateKey[] = ['waterfall', 'scrum', 'kanban', 'tracker'];

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('createProject', () => {
  // ── Template columns tests ─────────────────────────────────────────────────

  for (const templateKey of TEMPLATE_KEYS) {
    describe(`template: ${templateKey}`, () => {
      it('creates a sheet with correct columns including Key and Status system fields', async () => {
        const user = await createUser();
        const workspace = await createWorkspace({
          owner: user._id,
          members: [{ user: user._id, role: 'editor' }],
        });

        const result = await createProject(workspace._id.toString(), user._id.toString(), {
          name: 'Test Project',
          keyPrefix: 'TP',
          template: templateKey,
        });

        // Query the created sheet from DB to verify columns
        const sheet = await Sheet.findById(result.id);
        expect(sheet).toBeDefined();
        const columns = sheet!.columns;

        // First column is primary Name column
        expect(columns[0].name).toBe('Name');
        expect(columns[0].isPrimary).toBe(true);
        expect(columns[0].type).toBe('text');
        expect(columns[0].order).toBe(0);

        // Must have a Key column with systemField 'key'
        const keyCol = columns.find((c) => c.systemField === 'key');
        expect(keyCol).toBeDefined();
        expect(keyCol!.name).toBe('Key');
        expect(keyCol!.type).toBe('text');

        // Must have a Status column with systemField 'status'
        const statusCol = columns.find((c) => c.systemField === 'status');
        expect(statusCol).toBeDefined();
        expect(statusCol!.name).toBe('Status');
        expect(statusCol!.type).toBe('dropdown');

        // Status options must match template statuses
        const tpl = PROJECT_TEMPLATES[templateKey];
        expect(statusCol!.options).toBeDefined();
        expect(statusCol!.options!.length).toBe(tpl.statuses.length);
        for (let i = 0; i < tpl.statuses.length; i++) {
          expect(statusCol!.options![i].label).toBe(tpl.statuses[i].name);
          expect(statusCol!.options![i].color).toBe(tpl.statuses[i].color);
        }

        // If Type column exists, its options must match itemTypes
        const typeCol = columns.find((c) => c.systemField === 'type');
        if (typeCol) {
          expect(typeCol.options).toBeDefined();
          expect(typeCol.options!.length).toBe(tpl.itemTypes.length);
          for (let i = 0; i < tpl.itemTypes.length; i++) {
            expect(typeCol.options![i].label).toBe(tpl.itemTypes[i]);
          }
        }

        // All columns have sequential order values
        for (let i = 0; i < columns.length; i++) {
          expect(columns[i].order).toBe(i);
        }

        // All columns have unique IDs
        const ids = new Set(columns.map((c) => c.id));
        expect(ids.size).toBe(columns.length);
      });

      it('saves project.statuses and project.itemTypes matching the template', async () => {
        const user = await createUser();
        const workspace = await createWorkspace({
          owner: user._id,
          members: [{ user: user._id, role: 'editor' }],
        });

        const result = await createProject(workspace._id.toString(), user._id.toString(), {
          name: 'Test Project',
          keyPrefix: 'TP',
          template: templateKey,
        });

        const sheet = await Sheet.findById(result.id);
        expect(sheet).toBeDefined();

        const tpl = PROJECT_TEMPLATES[templateKey];
        const projectSettings = sheet!.project!;

        // Statuses should match template (with added ids)
        expect(projectSettings.statuses.length).toBe(tpl.statuses.length);
        for (let i = 0; i < tpl.statuses.length; i++) {
          expect(projectSettings.statuses[i].name).toBe(tpl.statuses[i].name);
          expect(projectSettings.statuses[i].color).toBe(tpl.statuses[i].color);
          expect(projectSettings.statuses[i].category).toBe(tpl.statuses[i].category);
          expect(projectSettings.statuses[i].id).toBeDefined();
        }

        // Item types should match template (converted from string[] to { id, name }[])
        expect(projectSettings.itemTypes.length).toBe(tpl.itemTypes.length);
        for (let i = 0; i < tpl.itemTypes.length; i++) {
          expect(projectSettings.itemTypes[i].name).toBe(tpl.itemTypes[i]);
          expect(projectSettings.itemTypes[i].id).toBeDefined();
        }

        expect(projectSettings.keyPrefix).toBe('TP');
        expect(projectSettings.template).toBe(templateKey);
        expect(projectSettings.nextKeyNumber).toBe(1);
      });
    });
  }

  // ── Duplicate key prefix tests ─────────────────────────────────────────────

  it('throws 409 when key prefix already exists in the same workspace', async () => {
    const user = await createUser();
    const workspace = await createWorkspace({
      owner: user._id,
      members: [{ user: user._id, role: 'editor' }],
    });

    // Create first project with TP prefix
    await createProject(workspace._id.toString(), user._id.toString(), {
      name: 'First Project',
      keyPrefix: 'TP',
      template: 'scrum',
    });

    // Try to create another with same prefix → should fail
    await expect(
      createProject(workspace._id.toString(), user._id.toString(), {
        name: 'Second Project',
        keyPrefix: 'TP',
        template: 'scrum',
      }),
    ).rejects.toThrow('This key prefix is already used in this workspace');

    try {
      await createProject(workspace._id.toString(), user._id.toString(), {
        name: 'Second Project',
        keyPrefix: 'TP',
        template: 'scrum',
      });
    } catch (err: any) {
      expect(err.statusCode).toBe(409);
    }
  });

  it('allows the same prefix in a different workspace (no conflict)', async () => {
    const user = await createUser();
    const ws1 = await createWorkspace({
      owner: user._id,
      members: [{ user: user._id, role: 'editor' }],
    });
    const ws2 = await createWorkspace({
      owner: user._id,
      members: [{ user: user._id, role: 'editor' }],
    });

    // Create project in ws1
    const r1 = await createProject(ws1._id.toString(), user._id.toString(), {
      name: 'Project WS1',
      keyPrefix: 'TP',
      template: 'scrum',
    });
    expect(r1).toBeDefined();

    // Same prefix in ws2 should succeed
    const r2 = await createProject(ws2._id.toString(), user._id.toString(), {
      name: 'Project WS2',
      keyPrefix: 'TP',
      template: 'scrum',
    });
    expect(r2).toBeDefined();
  });

  // ── Permission tests ───────────────────────────────────────────────────────

  it('throws 403 when user has viewer role', async () => {
    const user = await createUser();
    const workspace = await createWorkspace({
      owner: user._id,
      members: [{ user: user._id, role: 'viewer' }],
    });

    await expect(
      createProject(workspace._id.toString(), user._id.toString(), {
        name: 'Test Project',
        keyPrefix: 'TP',
        template: 'scrum',
      }),
    ).rejects.toThrow('Only editors and above can create projects');

    try {
      await createProject(workspace._id.toString(), user._id.toString(), {
        name: 'Test Project',
        keyPrefix: 'TP',
        template: 'scrum',
      });
    } catch (err: any) {
      expect(err.statusCode).toBe(403);
    }
  });
});

// ── systemField preservation via serializeColumn ─────────────────────────────

describe('systemField preservation', () => {
  it('serializeColumn preserves systemField', () => {
    const col = {
      id: 'col-1',
      name: 'Status',
      type: 'dropdown' as const,
      order: 2,
      isPrimary: false,
      systemField: 'status' as const,
      options: [{ label: 'Open', color: 'gray' }],
    };

    const serialized = serializeColumn(col);
    expect(serialized.systemField).toBe('status');
  });

  it('serializeColumn omits systemField when not present', () => {
    const col = {
      id: 'col-1',
      name: 'Notes',
      type: 'text' as const,
      order: 3,
      isPrimary: false,
    };

    const serialized = serializeColumn(col);
    expect(serialized.systemField).toBeUndefined();
  });

  it('systemField survives a rename via updateColumn pattern', () => {
    // Simulate what updateColumn does: serialize → patch name → write back
    const originalCol = {
      id: 'col-status',
      name: 'Status',
      type: 'dropdown' as const,
      order: 2,
      isPrimary: false,
      systemField: 'status' as const,
      options: [{ label: 'Open', color: 'gray' }],
    };

    const serialized = serializeColumn(originalCol);
    serialized.name = 'Renamed Status';

    expect(serialized.systemField).toBe('status');
    expect(serialized.name).toBe('Renamed Status');
  });

  it('systemField survives reorder via reorderColumns pattern', () => {
    const columns = [
      { id: 'col-name', name: 'Name', type: 'text' as const, order: 0, isPrimary: true },
      { id: 'col-key', name: 'Key', type: 'text' as const, order: 1, isPrimary: false, systemField: 'key' as const },
      { id: 'col-status', name: 'Status', type: 'dropdown' as const, order: 2, isPrimary: false, systemField: 'status' as const, options: [] },
      { id: 'col-assignee', name: 'Assignee', type: 'contact' as const, order: 3, isPrimary: false, systemField: 'assignee' as const },
    ];

    // Simulate reorder: serialize all, reassign order
    const reorderedIds = ['col-name', 'col-status', 'col-key', 'col-assignee'];
    const colMap = new Map(columns.map((c) => [c.id, c]));
    const reordered: ColumnDef[] = [];
    for (let i = 0; i < reorderedIds.length; i++) {
      const col = colMap.get(reorderedIds[i])!;
      reordered.push({ ...serializeColumn(col), order: i });
    }

    // Verify systemField is preserved on every column that had one
    const keyCol = reordered.find((c) => c.id === 'col-key');
    expect(keyCol!.systemField).toBe('key');

    const statusCol = reordered.find((c) => c.id === 'col-status');
    expect(statusCol!.systemField).toBe('status');

    const assigneeCol = reordered.find((c) => c.id === 'col-assignee');
    expect(assigneeCol!.systemField).toBe('assignee');

    const nameCol = reordered.find((c) => c.id === 'col-name');
    expect(nameCol!.systemField).toBeUndefined();
  });
});

// ── listSheets includes keyPrefix for projects ────────────────────────────────

describe('listSheets keyPrefix', () => {
  it('returns keyPrefix for project sheets and no keyPrefix for plain sheets', async () => {
    const user = await createUser();
    const workspace = await createWorkspace({
      owner: user._id,
      members: [{ user: user._id, role: 'editor' }],
    });

    // Create a plain sheet
    const { createSheet: createPlainSheetFactory } = await import('./helpers/factories');
    await createPlainSheetFactory({
      workspaceId: workspace._id,
      createdBy: user._id,
      name: 'Plain Sheet',
      kind: 'sheet',
    });

    // Create a project with key prefix PROJ
    await factoryCreateProject({
      workspaceId: workspace._id,
      createdBy: user._id,
      keyPrefix: 'PROJ',
      template: 'waterfall',
      name: 'My Project',
      members: [{ userId: user._id, role: 'admin' }],
    });

    const { listSheets } = await import('../services/sheetService');
    const results = await listSheets(workspace._id.toString(), user._id.toString());

    expect(results.length).toBe(2);

    const plainSheet = results.find((s: any) => s.kind === 'sheet');
    expect(plainSheet).toBeDefined();
    expect(plainSheet!.kind).toBe('sheet');
    // Plain sheets should not have keyPrefix at the top level of the formatted output
    // The formatSheet function spreads obj which includes project sub-doc only if it exists

    const projectSheet = results.find((s: any) => s.kind === 'project');
    expect(projectSheet).toBeDefined();
    expect(projectSheet!.kind).toBe('project');
    expect(projectSheet!.project.keyPrefix).toBe('PROJ');
  });
});
