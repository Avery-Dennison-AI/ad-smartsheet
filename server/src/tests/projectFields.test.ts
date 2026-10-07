import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock Mongoose models ──────────────────────────────────────────────────────

const mockSheetFindById = vi.fn();
const mockSheetFindOneAndUpdate = vi.fn();
const mockSheetFindByIdAndUpdate = vi.fn();
const mockRowCreate = vi.fn();
const mockRowFindById = vi.fn();
const mockRowFindByIdAndUpdate = vi.fn();
const mockRowFind = vi.fn();
const mockRowBulkWrite = vi.fn();
const mockRowUpdateMany = vi.fn();
const mockWorkspaceFindById = vi.fn();
const mockUserFindById = vi.fn();

vi.mock('../models/Sheet', () => ({
  default: {
    findById: (...args: unknown[]) => mockSheetFindById(...args),
    findOneAndUpdate: (...args: unknown[]) => mockSheetFindOneAndUpdate(...args),
    findByIdAndUpdate: (...args: unknown[]) => mockSheetFindByIdAndUpdate(...args),
  },
}));

vi.mock('../models/Row', () => ({
  default: {
    create: (...args: unknown[]) => mockRowCreate(...args),
    findById: (...args: unknown[]) => mockRowFindById(...args),
    findByIdAndUpdate: (...args: unknown[]) => mockRowFindByIdAndUpdate(...args),
    find: (...args: unknown[]) => mockRowFind(...args),
    bulkWrite: (...args: unknown[]) => mockRowBulkWrite(...args),
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

vi.mock('../services/workspaceService', () => ({
  getMemberRole: (workspace: any, userId: string) => {
    const member = workspace?.members?.find((m: any) => String(m.user) === String(userId));
    return member ? member.role : null;
  },
}));

// Import after mocks
import { updateCell } from '../services/rowService';
import { deleteColumn, updateColumn } from '../services/columnService';

// ─── Test constants ────────────────────────────────────────────────────────────

const USER_ID = '507f1f77bcf86cd799439011';
const SHEET_ID = '507f1f77bcf86cd799439012';
const WORKSPACE_ID = '507f1f77bcf86cd799439013';
const ROW_ID = '507f1f77bcf86cd799439050';

const NAME_COL_ID = 'col-name-001';
const KEY_COL_ID = 'col-key-001';
const STATUS_COL_ID = 'col-status-001';
const TYPE_COL_ID = 'col-type-001';
const START_COL_ID = 'col-start-001';
const DUE_COL_ID = 'col-due-001';
const DURATION_COL_ID = 'col-duration-001';

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

function makeProjectSheet() {
  return {
    _id: SHEET_ID,
    workspaceId: WORKSPACE_ID,
    kind: 'project' as const,
    project: {
      keyPrefix: 'HR',
      template: 'scrum' as const,
      statuses: [
        { name: 'Open', color: 'gray', category: 'todo' as const },
        { name: 'In Progress', color: 'blue', category: 'in_progress' as const },
        { name: 'Done', color: 'green', category: 'done' as const },
      ],
      itemTypes: ['Story', 'Bug', 'Task'],
      nextKeyNumber: 1,
    },
    columns: [
      { id: NAME_COL_ID, name: 'Name', type: 'text' as const, order: 0, isPrimary: true },
      { id: KEY_COL_ID, name: 'Key', type: 'text' as const, order: 1, isPrimary: false, systemField: 'key' as const },
      { id: STATUS_COL_ID, name: 'Status', type: 'dropdown' as const, order: 2, isPrimary: false, systemField: 'status' as const, options: [
        { label: 'Open', color: 'gray' },
        { label: 'In Progress', color: 'blue' },
        { label: 'Done', color: 'green' },
      ]},
      { id: TYPE_COL_ID, name: 'Type', type: 'dropdown' as const, order: 3, isPrimary: false, systemField: 'type' as const, options: [
        { label: 'Story', color: 'gray' },
        { label: 'Bug', color: 'red' },
        { label: 'Task', color: 'blue' },
      ]},
      { id: START_COL_ID, name: 'Start', type: 'date' as const, order: 4, isPrimary: false, systemField: 'start' as const },
      { id: DUE_COL_ID, name: 'Due', type: 'date' as const, order: 5, isPrimary: false, systemField: 'due' as const },
      { id: DURATION_COL_ID, name: 'Duration', type: 'number' as const, order: 6, isPrimary: false, systemField: 'duration' as const },
    ],
    members: [],
  };
}

function makeWorkspace(role = 'admin') {
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

  // Sheet.findById must be chainable (some callers use .select())
  mockSheetFindById.mockReturnValue(makeChainable(sheet));
  // Workspace.findById must be chainable
  mockWorkspaceFindById.mockReturnValue(makeChainable(makeWorkspace()));
  // User.findById must be chainable (.select('role guestExpiresAt isActive'))
  mockUserFindById.mockReturnValue(makeChainable(makeUser()));
  mockRowFind.mockReturnValue({
    sort: vi.fn().mockResolvedValue([]),
  });
  mockRowBulkWrite.mockResolvedValue({ modifiedCount: 0 });
  mockRowUpdateMany.mockResolvedValue({ modifiedCount: 0 });
  mockSheetFindByIdAndUpdate.mockResolvedValue({});
}

// ─── Tests: System field column protection ─────────────────────────────────────

describe('projectFields — system field column protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('deleteColumn', () => {
    it('returns 400 when deleting a system field column', async () => {
      setupDefaultMocks();

      await expect(
        deleteColumn(SHEET_ID, USER_ID, STATUS_COL_ID),
      ).rejects.toThrow('This is a project field');

      try {
        await deleteColumn(SHEET_ID, USER_ID, STATUS_COL_ID);
      } catch (err: any) {
        expect(err.statusCode).toBe(400);
      }
    });

    it('allows deleting a non-system column', async () => {
      // Add a regular column to the sheet
      const sheet = makeProjectSheet();
      const regularColId = 'col-regular-001';
      sheet.columns.push({
        id: regularColId,
        name: 'Notes',
        type: 'text' as const,
        order: 7,
        isPrimary: false,
      });
      setupDefaultMocks(sheet);

      const result = await deleteColumn(SHEET_ID, USER_ID, regularColId);
      expect(result).toEqual({ deleted: true, columnId: regularColId });
    });
  });

  describe('updateColumn', () => {
    it('returns 400 when changing the type of a system field column', async () => {
      setupDefaultMocks();

      await expect(
        updateColumn(SHEET_ID, USER_ID, STATUS_COL_ID, { type: 'text' }),
      ).rejects.toThrow('This is a project field');

      try {
        await updateColumn(SHEET_ID, USER_ID, STATUS_COL_ID, { type: 'text' });
      } catch (err: any) {
        expect(err.statusCode).toBe(400);
      }
    });

    it('allows renaming a system field column', async () => {
      setupDefaultMocks();

      const result = await updateColumn(SHEET_ID, USER_ID, STATUS_COL_ID, { name: 'Custom Status' });
      expect(result).toBeDefined();
      expect(result.name).toBe('Custom Status');
      expect(result.systemField).toBe('status');
    });
  });
});

// ─── Tests: Status and Type validation ─────────────────────────────────────────

describe('projectFields — status and type validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  it('returns 400 when setting Status to an invalid value', async () => {
    mockRowFindById.mockReturnValue(makeChainable({
      _id: ROW_ID,
      sheetId: SHEET_ID,
      cells: {},
      toObject: () => ({ cells: {} }),
    }));

    await expect(
      updateCell(SHEET_ID, USER_ID, ROW_ID, STATUS_COL_ID, 'InvalidStatus'),
    ).rejects.toThrow('Invalid status value for this project');

    try {
      await updateCell(SHEET_ID, USER_ID, ROW_ID, STATUS_COL_ID, 'InvalidStatus');
    } catch (err: any) {
      expect(err.statusCode).toBe(400);
    }
  });

  it('succeeds when setting Status to a valid value', async () => {
    mockRowFindById.mockReturnValue(makeChainable({
      _id: ROW_ID,
      sheetId: SHEET_ID,
      cells: {},
      toObject: () => ({ cells: {} }),
    }));
    mockRowFindByIdAndUpdate.mockResolvedValue({});

    const result = await updateCell(SHEET_ID, USER_ID, ROW_ID, STATUS_COL_ID, 'Open');
    expect(result).toBeDefined();
    // Should include at least the direct cell update
    const directUpdate = result.find((u: any) => u.columnId === STATUS_COL_ID);
    expect(directUpdate).toBeDefined();
    expect(directUpdate!.value).toBe('Open');
  });

  it('returns 400 when setting Type to an invalid value', async () => {
    mockRowFindById.mockReturnValue(makeChainable({
      _id: ROW_ID,
      sheetId: SHEET_ID,
      cells: {},
      toObject: () => ({ cells: {} }),
    }));

    await expect(
      updateCell(SHEET_ID, USER_ID, ROW_ID, TYPE_COL_ID, 'Epic'),
    ).rejects.toThrow('Invalid type value for this project');

    try {
      await updateCell(SHEET_ID, USER_ID, ROW_ID, TYPE_COL_ID, 'Epic');
    } catch (err: any) {
      expect(err.statusCode).toBe(400);
    }
  });

  it('succeeds when setting Type to empty value', async () => {
    mockRowFindById.mockReturnValue(makeChainable({
      _id: ROW_ID,
      sheetId: SHEET_ID,
      cells: {},
      toObject: () => ({ cells: {} }),
    }));
    mockRowFindByIdAndUpdate.mockResolvedValue({});

    const result = await updateCell(SHEET_ID, USER_ID, ROW_ID, TYPE_COL_ID, '');
    expect(result).toBeDefined();
    const directUpdate = result.find((u: any) => u.columnId === TYPE_COL_ID);
    expect(directUpdate).toBeDefined();
    expect(directUpdate!.value).toBeNull();
  });
});

// ─── Tests: Duration calculation ───────────────────────────────────────────────

describe('projectFields — duration calculation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  it('calculates Duration when Start is changed and Due is set', async () => {
    const startDate = '2025-01-01';
    const dueDate = '2025-01-05';

    // First call: Row.findById for the initial check
    // Second call: Row.findById.select('cells') for reload after save (for assignee/duration calc)
    mockRowFindById
      .mockReturnValueOnce(makeChainable({
        _id: ROW_ID,
        sheetId: SHEET_ID,
        cells: { [DUE_COL_ID]: dueDate },
        toObject: () => ({ cells: { [DUE_COL_ID]: dueDate } }),
      }))
      .mockReturnValueOnce(makeChainable({
        _id: ROW_ID,
        sheetId: SHEET_ID,
        cells: { [START_COL_ID]: startDate, [DUE_COL_ID]: dueDate },
        toObject: () => ({ cells: { [START_COL_ID]: startDate, [DUE_COL_ID]: dueDate } }),
      }));
    mockRowFindByIdAndUpdate.mockResolvedValue({});

    const result = await updateCell(SHEET_ID, USER_ID, ROW_ID, START_COL_ID, startDate);

    // Should have the direct update plus the computed duration
    const durationUpdate = result.find((u: any) => u.columnId === DURATION_COL_ID);
    expect(durationUpdate).toBeDefined();
    // Jan 1 to Jan 5 = 5 days inclusive
    expect(durationUpdate!.value).toBe(5);
  });

  it('calculates Duration when Due is changed and Start is set', async () => {
    const startDate = '2025-01-01';
    const dueDate = '2025-01-10';

    mockRowFindById
      .mockReturnValueOnce(makeChainable({
        _id: ROW_ID,
        sheetId: SHEET_ID,
        cells: { [START_COL_ID]: startDate },
        toObject: () => ({ cells: { [START_COL_ID]: startDate } }),
      }))
      .mockReturnValueOnce(makeChainable({
        _id: ROW_ID,
        sheetId: SHEET_ID,
        cells: { [START_COL_ID]: startDate, [DUE_COL_ID]: dueDate },
        toObject: () => ({ cells: { [START_COL_ID]: startDate, [DUE_COL_ID]: dueDate } }),
      }));
    mockRowFindByIdAndUpdate.mockResolvedValue({});

    const result = await updateCell(SHEET_ID, USER_ID, ROW_ID, DUE_COL_ID, dueDate);

    const durationUpdate = result.find((u: any) => u.columnId === DURATION_COL_ID);
    expect(durationUpdate).toBeDefined();
    // Jan 1 to Jan 10 = 10 days inclusive
    expect(durationUpdate!.value).toBe(10);
  });

  it('calculates Due when Duration is changed and Start is set', async () => {
    const startDate = '2025-01-01';
    const duration = 7;

    mockRowFindById
      .mockReturnValueOnce(makeChainable({
        _id: ROW_ID,
        sheetId: SHEET_ID,
        cells: { [START_COL_ID]: startDate },
        toObject: () => ({ cells: { [START_COL_ID]: startDate } }),
      }))
      .mockReturnValueOnce(makeChainable({
        _id: ROW_ID,
        sheetId: SHEET_ID,
        cells: { [START_COL_ID]: startDate, [DURATION_COL_ID]: duration },
        toObject: () => ({ cells: { [START_COL_ID]: startDate, [DURATION_COL_ID]: duration } }),
      }));
    mockRowFindByIdAndUpdate.mockResolvedValue({});

    const result = await updateCell(SHEET_ID, USER_ID, ROW_ID, DURATION_COL_ID, duration);

    const dueUpdate = result.find((u: any) => u.columnId === DUE_COL_ID);
    expect(dueUpdate).toBeDefined();
    // Start Jan 1 + 7 days - 1 = Jan 7 → "2025-01-07"
    expect(dueUpdate!.value).toBe('2025-01-07');
  });
});
