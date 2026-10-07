import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock Mongoose models ──────────────────────────────────────────────────────

const mockSheetFindById = vi.fn();
const mockSheetFindOneAndUpdate = vi.fn();
const mockRowCreate = vi.fn();
const mockRowFindById = vi.fn();
const mockRowFindByIdAndUpdate = vi.fn();
const mockRowFind = vi.fn();
const mockRowBulkWrite = vi.fn();
const mockWorkspaceFindById = vi.fn();
const mockUserFindById = vi.fn();

vi.mock('../models/Sheet', () => ({
  default: {
    findById: (...args: unknown[]) => mockSheetFindById(...args),
    findOneAndUpdate: (...args: unknown[]) => mockSheetFindOneAndUpdate(...args),
  },
}));

vi.mock('../models/Row', () => ({
  default: {
    create: (...args: unknown[]) => mockRowCreate(...args),
    findById: (...args: unknown[]) => mockRowFindById(...args),
    findByIdAndUpdate: (...args: unknown[]) => mockRowFindByIdAndUpdate(...args),
    find: (...args: unknown[]) => mockRowFind(...args),
    bulkWrite: (...args: unknown[]) => mockRowBulkWrite(...args),
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
import { addRow, updateCell } from '../services/rowService';

// ─── Test constants ────────────────────────────────────────────────────────────

const USER_ID = '507f1f77bcf86cd799439011';
const SHEET_ID = '507f1f77bcf86cd799439012';
const WORKSPACE_ID = '507f1f77bcf86cd799439013';
const KEY_COL_ID = 'col-key-001';
const NAME_COL_ID = 'col-name-001';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function makeProjectSheet(nextKeyNumber = 1) {
  return {
    _id: SHEET_ID,
    workspaceId: WORKSPACE_ID,
    kind: 'project' as const,
    project: {
      keyPrefix: 'HR',
      template: 'scrum' as const,
      statuses: [],
      itemTypes: [],
      nextKeyNumber,
    },
    columns: [
      { id: NAME_COL_ID, name: 'Name', type: 'text' as const, order: 0, isPrimary: true },
      { id: KEY_COL_ID, name: 'Key', type: 'text' as const, order: 1, isPrimary: false, systemField: 'key' as const },
    ],
    members: [],
  };
}

function makePlainSheet() {
  return {
    _id: SHEET_ID,
    workspaceId: WORKSPACE_ID,
    kind: 'sheet' as const,
    columns: [
      { id: NAME_COL_ID, name: 'Name', type: 'text' as const, order: 0, isPrimary: true },
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

  // Sheet.findById returns the sheet directly (for requireSheetAccess in getSheetWithAccess)
  mockSheetFindById.mockResolvedValue(sheet);

  // Workspace.findById for permission checks
  mockWorkspaceFindById.mockResolvedValue(makeWorkspace());

  // User.findById().select() for permission checks
  mockUserFindById.mockReturnValue({
    select: vi.fn().mockResolvedValue(makeUser()),
  });

  // Row.find for loadHierarchyRows - returns sortable mock
  mockRowFind.mockReturnValue({
    sort: vi.fn().mockResolvedValue([]),
  });

  // Row.bulkWrite for hierarchy updates
  mockRowBulkWrite.mockResolvedValue({ modifiedCount: 0 });
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('projectKeys — generateProjectKey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sequential keys', () => {
    it('produces HR-1, HR-2, HR-3 in order when adding 3 rows', async () => {
      let currentKeyNumber = 1;
      const assignedKeys: string[] = [];

      setupDefaultMocks();

      // Track Sheet.findOneAndUpdate calls to simulate atomic counter
      mockSheetFindOneAndUpdate.mockImplementation(async () => {
        const num = currentKeyNumber;
        currentKeyNumber++;
        return {
          project: { nextKeyNumber: num, keyPrefix: 'HR' },
        };
      });

      // Track Row.create to capture created rows — key is now in cells at creation time
      mockRowCreate.mockImplementation(async (data: any) => {
        // Capture the key from cells
        const key = data.cells?.[KEY_COL_ID];
        if (key) assignedKeys.push(key);
        const row = {
          _id: data._id,
          ...data,
          toObject: () => data,
        };
        return row;
      });

      mockRowFindByIdAndUpdate.mockResolvedValue({});

      // Add 3 rows sequentially
      await addRow(SHEET_ID, USER_ID);
      await addRow(SHEET_ID, USER_ID);
      await addRow(SHEET_ID, USER_ID);

      expect(assignedKeys).toEqual(['HR-1', 'HR-2', 'HR-3']);
    });
  });

  describe('concurrent uniqueness', () => {
    it('produces 20 unique keys when called concurrently', async () => {
      let currentKeyNumber = 1;
      const assignedKeys: string[] = [];

      setupDefaultMocks();

      // Simulate atomic counter with sequential numbers
      mockSheetFindOneAndUpdate.mockImplementation(async () => {
        const num = currentKeyNumber++;
        return {
          project: { nextKeyNumber: num, keyPrefix: 'HR' },
        };
      });

      mockRowCreate.mockImplementation(async (data: any) => {
        const key = data.cells?.[KEY_COL_ID];
        if (key) assignedKeys.push(key);
        return {
          _id: data._id,
          ...data,
          toObject: () => data,
        };
      });

      mockRowFindByIdAndUpdate.mockResolvedValue({});

      // Call addRow 20 times concurrently
      await Promise.all(Array.from({ length: 20 }, () => addRow(SHEET_ID, USER_ID)));

      // All keys should be unique
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
      let currentKeyNumber = 4; // Simulate that HR-1, HR-2, HR-3 were already created
      const assignedKeys: string[] = [];

      setupDefaultMocks();

      mockSheetFindOneAndUpdate.mockImplementation(async () => {
        const num = currentKeyNumber++;
        return {
          project: { nextKeyNumber: num, keyPrefix: 'HR' },
        };
      });

      mockRowCreate.mockImplementation(async (data: any) => {
        const key = data.cells?.[KEY_COL_ID];
        if (key) assignedKeys.push(key);
        return {
          _id: data._id,
          ...data,
          toObject: () => data,
        };
      });

      mockRowFindByIdAndUpdate.mockResolvedValue({});

      // After deleting HR-1, HR-2, HR-3, the next row should get HR-4
      await addRow(SHEET_ID, USER_ID);

      expect(assignedKeys).toEqual(['HR-4']);
    });
  });

  describe('insertRow above/below gets a key', () => {
    it('assigns key when inserting after a row', async () => {
      const existingRowId = '507f1f77bcf86cd799439099';
      let currentKeyNumber = 1;
      const assignedKeys: string[] = [];

      // Setup with an existing row in hierarchy
      const sheet = makeProjectSheet();
      mockSheetFindById.mockResolvedValue(sheet);
      mockWorkspaceFindById.mockResolvedValue(makeWorkspace());
      mockUserFindById.mockReturnValue({
        select: vi.fn().mockResolvedValue(makeUser()),
      });

      // Existing row in hierarchy
      mockRowFind.mockReturnValue({
        sort: vi.fn().mockResolvedValue([
          { _id: existingRowId, order: 0, parentId: null, depth: 0 },
        ]),
      });

      mockRowBulkWrite.mockResolvedValue({ modifiedCount: 0 });

      mockSheetFindOneAndUpdate.mockImplementation(async () => {
        const num = currentKeyNumber++;
        return {
          project: { nextKeyNumber: num, keyPrefix: 'HR' },
        };
      });

      mockRowCreate.mockImplementation(async (data: any) => {
        const key = data.cells?.[KEY_COL_ID];
        if (key) assignedKeys.push(key);
        return {
          _id: data._id,
          ...data,
          toObject: () => data,
        };
      });

      mockRowFindByIdAndUpdate.mockResolvedValue({});

      // Insert after existing row
      await addRow(SHEET_ID, USER_ID, { afterRowId: existingRowId });

      expect(assignedKeys).toHaveLength(1);
      expect(assignedKeys[0]).toBe('HR-1');
    });

    it('assigns key when inserting before a row', async () => {
      const existingRowId = '507f1f77bcf86cd799439099';
      let currentKeyNumber = 1;
      const assignedKeys: string[] = [];

      const sheet = makeProjectSheet();
      mockSheetFindById.mockResolvedValue(sheet);
      mockWorkspaceFindById.mockResolvedValue(makeWorkspace());
      mockUserFindById.mockReturnValue({
        select: vi.fn().mockResolvedValue(makeUser()),
      });

      mockRowFind.mockReturnValue({
        sort: vi.fn().mockResolvedValue([
          { _id: existingRowId, order: 0, parentId: null, depth: 0 },
        ]),
      });

      mockRowBulkWrite.mockResolvedValue({ modifiedCount: 0 });

      mockSheetFindOneAndUpdate.mockImplementation(async () => {
        const num = currentKeyNumber++;
        return {
          project: { nextKeyNumber: num, keyPrefix: 'HR' },
        };
      });

      mockRowCreate.mockImplementation(async (data: any) => {
        const key = data.cells?.[KEY_COL_ID];
        if (key) assignedKeys.push(key);
        return {
          _id: data._id,
          ...data,
          toObject: () => data,
        };
      });

      mockRowFindByIdAndUpdate.mockResolvedValue({});

      // Insert before existing row
      await addRow(SHEET_ID, USER_ID, { beforeRowId: existingRowId });

      expect(assignedKeys).toHaveLength(1);
      expect(assignedKeys[0]).toBe('HR-1');
    });
  });

  describe('blank-row creation gets a key', () => {
    it('assigns key when creating a blank row without cells', async () => {
      let currentKeyNumber = 1;
      const assignedKeys: string[] = [];

      setupDefaultMocks();

      mockSheetFindOneAndUpdate.mockImplementation(async () => {
        const num = currentKeyNumber++;
        return {
          project: { nextKeyNumber: num, keyPrefix: 'HR' },
        };
      });

      mockRowCreate.mockImplementation(async (data: any) => {
        const key = data.cells?.[KEY_COL_ID];
        if (key) assignedKeys.push(key);
        return {
          _id: data._id,
          ...data,
          toObject: () => data,
        };
      });

      mockRowFindByIdAndUpdate.mockResolvedValue({});

      // Create blank row (no cells provided)
      await addRow(SHEET_ID, USER_ID);

      expect(assignedKeys).toHaveLength(1);
      expect(assignedKeys[0]).toBe('HR-1');
    });
  });

  describe('editing a Key cell is rejected', () => {
    it('throws 400 when trying to update a key column', async () => {
      setupDefaultMocks();

      // The key check happens before Row.findById is called, so we just need
      // getSheetWithAccess to succeed (which is handled by setupDefaultMocks)

      await expect(
        updateCell(SHEET_ID, USER_ID, '507f1f77bcf86cd799439050', KEY_COL_ID, 'NEW-KEY'),
      ).rejects.toThrow("Work item keys can't be edited");

      try {
        await updateCell(SHEET_ID, USER_ID, '507f1f77bcf86cd799439050', KEY_COL_ID, 'NEW-KEY');
      } catch (err: any) {
        expect(err.statusCode).toBe(400);
      }
    });
  });

  describe('plain sheets get no keys', () => {
    it('does not call Sheet.findOneAndUpdate for non-project sheets', async () => {
      const plainSheet = makePlainSheet();
      setupDefaultMocks(plainSheet);

      mockRowCreate.mockImplementation(async (data: any) => ({
        _id: data._id,
        ...data,
        toObject: () => data,
      }));

      mockRowFindByIdAndUpdate.mockResolvedValue({});

      await addRow(SHEET_ID, USER_ID);

      // Sheet.findOneAndUpdate should NOT have been called
      expect(mockSheetFindOneAndUpdate).not.toHaveBeenCalled();
    });
  });
});
