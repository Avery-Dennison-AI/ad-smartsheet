import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { TemplateKey } from '../services/projectTemplates';
import { PROJECT_TEMPLATES, buildTemplateColumns } from '../services/projectTemplates';
import { serializeColumn } from '../services/gridShared';
import type { ColumnDef } from '../models/Sheet';

// ─── Mock Mongoose models ──────────────────────────────────────────────────────

const mockSheetCreate = vi.fn();
const mockSheetFindById = vi.fn();
const mockSheetFindOne = vi.fn();
const mockSheetFindByIdAndUpdate = vi.fn();
const mockUserSheetMetaFindOneAndUpdate = vi.fn();
const mockWorkspaceFindById = vi.fn();
const mockOrgPolicyGetOrCreate = vi.fn();

vi.mock('../models/Sheet', () => ({
  default: {
    create: (...args: unknown[]) => mockSheetCreate(...args),
    findById: (...args: unknown[]) => mockSheetFindById(...args),
    findOne: (...args: unknown[]) => mockSheetFindOne(...args),
    findByIdAndUpdate: (...args: unknown[]) => mockSheetFindByIdAndUpdate(...args),
  },
}));

vi.mock('../models/UserSheetMeta', () => ({
  default: {
    findOneAndUpdate: (...args: unknown[]) => mockUserSheetMetaFindOneAndUpdate(...args),
  },
}));

vi.mock('../models/Workspace', () => ({
  default: {
    findById: (...args: unknown[]) => mockWorkspaceFindById(...args),
  },
}));

vi.mock('../models/OrgPolicy', () => ({
  default: {
    getOrCreate: (...args: unknown[]) => mockOrgPolicyGetOrCreate(...args),
  },
}));

// Mock workspaceService.getMemberRole
vi.mock('../services/workspaceService', () => ({
  getMemberRole: (workspace: any, userId: string) => {
    const member = workspace?.members?.find((m: any) => String(m.user) === String(userId));
    return member ? member.role : null;
  },
}));

// Import after mocks
import { createProject } from '../services/projectService';

// ─── Test constants ────────────────────────────────────────────────────────────

const USER_ID = '507f1f77bcf86cd799439011';
const WORKSPACE_ID = '507f1f77bcf86cd799439012';
const OTHER_WORKSPACE_ID = '507f1f77bcf86cd799439013';

const TEMPLATE_KEYS: TemplateKey[] = ['waterfall', 'scrum', 'kanban', 'tracker'];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function makeWorkspace(role = 'editor') {
  return {
    _id: WORKSPACE_ID,
    members: [{ user: USER_ID, role }],
  };
}

function makePopulatedSheet(sheetData: any) {
  const sheet: any = {
    ...sheetData,
    _id: { toString: () => sheetData._id || 'new-sheet-id' },
    workspaceId: { toString: () => sheetData.workspaceId || WORKSPACE_ID },
    createdBy: {
      _id: USER_ID,
      fullName: 'Test User',
      email: 'test@example.com',
    },
    toObject() {
      return {
        ...sheetData,
        _id: sheet._id,
        workspaceId: sheet.workspaceId,
        createdBy: sheet.createdBy,
      };
    },
  };
  return sheet;
}

/**
 * Creates a chainable query-like object that mimics Mongoose's Query API.
 * Sheet.findById returns this, allowing .populate() to be chained.
 */
function makeChainableQuery(result: any) {
  return {
    populate: vi.fn().mockResolvedValue(result),
  };
}

function setupDefaultMocks(role = 'editor') {
  mockWorkspaceFindById.mockResolvedValue(makeWorkspace(role));
  mockSheetFindOne.mockResolvedValue(null); // no duplicate prefix
  mockOrgPolicyGetOrCreate.mockResolvedValue({
    whoCanCreateWorkspaces: 'all',
    whoCanInviteGuests: 'admins',
    guestAccessExpiry: 'optional',
    defaultGuestExpiryDays: 30,
    allowedGuestEmailDomains: [],
    maxGuestRole: 'viewer',
  });
  mockUserSheetMetaFindOneAndUpdate.mockResolvedValue({});
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('createProject', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  // ── Template columns tests ─────────────────────────────────────────────────

  for (const templateKey of TEMPLATE_KEYS) {
    describe(`template: ${templateKey}`, () => {
      it('creates a sheet with correct columns including Key and Status system fields', async () => {
        let capturedCreateArgs: any = null;
        mockSheetCreate.mockImplementation((data: any) => {
          capturedCreateArgs = data;
          const sheet = makePopulatedSheet(data);
          // Sheet.findById returns a chainable query with .populate()
          mockSheetFindById.mockReturnValue(makeChainableQuery(sheet));
          return Promise.resolve(sheet);
        });

        await createProject(WORKSPACE_ID, USER_ID, {
          name: 'Test Project',
          keyPrefix: 'TP',
          template: templateKey,
        });

        expect(mockSheetCreate).toHaveBeenCalledOnce();
        const columns: ColumnDef[] = capturedCreateArgs.columns;

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
        let capturedCreateArgs: any = null;
        mockSheetCreate.mockImplementation((data: any) => {
          capturedCreateArgs = data;
          const sheet = makePopulatedSheet(data);
          // Sheet.findById returns a chainable query with .populate()
          mockSheetFindById.mockReturnValue(makeChainableQuery(sheet));
          return Promise.resolve(sheet);
        });

        await createProject(WORKSPACE_ID, USER_ID, {
          name: 'Test Project',
          keyPrefix: 'TP',
          template: templateKey,
        });

        const tpl = PROJECT_TEMPLATES[templateKey];
        const projectSettings = capturedCreateArgs.project;

        expect(projectSettings.statuses).toEqual(tpl.statuses);
        expect(projectSettings.itemTypes).toEqual(tpl.itemTypes);
        expect(projectSettings.keyPrefix).toBe('TP');
        expect(projectSettings.template).toBe(templateKey);
        expect(projectSettings.nextKeyNumber).toBe(1);
      });
    });
  }

  // ── Duplicate key prefix tests ─────────────────────────────────────────────

  it('throws 409 when key prefix already exists in the same workspace', async () => {
    mockSheetFindOne.mockResolvedValue({ _id: 'existing-sheet' });

    await expect(
      createProject(WORKSPACE_ID, USER_ID, {
        name: 'Test Project',
        keyPrefix: 'TP',
        template: 'scrum',
      }),
    ).rejects.toThrow('This key prefix is already used in this workspace');

    try {
      await createProject(WORKSPACE_ID, USER_ID, {
        name: 'Test Project',
        keyPrefix: 'TP',
        template: 'scrum',
      });
    } catch (err: any) {
      expect(err.statusCode).toBe(409);
    }
  });

  it('allows the same prefix in a different workspace (no conflict)', async () => {
    // Sheet.findOne returns null — no conflict
    mockSheetFindOne.mockResolvedValue(null);

    const sheet = makePopulatedSheet({
      _id: 'new-sheet-id',
      workspaceId: WORKSPACE_ID,
      name: 'Test Project',
    });
    mockSheetCreate.mockResolvedValue(sheet);
    // Sheet.findById returns a chainable query with .populate()
    mockSheetFindById.mockReturnValue(makeChainableQuery(sheet));

    const result = await createProject(WORKSPACE_ID, USER_ID, {
      name: 'Test Project',
      keyPrefix: 'TP',
      template: 'scrum',
    });

    expect(result).toBeDefined();
    expect(mockSheetCreate).toHaveBeenCalledOnce();
  });

  // ── Permission tests ───────────────────────────────────────────────────────

  it('throws 403 when user has viewer role', async () => {
    setupDefaultMocks('viewer');

    await expect(
      createProject(WORKSPACE_ID, USER_ID, {
        name: 'Test Project',
        keyPrefix: 'TP',
        template: 'scrum',
      }),
    ).rejects.toThrow('Only editors and above can create projects');

    try {
      await createProject(WORKSPACE_ID, USER_ID, {
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
