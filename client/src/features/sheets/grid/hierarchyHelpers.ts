import type { GridRow } from '@/types';

/** Row enriched with hierarchy metadata. */
export interface HierarchyRow extends GridRow {
  childCount: number;
  hasChildren: boolean;
}

/**
 * Annotates rows with childCount and hasChildren.
 */
export function buildHierarchy(rows: GridRow[]): HierarchyRow[] {
  const childCountMap = new Map<string, number>();
  for (const row of rows) {
    if (row.parentId) {
      childCountMap.set(row.parentId, (childCountMap.get(row.parentId) ?? 0) + 1);
    }
  }
  return rows.map((row) => ({
    ...row,
    childCount: childCountMap.get(row.id) ?? 0,
    hasChildren: (childCountMap.get(row.id) ?? 0) > 0,
  }));
}

/**
 * Returns all descendant IDs of a given row (BFS).
 */
export function getDescendantIds(rows: GridRow[], rowId: string): string[] {
  const childMap = new Map<string, string[]>();
  for (const row of rows) {
    if (row.parentId) {
      if (!childMap.has(row.parentId)) childMap.set(row.parentId, []);
      childMap.get(row.parentId)!.push(row.id);
    }
  }

  const result: string[] = [];
  const queue = [rowId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const children = childMap.get(current) || [];
    for (const childId of children) {
      result.push(childId);
      queue.push(childId);
    }
  }
  return result;
}

/**
 * Filters rows to only those visible given the set of collapsed parent IDs.
 * A row is hidden if any of its ancestors is collapsed.
 */
export function getVisibleRows(rows: GridRow[], collapsedIds: Set<string>): GridRow[] {
  if (collapsedIds.size === 0) return rows;

  // Build parent→children map
  const childMap = new Map<string, string[]>();
  for (const row of rows) {
    if (row.parentId) {
      if (!childMap.has(row.parentId)) childMap.set(row.parentId, []);
      childMap.get(row.parentId)!.push(row.id);
    }
  }

  // Collect all hidden row IDs (descendants of collapsed rows)
  const hiddenIds = new Set<string>();
  for (const collapsedId of collapsedIds) {
    const descendants = getDescendantIds(rows, collapsedId);
    for (const d of descendants) {
      hiddenIds.add(d);
    }
  }

  return rows.filter((row) => !hiddenIds.has(row.id));
}

/**
 * Traverses parentId chain to compute depth.
 */
export function getRowDepth(rows: GridRow[], rowId: string): number {
  const rowMap = new Map(rows.map((r) => [r.id, r]));
  let depth = 0;
  let current = rowMap.get(rowId);
  while (current?.parentId) {
    depth++;
    current = rowMap.get(current.parentId);
  }
  return depth;
}

/**
 * Returns true if the row can be indented (there is a row immediately above at same or deeper level).
 */
export function canIndent(rows: GridRow[], rowId: string): boolean {
  const idx = rows.findIndex((r) => r.id === rowId);
  if (idx <= 0) return false;
  const aboveRow = rows[idx - 1];
  const currentRow = rows[idx];
  const aboveDepth = aboveRow.depth ?? 0;
  const currentDepth = currentRow.depth ?? 0;
  // Can indent if above row is at same or deeper level
  if (aboveDepth < currentDepth) return false;
  // Check max depth
  if (aboveDepth + 1 > 10) return false;
  return true;
}

/**
 * Returns true if the row can be outdented (has a parent).
 */
export function canOutdent(rows: GridRow[], rowId: string): boolean {
  const row = rows.find((r) => r.id === rowId);
  return !!row?.parentId;
}

/**
 * Computes the depth to use when inserting above/below a reference row.
 */
export function computeInsertDepth(
  rows: GridRow[],
  referenceRowId: string,
  position: 'above' | 'below',
): number {
  const refRow = rows.find((r) => r.id === referenceRowId);
  if (!refRow) return 0;
  return refRow.depth ?? 0;
}

/**
 * Returns all parent IDs in the row list (rows that have children).
 */
export function getAllParentIds(rows: GridRow[]): string[] {
  const parentIds = new Set<string>();
  for (const row of rows) {
    if (row.parentId) {
      parentIds.add(row.parentId);
    }
  }
  return [...parentIds];
}
