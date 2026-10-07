import { describe, it, expect } from 'vitest';
import { groupMyWorkItems, isRowCompleted } from '../services/myWorkService';
import type { MyWorkItem } from '../services/myWorkService';
import type { ColumnDef } from '../models/Sheet';
import { computeAssigneeIds } from '../services/rowService';

// ─── Test helpers ────────────────────────────────────────────────────────────────

function makeItem(overrides: Partial<MyWorkItem> = {}): MyWorkItem {
  return {
    rowId: overrides.rowId ?? '507f1f77bcf86cd799439001',
    taskName: overrides.taskName ?? 'Test Task',
    sheetId: overrides.sheetId ?? '507f1f77bcf86cd799439002',
    sheetName: overrides.sheetName ?? 'Test Sheet',
    workspaceName: overrides.workspaceName ?? 'Test Workspace',
    status: overrides.status ?? null,
    dueDate: overrides.dueDate ?? null,
  };
}

/** Returns a UTC date string for the given offset in days from `base`. */
function utcDateOffset(base: Date, days: number): string {
  const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

// ─── groupMyWorkItems tests ──────────────────────────────────────────────────────

describe('groupMyWorkItems', () => {
  // Fixed "now" for deterministic tests: 2025-06-15T12:00:00Z (Sunday)
  const NOW = new Date('2025-06-15T12:00:00Z');

  it('items with past due dates appear in overdue', () => {
    const items = [
      makeItem({ rowId: '1', dueDate: utcDateOffset(NOW, -3) }),
      makeItem({ rowId: '2', dueDate: utcDateOffset(NOW, -1) }),
    ];
    const result = groupMyWorkItems(items, NOW);
    expect(result.overdue.items).toHaveLength(2);
    expect(result.overdue.total).toBe(2);
    expect(result.overdue.items[0].rowId).toBe('1');
    expect(result.overdue.items[1].rowId).toBe('2');
  });

  it('items with today\'s date appear in dueToday', () => {
    const items = [
      makeItem({ rowId: '1', dueDate: utcDateOffset(NOW, 0) }),
    ];
    const result = groupMyWorkItems(items, NOW);
    expect(result.dueToday.items).toHaveLength(1);
    expect(result.dueToday.total).toBe(1);
    expect(result.dueToday.items[0].rowId).toBe('1');
  });

  it('items with a due date in the next 7 days appear in dueThisWeek', () => {
    const items = [
      makeItem({ rowId: '1', dueDate: utcDateOffset(NOW, 1) }),
      makeItem({ rowId: '2', dueDate: utcDateOffset(NOW, 3) }),
      makeItem({ rowId: '3', dueDate: utcDateOffset(NOW, 6) }),
    ];
    const result = groupMyWorkItems(items, NOW);
    expect(result.dueThisWeek.items).toHaveLength(3);
    expect(result.dueThisWeek.total).toBe(3);
  });

  it('items with further dates appear in later', () => {
    const items = [
      makeItem({ rowId: '1', dueDate: utcDateOffset(NOW, 7) }),
      makeItem({ rowId: '2', dueDate: utcDateOffset(NOW, 30) }),
    ];
    const result = groupMyWorkItems(items, NOW);
    expect(result.later.items).toHaveLength(2);
    expect(result.later.total).toBe(2);
  });

  it('items with no due date appear in noDueDate', () => {
    const items = [
      makeItem({ rowId: '1', dueDate: null }),
      makeItem({ rowId: '2', dueDate: null }),
    ];
    const result = groupMyWorkItems(items, NOW);
    expect(result.noDueDate.items).toHaveLength(2);
    expect(result.noDueDate.total).toBe(2);
  });

  it('items are sorted by dueDate ascending within each group', () => {
    const items = [
      makeItem({ rowId: 'c', dueDate: utcDateOffset(NOW, -1) }),
      makeItem({ rowId: 'a', dueDate: utcDateOffset(NOW, -5) }),
      makeItem({ rowId: 'b', dueDate: utcDateOffset(NOW, -3) }),
    ];
    const result = groupMyWorkItems(items, NOW);
    expect(result.overdue.items.map((i) => i.rowId)).toEqual(['a', 'b', 'c']);
  });

  it('noDueDate items are sorted by taskName', () => {
    const items = [
      makeItem({ rowId: '1', taskName: 'Zebra', dueDate: null }),
      makeItem({ rowId: '2', taskName: 'Alpha', dueDate: null }),
      makeItem({ rowId: '3', taskName: 'Middle', dueDate: null }),
    ];
    const result = groupMyWorkItems(items, NOW);
    expect(result.noDueDate.items.map((i) => i.taskName)).toEqual(['Alpha', 'Middle', 'Zebra']);
  });

  it('groups are capped at 50 items each', () => {
    const items: MyWorkItem[] = [];
    for (let i = 0; i < 60; i++) {
      items.push(makeItem({ rowId: String(i), dueDate: null }));
    }
    const result = groupMyWorkItems(items, NOW);
    expect(result.noDueDate.items).toHaveLength(50);
    expect(result.noDueDate.total).toBe(60);
  });

  it('empty input produces empty groups', () => {
    const result = groupMyWorkItems([], NOW);
    expect(result.overdue.items).toHaveLength(0);
    expect(result.dueToday.items).toHaveLength(0);
    expect(result.dueThisWeek.items).toHaveLength(0);
    expect(result.later.items).toHaveLength(0);
    expect(result.noDueDate.items).toHaveLength(0);
  });

  it('correctly distributes items across all 5 buckets', () => {
    const items = [
      makeItem({ rowId: 'overdue', dueDate: utcDateOffset(NOW, -2) }),
      makeItem({ rowId: 'today', dueDate: utcDateOffset(NOW, 0) }),
      makeItem({ rowId: 'thisweek', dueDate: utcDateOffset(NOW, 3) }),
      makeItem({ rowId: 'later', dueDate: utcDateOffset(NOW, 14) }),
      makeItem({ rowId: 'nodate', dueDate: null }),
    ];
    const result = groupMyWorkItems(items, NOW);
    expect(result.overdue.items).toHaveLength(1);
    expect(result.dueToday.items).toHaveLength(1);
    expect(result.dueThisWeek.items).toHaveLength(1);
    expect(result.later.items).toHaveLength(1);
    expect(result.noDueDate.items).toHaveLength(1);
  });
});

// ─── isRowCompleted tests ────────────────────────────────────────────────────────

describe('isRowCompleted', () => {
  function makeCol(overrides: Partial<ColumnDef> & { id: string; name: string; type: ColumnDef['type'] }): ColumnDef {
    return {
      order: 0,
      isPrimary: false,
      ...overrides,
    };
  }

  it('returns true when checkbox column named "Done" is true', () => {
    const columns = [makeCol({ id: 'c1', name: 'Done', type: 'checkbox' })];
    const row = { cells: { c1: true } };
    expect(isRowCompleted(row, columns)).toBe(true);
  });

  it('returns true when checkbox column named "Complete" is true', () => {
    const columns = [makeCol({ id: 'c1', name: 'Complete', type: 'checkbox' })];
    const row = { cells: { c1: true } };
    expect(isRowCompleted(row, columns)).toBe(true);
  });

  it('returns false when checkbox column named "Done" is false', () => {
    const columns = [makeCol({ id: 'c1', name: 'Done', type: 'checkbox' })];
    const row = { cells: { c1: false } };
    expect(isRowCompleted(row, columns)).toBe(false);
  });

  it('returns true when status dropdown value is "Complete"', () => {
    const columns = [makeCol({ id: 'c1', name: 'Status', type: 'dropdown', options: [{ label: 'Complete', color: 'green' }] })];
    const row = { cells: { c1: 'Complete' } };
    expect(isRowCompleted(row, columns)).toBe(true);
  });

  it('returns true when status dropdown value is "Done"', () => {
    const columns = [makeCol({ id: 'c1', name: 'Status', type: 'dropdown', options: [{ label: 'Done', color: 'green' }] })];
    const row = { cells: { c1: 'Done' } };
    expect(isRowCompleted(row, columns)).toBe(true);
  });

  it('returns false when status dropdown value is "In Progress"', () => {
    const columns = [makeCol({ id: 'c1', name: 'Status', type: 'dropdown', options: [{ label: 'In Progress', color: 'blue' }] })];
    const row = { cells: { c1: 'In Progress' } };
    expect(isRowCompleted(row, columns)).toBe(false);
  });

  it('returns false when there are no matching columns', () => {
    const columns = [makeCol({ id: 'c1', name: 'Title', type: 'text' })];
    const row = { cells: { c1: 'Some text' } };
    expect(isRowCompleted(row, columns)).toBe(false);
  });

  it('returns false when checkbox "Done" cell is missing', () => {
    const columns = [makeCol({ id: 'c1', name: 'Done', type: 'checkbox' })];
    const row = { cells: {} };
    expect(isRowCompleted(row, columns)).toBe(false);
  });

  it('handles case-insensitive column name matching', () => {
    const columns = [makeCol({ id: 'c1', name: 'DONE', type: 'checkbox' })];
    const row = { cells: { c1: true } };
    expect(isRowCompleted(row, columns)).toBe(true);
  });

  it('handles string "true" in checkbox cell', () => {
    const columns = [makeCol({ id: 'c1', name: 'Done', type: 'checkbox' })];
    const row = { cells: { c1: 'true' } };
    expect(isRowCompleted(row, columns)).toBe(true);
  });
});

// ─── computeAssigneeIds tests ────────────────────────────────────────────────────

describe('computeAssigneeIds', () => {
  function makeCol(id: string, type: ColumnDef['type']): ColumnDef {
    return { id, name: `Col ${id}`, type, order: 0, isPrimary: false };
  }

  it('extracts user IDs from a single contact column with an array value', () => {
    const columns = [
      makeCol('col1', 'contact'),
      makeCol('col2', 'contact'),
      makeCol('col3', 'text'),
    ];
    const cells = { col1: ['507f1f77bcf86cd799439001', '507f1f77bcf86cd799439002'], col2: [] };
    const result = computeAssigneeIds(cells, columns);
    const ids = result.map((oid) => oid.toString());
    expect(ids).toContain('507f1f77bcf86cd799439001');
    expect(ids).toContain('507f1f77bcf86cd799439002');
    expect(ids).toHaveLength(2);
  });

  it('deduplicates across multiple contact columns', () => {
    const columns = [
      makeCol('col1', 'contact'),
      makeCol('col2', 'contact'),
    ];
    const cells = {
      col1: ['507f1f77bcf86cd799439001', '507f1f77bcf86cd799439002'],
      col2: ['507f1f77bcf86cd799439002', '507f1f77bcf86cd799439003'],
    };
    const result = computeAssigneeIds(cells, columns);
    expect(result).toHaveLength(3);
  });

  it('ignores non-contact columns', () => {
    const columns = [
      makeCol('col1', 'contact'),
      makeCol('col2', 'text'),
      makeCol('col3', 'dropdown'),
    ];
    const cells = { col1: ['507f1f77bcf86cd799439001'], col2: 'some text', col3: 'option1' };
    const result = computeAssigneeIds(cells, columns);
    expect(result).toHaveLength(1);
  });

  it('returns empty array when no contact columns exist', () => {
    const columns = [
      makeCol('col1', 'text'),
      makeCol('col2', 'number'),
    ];
    const cells = { col1: 'hello', col2: 42 };
    const result = computeAssigneeIds(cells, columns);
    expect(result).toHaveLength(0);
  });

  it('handles null and missing cell values gracefully', () => {
    const columns = [makeCol('col1', 'contact')];
    const cells = {};
    const result = computeAssigneeIds(cells, columns);
    expect(result).toHaveLength(0);
  });

  it('handles clearing all contact values', () => {
    const columns = [makeCol('col1', 'contact')];
    const cells = { col1: null };
    const result = computeAssigneeIds(cells, columns);
    expect(result).toHaveLength(0);
  });

  it('handles object-with-id format in contact cells', () => {
    const columns = [makeCol('col1', 'contact')];
    const cells = { col1: [{ id: '507f1f77bcf86cd799439011' }, { id: '507f1f77bcf86cd799439012' }] };
    const result = computeAssigneeIds(cells, columns);
    expect(result).toHaveLength(2);
  });
});

// ─── My Work grouping determinism (assigneeIds query invariant) ──────────────────

describe('groupMyWorkItems determinism', () => {
  const NOW = new Date('2025-06-15T12:00:00Z');

  it('produces the same groups regardless of input order', () => {
    const items: MyWorkItem[] = [
      makeItem({ rowId: 'a', taskName: 'Alpha', dueDate: utcDateOffset(NOW, -2) }),
      makeItem({ rowId: 'b', taskName: 'Beta', dueDate: utcDateOffset(NOW, 0) }),
      makeItem({ rowId: 'c', taskName: 'Gamma', dueDate: utcDateOffset(NOW, 3) }),
      makeItem({ rowId: 'd', taskName: 'Delta', dueDate: utcDateOffset(NOW, 14) }),
      makeItem({ rowId: 'e', taskName: 'Epsilon', dueDate: null }),
    ];

    const resultForward = groupMyWorkItems(items, NOW);
    const resultReverse = groupMyWorkItems([...items].reverse(), NOW);

    // Same totals
    expect(resultForward.overdue.total).toBe(resultReverse.overdue.total);
    expect(resultForward.dueToday.total).toBe(resultReverse.dueToday.total);
    expect(resultForward.dueThisWeek.total).toBe(resultReverse.dueThisWeek.total);
    expect(resultForward.later.total).toBe(resultReverse.later.total);
    expect(resultForward.noDueDate.total).toBe(resultReverse.noDueDate.total);

    // Same row IDs in each group
    expect(resultForward.overdue.items.map((i) => i.rowId))
      .toEqual(resultReverse.overdue.items.map((i) => i.rowId));
    expect(resultForward.dueToday.items.map((i) => i.rowId))
      .toEqual(resultReverse.dueToday.items.map((i) => i.rowId));
  });
});
