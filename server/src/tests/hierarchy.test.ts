import { describe, it, expect } from 'vitest';
import {
  type HierarchyRow,
  insertRow,
  indentRows,
  outdentRows,
  moveRows,
  deleteRows,
  validateHierarchy,
} from '../services/hierarchy';

// ─── Fixture helpers ──────────────────────────────────────────────────────

/** Create a simple flat row. */
function row(id: string, order: number, parentId: string | null = null, depth = 0): HierarchyRow {
  return { id, order, parentId, depth };
}

/** Shorthand for building fixture arrays. */
function rows(...specs: Array<[string, string | null, number]>): HierarchyRow[] {
  return specs.map(([id, parentId, depth], i) => row(id, i, parentId, depth));
}

// ─── BUG 1: indentRows multi-select ──────────────────────────────────────

describe('BUG 1: indentRows([B,C]) with A,B,C,D all top-level', () => {
  it('B and C both become children of A at depth 1; C parent is A, not B', () => {
    const input = rows(
      ['A', null, 0],
      ['B', null, 0],
      ['C', null, 0],
      ['D', null, 0],
    );

    const result = indentRows(input, ['B', 'C']);

    // B should be child of A
    const bRow = result.find((r) => r.id === 'B')!;
    expect(bRow.parentId).toBe('A');
    expect(bRow.depth).toBe(1);

    // C should ALSO be child of A (not B)
    const cRow = result.find((r) => r.id === 'C')!;
    expect(cRow.parentId).toBe('A');
    expect(cRow.depth).toBe(1);

    // Orders are continuous
    expect(result.map((r) => r.order)).toEqual([0, 1, 2, 3]);

    // Validate the whole result
    expect(() => validateHierarchy(result)).not.toThrow();
  });
});

// ─── BUG 2: insertRow after expanded/collapsed parent ────────────────────

describe('BUG 2: insertRow afterRowId with children', () => {
  it('isParentExpanded=true: new row is first child of B', () => {
    // A > B > C (B has child C)
    const input = rows(
      ['A', null, 0],
      ['B', 'A', 1],
      ['C', 'B', 2],
    );

    const result = insertRow(input, 'NEW', { afterRowId: 'B', isParentExpanded: true });

    const newRow = result.find((r) => r.id === 'NEW')!;
    expect(newRow.parentId).toBe('B');
    expect(newRow.depth).toBe(2);
    // New row should be right after B (order 2), before C
    expect(newRow.order).toBe(2);

    // C remains B's child
    const cRow = result.find((r) => r.id === 'C')!;
    expect(cRow.parentId).toBe('B');

    expect(() => validateHierarchy(result)).not.toThrow();
  });

  it('isParentExpanded=false: new row is sibling of B, placed after descendant group', () => {
    // A > B > C (B has child C, collapsed)
    const input = rows(
      ['A', null, 0],
      ['B', 'A', 1],
      ['C', 'B', 2],
    );

    const result = insertRow(input, 'NEW', { afterRowId: 'B', isParentExpanded: false });

    const newRow = result.find((r) => r.id === 'NEW')!;
    // Sibling of B → same parent (A), same depth (1)
    expect(newRow.parentId).toBe('A');
    expect(newRow.depth).toBe(1);
    // Should be after C (the last descendant of B)
    expect(newRow.order).toBe(3);

    // C stays with B
    const cRow = result.find((r) => r.id === 'C')!;
    expect(cRow.parentId).toBe('B');

    expect(() => validateHierarchy(result)).not.toThrow();
  });
});

// ─── BUG 3: insertRow beforeRowId ────────────────────────────────────────

describe('BUG 3: insertRow beforeRowId=C with A>B>C', () => {
  it('new row is at order=2 (directly before C), parent=B, depth=2', () => {
    const input = rows(
      ['A', null, 0],
      ['B', 'A', 1],
      ['C', 'B', 2],
    );

    const result = insertRow(input, 'NEW', { beforeRowId: 'C' });

    const newRow = result.find((r) => r.id === 'NEW')!;
    expect(newRow.order).toBe(2);
    expect(newRow.parentId).toBe('B');
    expect(newRow.depth).toBe(2);

    // C moves to order 3
    const cRow = result.find((r) => r.id === 'C')!;
    expect(cRow.order).toBe(3);

    expect(() => validateHierarchy(result)).not.toThrow();
  });
});

// ─── Single indent ───────────────────────────────────────────────────────

describe('Single indent', () => {
  it('indentRows([B]): B becomes child of A, depth 1', () => {
    const input = rows(
      ['A', null, 0],
      ['B', null, 0],
      ['C', null, 0],
    );

    const result = indentRows(input, ['B']);

    const bRow = result.find((r) => r.id === 'B')!;
    expect(bRow.parentId).toBe('A');
    expect(bRow.depth).toBe(1);

    expect(() => validateHierarchy(result)).not.toThrow();
  });
});

// ─── Mixed selection indent ──────────────────────────────────────────────

describe('Mixed selection indent', () => {
  it('maintains depth parity when indenting mixed rows', () => {
    // A (depth 0), B (child of A, depth 1), C (depth 0, sibling of A)
    const input = rows(
      ['A', null, 0],
      ['B', 'A', 1],
      ['C', null, 0],
    );

    const result = indentRows(input, ['B', 'C']);

    // Both should be children of A (row above the first selected = A)
    const bRow = result.find((r) => r.id === 'B')!;
    const cRow = result.find((r) => r.id === 'C')!;
    expect(bRow.parentId).toBe('A');
    expect(bRow.depth).toBe(1);
    expect(cRow.parentId).toBe('A');
    expect(cRow.depth).toBe(1);

    expect(() => validateHierarchy(result)).not.toThrow();
  });
});

// ─── Outdent child ───────────────────────────────────────────────────────

describe('Outdent child', () => {
  it('outdentRows([B]) where A>B>C: B moves to depth 0, C stays child of B at depth 1', () => {
    const input = rows(
      ['A', null, 0],
      ['B', 'A', 1],
      ['C', 'B', 2],
    );

    const result = outdentRows(input, ['B']);

    const bRow = result.find((r) => r.id === 'B')!;
    expect(bRow.parentId).toBeNull();
    expect(bRow.depth).toBe(0);

    // C should now be depth 1, still child of B
    const cRow = result.find((r) => r.id === 'C')!;
    expect(cRow.parentId).toBe('B');
    expect(cRow.depth).toBe(1);

    expect(() => validateHierarchy(result)).not.toThrow();
  });
});

// ─── Move parent group up ────────────────────────────────────────────────

describe('Move parent group up', () => {
  it('parent and all descendants move; orders are continuous; no orphans', () => {
    // A, B > C, D
    const input = rows(
      ['A', null, 0],
      ['B', null, 0],
      ['C', 'B', 1],
      ['D', null, 0],
    );

    const result = moveRows(input, ['B'], { beforeId: 'A' });

    // B should be before A
    const bRow = result.find((r) => r.id === 'B')!;
    const aRow = result.find((r) => r.id === 'A')!;
    expect(bRow.order).toBeLessThan(aRow.order);

    // C should still be child of B
    const cRow = result.find((r) => r.id === 'C')!;
    expect(cRow.parentId).toBe('B');
    expect(cRow.depth).toBe(1);

    // Orders continuous
    expect(result.map((r) => r.order)).toEqual([0, 1, 2, 3]);
    expect(() => validateHierarchy(result)).not.toThrow();
  });
});

// ─── Move parent group down ──────────────────────────────────────────────

describe('Move parent group down', () => {
  it('parent and all descendants move down correctly', () => {
    // A, B > C, D
    const input = rows(
      ['A', null, 0],
      ['B', null, 0],
      ['C', 'B', 1],
      ['D', null, 0],
    );

    const result = moveRows(input, ['A'], { afterId: 'D' });

    // A should be after D
    const aRow = result.find((r) => r.id === 'A')!;
    const dRow = result.find((r) => r.id === 'D')!;
    expect(aRow.order).toBeGreaterThan(dRow.order);

    expect(() => validateHierarchy(result)).not.toThrow();
  });
});

// ─── Move child to top level ─────────────────────────────────────────────

describe('Move child to top level via moveRows', () => {
  it('depth 0, no parent', () => {
    // A > B > C
    const input = rows(
      ['A', null, 0],
      ['B', 'A', 1],
      ['C', 'B', 2],
    );

    // Move B to end (top level)
    const result = moveRows(input, ['B'], {});

    const bRow = result.find((r) => r.id === 'B')!;
    expect(bRow.parentId).toBeNull();
    expect(bRow.depth).toBe(0);

    // C adjusts relative to B
    const cRow = result.find((r) => r.id === 'C')!;
    expect(cRow.parentId).toBe('B');
    expect(cRow.depth).toBe(1);

    expect(() => validateHierarchy(result)).not.toThrow();
  });
});

// ─── Refuse cycle ────────────────────────────────────────────────────────

describe('Refuse cycle', () => {
  it('move A into its own descendant throws', () => {
    // A > B > C
    const input = rows(
      ['A', null, 0],
      ['B', 'A', 1],
      ['C', 'B', 2],
    );

    // Try to move A after C (its descendant)
    expect(() => moveRows(input, ['A'], { afterId: 'C' })).toThrow();
  });
});

// ─── Delete cascade ──────────────────────────────────────────────────────

describe('Delete parent cascade=true', () => {
  it('parent + all descendants removed; orders renumbered', () => {
    // A > B > C, D
    const input = rows(
      ['A', null, 0],
      ['B', 'A', 1],
      ['C', 'B', 2],
      ['D', null, 0],
    );

    const result = deleteRows(input, ['A'], { cascade: true });

    // Only D should remain
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('D');
    expect(result[0].order).toBe(0);

    expect(() => validateHierarchy(result)).not.toThrow();
  });
});

describe('Delete parent cascade=false', () => {
  it('parent removed, children re-parented to grandparent; orders renumbered', () => {
    // A > B > C, D
    const input = rows(
      ['A', null, 0],
      ['B', 'A', 1],
      ['C', 'B', 2],
      ['D', null, 0],
    );

    const result = deleteRows(input, ['B'], { cascade: false });

    // A, C, D remain
    expect(result.length).toBe(3);
    expect(result.map((r) => r.id)).toEqual(['A', 'C', 'D']);

    // C should now be child of A (grandparent promotion)
    const cRow = result.find((r) => r.id === 'C')!;
    expect(cRow.parentId).toBe('A');
    expect(cRow.depth).toBe(1);

    expect(() => validateHierarchy(result)).not.toThrow();
  });
});

// ─── validateHierarchy catches errors ────────────────────────────────────

describe('validateHierarchy', () => {
  it('catches gap in orders', () => {
    const bad: HierarchyRow[] = [
      { id: 'A', order: 0, parentId: null, depth: 0 },
      { id: 'B', order: 2, parentId: null, depth: 0 }, // gap: missing order 1
    ];
    expect(() => validateHierarchy(bad)).toThrow(/Order gap/);
  });

  it('catches child before parent', () => {
    const bad: HierarchyRow[] = [
      { id: 'B', order: 0, parentId: 'A', depth: 1 },
      { id: 'A', order: 1, parentId: null, depth: 0 },
    ];
    expect(() => validateHierarchy(bad)).toThrow(/appears before its parent/);
  });

  it('catches depth mismatch', () => {
    const bad: HierarchyRow[] = [
      { id: 'A', order: 0, parentId: null, depth: 0 },
      { id: 'B', order: 1, parentId: 'A', depth: 5 }, // should be 1
    ];
    expect(() => validateHierarchy(bad)).toThrow(/expected 1/);
  });

  it('accepts a valid hierarchy', () => {
    const good: HierarchyRow[] = [
      { id: 'A', order: 0, parentId: null, depth: 0 },
      { id: 'B', order: 1, parentId: 'A', depth: 1 },
      { id: 'C', order: 2, parentId: null, depth: 0 },
    ];
    expect(() => validateHierarchy(good)).not.toThrow();
  });

  it('catches non-existent parent reference', () => {
    const bad: HierarchyRow[] = [
      { id: 'A', order: 0, parentId: 'Z', depth: 1 },
    ];
    expect(() => validateHierarchy(bad)).toThrow(/non-existent parent/);
  });

  it('catches root row with non-zero depth', () => {
    const bad: HierarchyRow[] = [
      { id: 'A', order: 0, parentId: null, depth: 3 },
    ];
    expect(() => validateHierarchy(bad)).toThrow(/Root row.*expected 0/);
  });
});

// ─── Additional edge cases ───────────────────────────────────────────────

describe('insertRow edge cases', () => {
  it('append at end with no opts', () => {
    const input = rows(
      ['A', null, 0],
      ['B', null, 0],
    );

    const result = insertRow(input, 'NEW');
    const newRow = result.find((r) => r.id === 'NEW')!;
    expect(newRow.order).toBe(2);
    expect(newRow.parentId).toBeNull();
    expect(newRow.depth).toBe(0);

    expect(() => validateHierarchy(result)).not.toThrow();
  });

  it('insert with explicit parentId', () => {
    const input = rows(
      ['A', null, 0],
      ['B', 'A', 1],
    );

    const result = insertRow(input, 'NEW', { parentId: 'A' });
    const newRow = result.find((r) => r.id === 'NEW')!;
    expect(newRow.parentId).toBe('A');
    expect(newRow.depth).toBe(1);
    // Should be after B (last descendant of A)
    expect(newRow.order).toBe(2);

    expect(() => validateHierarchy(result)).not.toThrow();
  });
});

describe('outdentRows edge cases', () => {
  it('rows already at depth 0 are left unchanged', () => {
    const input = rows(
      ['A', null, 0],
      ['B', null, 0],
    );

    const result = outdentRows(input, ['A', 'B']);
    const aRow = result.find((r) => r.id === 'A')!;
    const bRow = result.find((r) => r.id === 'B')!;
    expect(aRow.parentId).toBeNull();
    expect(aRow.depth).toBe(0);
    expect(bRow.parentId).toBeNull();
    expect(bRow.depth).toBe(0);

    expect(() => validateHierarchy(result)).not.toThrow();
  });
});

describe('deleteRows edge cases', () => {
  it('deleting a leaf row with cascade=true removes only that row', () => {
    const input = rows(
      ['A', null, 0],
      ['B', 'A', 1],
      ['C', 'A', 1],
    );

    const result = deleteRows(input, ['B'], { cascade: true });
    expect(result.length).toBe(2);
    expect(result.map((r) => r.id)).toEqual(['A', 'C']);
    expect(() => validateHierarchy(result)).not.toThrow();
  });

  it('deleting multiple roots with cascade=false re-parents their children', () => {
    // X > Y, A > B
    const input = rows(
      ['X', null, 0],
      ['Y', 'X', 1],
      ['A', null, 0],
      ['B', 'A', 1],
    );

    const result = deleteRows(input, ['X', 'A'], { cascade: false });
    expect(result.length).toBe(2);
    expect(result.map((r) => r.id)).toEqual(['Y', 'B']);

    const yRow = result.find((r) => r.id === 'Y')!;
    expect(yRow.parentId).toBeNull();
    expect(yRow.depth).toBe(0);

    const bRow = result.find((r) => r.id === 'B')!;
    expect(bRow.parentId).toBeNull();
    expect(bRow.depth).toBe(0);

    expect(() => validateHierarchy(result)).not.toThrow();
  });
});
