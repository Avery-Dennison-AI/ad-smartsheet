import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock Mongoose models ──────────────────────────────────────────────────────

const mockSheetFindById = vi.fn();
const mockSheetFindOne = vi.fn();
const mockSheetFindOneAndUpdate = vi.fn();
const mockSheetFindByIdAndUpdate = vi.fn();
const mockSheetCreate = vi.fn();
const mockRowCreate = vi.fn();
const mockRowFindById = vi.fn();
const mockRowFindByIdAndUpdate = vi.fn();
const mockRowFind = vi.fn();
const mockRowBulkWrite = vi.fn();
const mockRowInsertMany = vi.fn();
const mockRowUpdateMany = vi.fn();
const mockWorkspaceFindById = vi.fn();
const mockUserFindById = vi.fn();
const mockUserSheetMetaFind = vi.fn();
const mockUserSheetMetaFindOneAndUpdate = vi.fn();

vi.mock('../models/Sheet', () => ({
  default: {
    findById: (...args: unknown[]) => mockSheetFindById(...args),
    findOne: (...args: unknown[]) => mockSheetFindOne(...args),
    findOneAndUpdate: (...args: unknown[]) => mockSheetFindOneAndUpdate(...args),
    findByIdAndUpdate: (...args: unknown[]) => mockSheetFindByIdAndUpdate(...args),
    create: (...args: unknown[]) => mockSheetCreate(...args),
  },
}));

vi.mock('../models/Row', () => ({
  default: {
    create: (...args: unknown[]) => mockRowCreate(...args),
    findById: (...args: unknown[]) => mockRowFindById(...args),
    findByIdAndUpdate: (...args: unknown[]) => mockRowFindByIdAndUpdate(...args),
    find: (...args: unknown[]) => mockRowFind(...args),
    bulkWrite: (...args: unknown[]) => mockRowBulkWrite(...args),
    insertMany: (...args: unknown[]) => mockRowInsertMany(...args),
    updateMany: (...args: unknown[]) => mockRowUpdateMany(...args),
  },
}));

vi.mock('../models/Workspace', () => ({
  default: {
    findById: (...args: unknown[]) => mockWorkspaceFindById(...args),
  },
}));

vi.mock('../models/User', () => ({
  default: {
    findById: (...args: unknown[]) => mockUserFindById(...args),
  },
}));

vi.mock('../models/UserSheetMeta', () => ({
  default: {
    find: (...args: unknown[]) => mockUserSheetMetaFind(...args),
    findOneAndUpdate: (...args: unknown[]) => mockUserSheetMetaFindOneAndUpdate(...args),
  },
}));

vi.mock('../services/workspaceService', () => ({
  getMemberRole: (workspace: any, userId: string) => {
    const member = workspace?.members?.find((m: any) => String(m.user) === String(userId));
    return member ? member.role : null;
  },
}));

// Import after mocks
import { calculateDuration, calculateDueDate, parseDateUTC, formatDateUTC } from '../services/rowService';
import { duplicateSheet } from '../services/sheetService';

// ─── Test constants ────────────────────────────────────────────────────────────

const USER_ID = '507f1f77bcf86cd799439011';
const SHEET_ID = '507f1f77bcf86cd799439012';
const WORKSPACE_ID = '507f1f77bcf86cd799439013';
const NEW_SHEET_ID = '507f1f77bcf86cd799439099';

const NAME_COL_ID = 'col-name-001';
const KEY_COL_ID = 'col-key-001';
const STATUS_COL_ID = 'col-status-001';

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Creates a chainable mock that supports .select(), .populate(), .lean(), .exec() */
function makeChainable(value: unknown) {
  const q: any = {
    select: () => q,
    populate: () => q,
    lean: () => q,
    exec: () => Promise.resolve(value),
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(value).then(resolve, reject),
  };
  return q;
}

function makeProjectSheet(nextKeyNumber = 1, keyPrefix = 'HR') {
  return {
    _id: SHEET_ID,
    workspaceId: WORKSPACE_ID,
    kind: 'project' as const,
    project: {
      keyPrefix,
      template: 'scrum' as const,
      statuses: [
        { name: 'Open', color: 'gray', category: 'todo' as const },
      ],
      itemTypes: ['Story', 'Bug'],
      nextKeyNumber,
    },
    columns: [
      { id: NAME_COL_ID, name: 'Name', type: 'text' as const, order: 0, isPrimary: true },
      { id: KEY_COL_ID, name: 'Key', type: 'text' as const, order: 1, isPrimary: false, systemField: 'key' as const },
      { id: STATUS_COL_ID, name: 'Status', type: 'dropdown' as const, order: 2, isPrimary: false, systemField: 'status' as const, options: [
        { label: 'Open', color: 'gray' },
      ]},
    ],
    members: [],
  };
}

function makeWorkspace(role = 'editor') {
  return {
    _id: WORKSPACE_ID,
    members: [{ user: USER_ID, role }],
  };
}

function makeUser() {
  return {
    _id: USER_ID,
    role: 'member',
    isActive: true,
  };
}

function setupDefaultMocks(sheetOverride?: any) {
  const sheet = sheetOverride ?? makeProjectSheet();

  mockSheetFindById.mockReturnValue(makeChainable(sheet));
  mockWorkspaceFindById.mockReturnValue(makeChainable(makeWorkspace()));
  mockUserFindById.mockReturnValue(makeChainable(makeUser()));
  mockRowFind.mockReturnValue({
    sort: vi.fn().mockResolvedValue([]),
  });
  mockRowBulkWrite.mockResolvedValue({ modifiedCount: 0 });
  mockRowInsertMany.mockResolvedValue([]);
  mockRowUpdateMany.mockResolvedValue({ modifiedCount: 0 });
  mockSheetFindByIdAndUpdate.mockResolvedValue({});
  // By default, no existing prefix conflicts
  mockSheetFindOne.mockReturnValue(makeChainable(null));
}

// ─── Tests: Date format helpers ────────────────────────────────────────────────

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

// ─── Tests: Project duplication ────────────────────────────────────────────────

describe('project duplication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('produces new keys in order when duplicating a project with rows', async () => {
    const sheet = makeProjectSheet(4); // nextKeyNumber=4 means keys HR-1..HR-3 already used
    const ROW_1_ID = '507f1f77bcf86cd799439051';
    const ROW_2_ID = '507f1f77bcf86cd799439052';
    const ROW_3_ID = '507f1f77bcf86cd799439053';

    const sourceRows = [
      {
        _id: { toString: () => ROW_1_ID },
        order: 0,
        cells: { [KEY_COL_ID]: 'HR-1' },
        formatting: {},
        toObject: () => ({ cells: { [KEY_COL_ID]: 'HR-1' }, formatting: {} }),
        height: undefined,
        parentId: null,
        depth: 0,
        assigneeIds: [],
      },
      {
        _id: { toString: () => ROW_2_ID },
        order: 1,
        cells: { [KEY_COL_ID]: 'HR-2' },
        formatting: {},
        toObject: () => ({ cells: { [KEY_COL_ID]: 'HR-2' }, formatting: {} }),
        height: undefined,
        parentId: null,
        depth: 0,
        assigneeIds: [],
      },
      {
        _id: { toString: () => ROW_3_ID },
        order: 2,
        cells: { [KEY_COL_ID]: 'HR-3' },
        formatting: {},
        toObject: () => ({ cells: { [KEY_COL_ID]: 'HR-3' }, formatting: {} }),
        height: undefined,
        parentId: null,
        depth: 0,
        assigneeIds: [],
      },
    ];

    mockRowFind.mockReturnValue({
      sort: vi.fn().mockResolvedValue(sourceRows),
    });

    // Sheet.create should return a doc with the new ID
    let createdSheetData: any = null;
    mockSheetCreate.mockImplementation((data: any) => {
      createdSheetData = data;
      return Promise.resolve({
        _id: NEW_SHEET_ID,
        ...data,
      });
    });

    // For re-keying: each findOneAndUpdate increments counter starting from 1
    let counterCalls = 0;
    mockSheetFindOneAndUpdate.mockImplementation(() => {
      const preIncrementValue = counterCalls + 1;
      counterCalls++;
      return Promise.resolve({
        project: { nextKeyNumber: preIncrementValue },
      });
    });

    // Final Sheet.findById.populate for the return value
    const duplicatedSheet = {
      _id: NEW_SHEET_ID,
      workspaceId: WORKSPACE_ID,
      name: 'Copy of Test',
      kind: 'project',
      project: {
        keyPrefix: 'HR2',
        template: 'scrum',
        statuses: [{ name: 'Open', color: 'gray', category: 'todo' }],
        itemTypes: ['Story', 'Bug'],
        nextKeyNumber: 4, // 1 + 3 rows
      },
      columns: sheet.columns,
      createdBy: USER_ID,
      members: [],
      toObject: () => ({
        _id: NEW_SHEET_ID,
        workspaceId: WORKSPACE_ID,
        name: 'Copy of Test',
        kind: 'project',
        project: {
          keyPrefix: 'HR2',
          template: 'scrum',
          statuses: [{ name: 'Open', color: 'gray', category: 'todo' }],
          itemTypes: ['Story', 'Bug'],
          nextKeyNumber: 4,
        },
        columns: sheet.columns,
        createdBy: USER_ID,
        members: [],
      }),
    };
    // Override the final findById call (after create) to return the populated doc
    mockSheetFindById
      .mockReturnValueOnce(makeChainable(sheet)) // first call: getSheetWithAccess
      .mockReturnValueOnce(makeChainable(duplicatedSheet)); // second call: final populate

    await duplicateSheet(SHEET_ID, USER_ID);

    // Verify Row.bulkWrite was called with key updates
    expect(mockRowBulkWrite).toHaveBeenCalled();
    const bulkOps = mockRowBulkWrite.mock.calls[0][0];
    expect(bulkOps.length).toBe(3);

    // Extract the key values written
    const keys = bulkOps.map((op: any) => op.updateOne.update.$set[`cells.${KEY_COL_ID}`]);
    expect(keys).toEqual(['HR2-1', 'HR2-2', 'HR2-3']);

    // Verify the created sheet has project settings
    expect(createdSheetData.kind).toBe('project');
    expect(createdSheetData.project.keyPrefix).toBe('HR2');
    expect(createdSheetData.project.nextKeyNumber).toBe(1);
  });

  it('generates unique key prefix when HR2 is taken', async () => {
    const sheet = makeProjectSheet(1, 'HR');

    mockRowFind.mockReturnValue({
      sort: vi.fn().mockResolvedValue([]),
    });

    // First findOne call checks "HR2" → found (conflict)
    // Second findOne call checks "HR3" → null (available)
    mockSheetFindOne
      .mockReturnValueOnce(makeChainable({ _id: 'existing-sheet' })) // HR2 taken
      .mockReturnValueOnce(makeChainable(null)); // HR3 available

    let createdSheetData: any = null;
    mockSheetCreate.mockImplementation((data: any) => {
      createdSheetData = data;
      return Promise.resolve({
        _id: NEW_SHEET_ID,
        ...data,
      });
    });

    const duplicatedSheet = {
      _id: NEW_SHEET_ID,
      workspaceId: WORKSPACE_ID,
      name: 'Copy of Test',
      kind: 'project',
      project: { keyPrefix: 'HR3', template: 'scrum', statuses: [], itemTypes: [], nextKeyNumber: 1 },
      columns: sheet.columns,
      createdBy: USER_ID,
      members: [],
      toObject: () => ({
        _id: NEW_SHEET_ID,
        workspaceId: WORKSPACE_ID,
        name: 'Copy of Test',
        kind: 'project',
        project: { keyPrefix: 'HR3', template: 'scrum', statuses: [], itemTypes: [], nextKeyNumber: 1 },
        columns: sheet.columns,
        createdBy: USER_ID,
        members: [],
      }),
    };
    mockSheetFindById
      .mockReturnValueOnce(makeChainable(sheet))
      .mockReturnValueOnce(makeChainable(duplicatedSheet));

    await duplicateSheet(SHEET_ID, USER_ID);

    expect(createdSheetData.project.keyPrefix).toBe('HR3');
  });

  it('preserves systemField on all duplicate columns', async () => {
    const sheet = makeProjectSheet(1);

    mockRowFind.mockReturnValue({
      sort: vi.fn().mockResolvedValue([]),
    });

    let createdSheetData: any = null;
    mockSheetCreate.mockImplementation((data: any) => {
      createdSheetData = data;
      return Promise.resolve({
        _id: NEW_SHEET_ID,
        ...data,
      });
    });

    const duplicatedSheet = {
      _id: NEW_SHEET_ID,
      workspaceId: WORKSPACE_ID,
      name: 'Copy of Test',
      kind: 'project',
      project: { keyPrefix: 'HR2', template: 'scrum', statuses: [], itemTypes: [], nextKeyNumber: 1 },
      columns: sheet.columns,
      createdBy: USER_ID,
      members: [],
      toObject: () => ({
        _id: NEW_SHEET_ID,
        workspaceId: WORKSPACE_ID,
        name: 'Copy of Test',
        kind: 'project',
        project: { keyPrefix: 'HR2', template: 'scrum', statuses: [], itemTypes: [], nextKeyNumber: 1 },
        columns: sheet.columns,
        createdBy: USER_ID,
        members: [],
      }),
    };
    mockSheetFindById
      .mockReturnValueOnce(makeChainable(sheet))
      .mockReturnValueOnce(makeChainable(duplicatedSheet));

    await duplicateSheet(SHEET_ID, USER_ID);

    // All system columns should preserve their systemField property
    const copiedColumns = createdSheetData.columns;
    const keyCol = copiedColumns.find((c: any) => c.id === KEY_COL_ID);
    const statusCol = copiedColumns.find((c: any) => c.id === STATUS_COL_ID);

    expect(keyCol.systemField).toBe('key');
    expect(statusCol.systemField).toBe('status');
  });
});

// ─── Tests: kind and keyPrefix in list responses ───────────────────────────────

describe('kind and keyPrefix in list responses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('formatSheetMeta includes kind and keyPrefix for project sheets', async () => {
    // We test this indirectly via getRecents
    const sheetDoc = {
      _id: { toString: () => SHEET_ID },
      name: 'My Project',
      updatedAt: new Date('2025-06-01'),
      workspaceId: { toString: () => WORKSPACE_ID },
      kind: 'project',
      project: { keyPrefix: 'HR' },
    };
    const wsDoc = {
      _id: { toString: () => WORKSPACE_ID },
      name: 'Test Workspace',
    };
    const meta = {
      lastOpenedAt: new Date('2025-06-01'),
      isFavorite: false,
    };

    mockUserSheetMetaFind.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue([
            {
              sheetId: sheetDoc,
              workspaceId: wsDoc,
              ...meta,
            },
          ]),
        }),
      }),
    });

    mockWorkspaceFindById.mockReturnValue(makeChainable({
      _id: WORKSPACE_ID,
      members: [{ user: USER_ID, role: 'editor' }],
      name: 'Test Workspace',
    }));

    // Need to import getRecents dynamically since we mocked UserSheetMeta
    const { getRecents } = await import('../services/sheetService');
    const results = await getRecents(USER_ID);

    expect(results.length).toBe(1);
    expect(results[0].sheet.kind).toBe('project');
    expect(results[0].sheet.keyPrefix).toBe('HR');
  });

  it('formatSheetMeta returns kind=sheet and no keyPrefix for regular sheets', async () => {
    const sheetDoc = {
      _id: { toString: () => SHEET_ID },
      name: 'Regular Sheet',
      updatedAt: new Date('2025-06-01'),
      workspaceId: { toString: () => WORKSPACE_ID },
      kind: 'sheet',
    };
    const wsDoc = {
      _id: { toString: () => WORKSPACE_ID },
      name: 'Test Workspace',
    };
    const meta = {
      lastOpenedAt: new Date('2025-06-01'),
      isFavorite: false,
    };

    mockUserSheetMetaFind.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue([
            {
              sheetId: sheetDoc,
              workspaceId: wsDoc,
              ...meta,
            },
          ]),
        }),
      }),
    });

    mockWorkspaceFindById.mockReturnValue(makeChainable({
      _id: WORKSPACE_ID,
      members: [{ user: USER_ID, role: 'editor' }],
      name: 'Test Workspace',
    }));

    const { getRecents } = await import('../services/sheetService');
    const results = await getRecents(USER_ID);

    expect(results.length).toBe(1);
    expect(results[0].sheet.kind).toBe('sheet');
    expect(results[0].sheet.keyPrefix).toBeUndefined();
  });
});
