/**
 * Pure hierarchy operations on sorted row arrays.
 * No database, Mongoose, or Express imports — works only on plain objects.
 */

// ─── Types ────────────────────────────────────────────────────────────────

export interface HierarchyRow {
  id: string;
  order: number;
  parentId: string | null;
  depth: number;
}

const MAX_DEPTH = 10;

// ─── Validation ───────────────────────────────────────────────────────────

/**
 * Throws a descriptive Error if any hierarchy invariant is violated.
 */
export function validateHierarchy(rows: HierarchyRow[]): void {
  const idSet = new Set<string>();

  // 1. Orders are 0, 1, 2, … with no gaps and no duplicates
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].order !== i) {
      throw new Error(
        `Order gap/duplicate at index ${i}: expected order=${i}, got order=${rows[i].order}`,
      );
    }
    if (idSet.has(rows[i].id)) {
      throw new Error(`Duplicate row id: ${rows[i].id}`);
    }
    idSet.add(rows[i].id);
  }

  // 6. depth <= MAX_DEPTH
  for (const row of rows) {
    if (row.depth > MAX_DEPTH) {
      throw new Error(`Row ${row.id} has depth ${row.depth}, exceeds max ${MAX_DEPTH}`);
    }
  }

  // 2. Every parentId references a row that exists in the list
  for (const row of rows) {
    if (row.parentId !== null && !idSet.has(row.parentId)) {
      throw new Error(`Row ${row.id} references non-existent parent ${row.parentId}`);
    }
  }

  // 3. Every parent appears before its children (lower order index)
  const orderMap = new Map<string, number>(rows.map((r) => [r.id, r.order]));
  for (const row of rows) {
    if (row.parentId !== null) {
      const parentOrder = orderMap.get(row.parentId)!;
      if (parentOrder >= row.order) {
        throw new Error(
          `Row ${row.id} (order=${row.order}) appears before its parent ${row.parentId} (order=${parentOrder})`,
        );
      }
    }
  }

  // 4. depth === parent.depth + 1 for every non-root row; root rows have depth 0
  const depthMap = new Map<string, number>(rows.map((r) => [r.id, r.depth]));
  for (const row of rows) {
    if (row.parentId === null) {
      if (row.depth !== 0) {
        throw new Error(`Root row ${row.id} has depth ${row.depth}, expected 0`);
      }
    } else {
      const parentDepth = depthMap.get(row.parentId)!;
      if (row.depth !== parentDepth + 1) {
        throw new Error(
          `Row ${row.id} has depth ${row.depth}, expected ${parentDepth + 1} (parent ${row.parentId} depth=${parentDepth})`,
        );
      }
    }
  }

  // 5. No cycles
  for (const row of rows) {
    const visited = new Set<string>([row.id]);
    let current = row.parentId;
    while (current !== null) {
      if (visited.has(current)) {
        throw new Error(`Cycle detected: row ${row.id} is its own ancestor via ${current}`);
      }
      visited.add(current);
      const parentRow = rows.find((r) => r.id === current);
      current = parentRow?.parentId ?? null;
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Renumber orders as 0, 1, 2, … continuously. Returns a new array. */
function renumber(rows: HierarchyRow[]): HierarchyRow[] {
  return rows.map((r, i) => ({ ...r, order: i }));
}

/** Collect all descendant IDs of a given row by BFS. */
function getDescendantIds(rows: HierarchyRow[], rowId: string): string[] {
  const childMap = buildChildMap(rows);
  const result: string[] = [];
  const queue = [rowId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const children = childMap.get(current) || [];
    for (const cid of children) {
      result.push(cid);
      queue.push(cid);
    }
  }
  return result;
}

function buildChildMap(rows: HierarchyRow[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const r of rows) {
    if (r.parentId !== null) {
      if (!map.has(r.parentId)) map.set(r.parentId, []);
      map.get(r.parentId)!.push(r.id);
    }
  }
  return map;
}

/** Recursively adjust depths for all descendants of a row whose depth changed. */
function adjustDescendantDepths(
  rows: HierarchyRow[],
  parentId: string,
  newParentDepth: number,
): HierarchyRow[] {
  const childMap = buildChildMap(rows);
  const result = [...rows];
  const rowIdxMap = new Map(result.map((r, i) => [r.id, i]));

  const queue: Array<{ id: string; expectedDepth: number }> = [];
  const children = childMap.get(parentId) || [];
  for (const cid of children) {
    queue.push({ id: cid, expectedDepth: newParentDepth + 1 });
  }

  while (queue.length > 0) {
    const { id, expectedDepth } = queue.shift()!;
    const idx = rowIdxMap.get(id);
    if (idx === undefined) continue;
    result[idx] = { ...result[idx], depth: expectedDepth };
    const grandChildren = childMap.get(id) || [];
    for (const gcId of grandChildren) {
      queue.push({ id: gcId, expectedDepth: expectedDepth + 1 });
    }
  }

  return result;
}

// ─── insertRow ────────────────────────────────────────────────────────────

interface InsertOpts {
  beforeRowId?: string;
  afterRowId?: string;
  parentId?: string | null;
  isParentExpanded?: boolean;
}

/**
 * Insert a new row into the sorted list. Returns a new sorted array.
 */
export function insertRow(
  rows: HierarchyRow[],
  newId: string,
  opts: InsertOpts = {},
): HierarchyRow[] {
  const rowMap = new Map(rows.map((r) => [r.id, r]));
  let parentId: string | null = null;
  let depth = 0;
  let insertIndex: number;

  if (opts.beforeRowId) {
    // BUG 3 FIX: place new row directly above the reference row, same parent/depth
    const refRow = rowMap.get(opts.beforeRowId);
    if (!refRow) throw new Error(`Reference row ${opts.beforeRowId} not found`);
    parentId = refRow.parentId ?? null;
    depth = refRow.depth;
    insertIndex = refRow.order;
  } else if (opts.afterRowId) {
    const refRow = rowMap.get(opts.afterRowId);
    if (!refRow) throw new Error(`Reference row ${opts.afterRowId} not found`);

    const childMap = buildChildMap(rows);
    const refHasChildren = (childMap.get(refRow.id) || []).length > 0;

    if (opts.isParentExpanded && refHasChildren) {
      // BUG 2 FIX: insert as first child of expanded parent
      if (refRow.depth >= MAX_DEPTH) {
        throw new Error(`Maximum nesting depth of ${MAX_DEPTH} exceeded`);
      }
      parentId = refRow.id;
      depth = refRow.depth + 1;
      insertIndex = refRow.order + 1;
    } else {
      // BUG 2 FIX: sibling after the reference row's entire descendant group
      parentId = refRow.parentId ?? null;
      depth = refRow.depth;
      // Scan past all descendants
      let lastIdx = refRow.order;
      for (let i = refRow.order + 1; i < rows.length; i++) {
        if (rows[i].depth > refRow.depth) {
          lastIdx = i;
        } else {
          break;
        }
      }
      insertIndex = lastIdx + 1;
    }
  } else if (opts.parentId !== undefined && opts.parentId !== null) {
    // Explicit parentId — append as last child of that parent
    const parentRow = rowMap.get(opts.parentId);
    if (!parentRow) throw new Error(`Parent row ${opts.parentId} not found`);
    if (parentRow.depth >= MAX_DEPTH) {
      throw new Error(`Maximum nesting depth of ${MAX_DEPTH} exceeded`);
    }
    parentId = opts.parentId;
    depth = parentRow.depth + 1;
    // Find end of parent's descendant group
    let lastIdx = parentRow.order;
    for (let i = parentRow.order + 1; i < rows.length; i++) {
      if (rows[i].depth > parentRow.depth) {
        lastIdx = i;
      } else {
        break;
      }
    }
    insertIndex = lastIdx + 1;
  } else {
    // Append at end, depth 0
    insertIndex = rows.length;
  }

  const newRow: HierarchyRow = { id: newId, order: 0, parentId, depth };
  const result = [...rows];
  result.splice(insertIndex, 0, newRow);
  return renumber(result);
}

// ─── indentRows ───────────────────────────────────────────────────────────

/**
 * BUG 1 FIX: Indent multiple rows so they ALL become children of the SAME
 * shared parent (the row immediately above the FIRST selected row).
 */
export function indentRows(rows: HierarchyRow[], rowIds: string[]): HierarchyRow[] {
  if (rowIds.length === 0) return [...rows];

  const rowMap = new Map(rows.map((r) => [r.id, r]));

  // Sort rowIds by current order to process top-to-bottom
  const sortedIds = [...rowIds].sort((a, b) => {
    const ra = rowMap.get(a);
    const rb = rowMap.get(b);
    return (ra?.order ?? 0) - (rb?.order ?? 0);
  });

  // Find the new parent: the row immediately above the FIRST row in the selection
  const firstRow = rowMap.get(sortedIds[0]);
  if (!firstRow || firstRow.order <= 0) return [...rows];

  const aboveRow = rows[firstRow.order - 1];
  if (!aboveRow) return [...rows];

  const newParentId = aboveRow.id;
  const newDepth = aboveRow.depth + 1;

  if (newDepth > MAX_DEPTH) {
    throw new Error(`Maximum nesting depth of ${MAX_DEPTH} would be exceeded`);
  }

  // Check cycle: new parent must not be a descendant of any indented row
  for (const rid of sortedIds) {
    const descendants = getDescendantIds(rows, rid);
    if (descendants.includes(newParentId)) {
      throw new Error(`Cannot indent: would create a cycle (parent ${newParentId} is a descendant of ${rid})`);
    }
  }

  let result = [...rows];
  const rowIdxMap = new Map(result.map((r, i) => [r.id, i]));

  for (const rid of sortedIds) {
    const idx = rowIdxMap.get(rid);
    if (idx === undefined) continue;
    result[idx] = { ...result[idx], parentId: newParentId, depth: newDepth };
  }

  // Recursively adjust descendants of each indented row
  for (const rid of sortedIds) {
    result = adjustDescendantDepths(result, rid, newDepth);
  }

  // Verify max depth for all adjusted descendants
  for (const r of result) {
    if (r.depth > MAX_DEPTH) {
      throw new Error(`Indenting would push row ${r.id} to depth ${r.depth}, exceeding max ${MAX_DEPTH}`);
    }
  }

  return renumber(result);
}

// ─── outdentRows ──────────────────────────────────────────────────────────

/**
 * Outdent rows — each moves up one level in the hierarchy.
 */
export function outdentRows(rows: HierarchyRow[], rowIds: string[]): HierarchyRow[] {
  if (rowIds.length === 0) return [...rows];

  const rowMap = new Map(rows.map((r) => [r.id, r]));
  let result = [...rows];
  const rowIdxMap = new Map(result.map((r, i) => [r.id, i]));

  for (const rid of rowIds) {
    const idx = rowIdxMap.get(rid);
    if (idx === undefined) continue;
    const row = result[idx];
    if (row.parentId === null || row.depth === 0) continue; // Already top-level

    const parentRow = rowMap.get(row.parentId);
    const grandparentId = parentRow?.parentId ?? null;
    const newDepth = Math.max(0, row.depth - 1);

    result[idx] = { ...result[idx], parentId: grandparentId, depth: newDepth };

    // Adjust descendants
    result = adjustDescendantDepths(result, rid, newDepth);
  }

  return renumber(result);
}

// ─── moveRows ─────────────────────────────────────────────────────────────

interface MoveOpts {
  afterId?: string;
  beforeId?: string;
}

/**
 * Move a group of rows (and their descendants) to a new position.
 */
export function moveRows(
  rows: HierarchyRow[],
  movedIds: string[],
  opts: MoveOpts = {},
): HierarchyRow[] {
  if (movedIds.length === 0) return [...rows];

  const rowMap = new Map(rows.map((r) => [r.id, r]));

  // Collect moved group: movedIds + all their descendants (BFS)
  const movedSet = new Set<string>(movedIds);
  for (const mid of movedIds) {
    const descs = getDescendantIds(rows, mid);
    for (const d of descs) {
      movedSet.add(d);
    }
  }

  // Cycle check: target must not be inside the moved group
  if (opts.afterId && movedSet.has(opts.afterId)) {
    throw new Error('Cannot move a row into its own descendant group');
  }
  if (opts.beforeId && movedSet.has(opts.beforeId)) {
    throw new Error('Cannot move a row into its own descendant group');
  }

  // Separate moved rows (preserving relative order) from remaining rows
  const movedRows: HierarchyRow[] = [];
  const remainingRows: HierarchyRow[] = [];
  for (const r of rows) {
    if (movedSet.has(r.id)) {
      movedRows.push(r);
    } else {
      remainingRows.push(r);
    }
  }

  // Determine landing level
  let newParentId: string | null = null;
  let newDepth = 0;

  if (opts.beforeId) {
    const targetRow = rowMap.get(opts.beforeId);
    if (!targetRow) throw new Error(`Target row ${opts.beforeId} not found`);
    newParentId = targetRow.parentId ?? null;
    newDepth = targetRow.depth;
  } else if (opts.afterId) {
    const targetRow = rowMap.get(opts.afterId);
    if (!targetRow) throw new Error(`Target row ${opts.afterId} not found`);

    // Check if target has children and is "expanded" (we treat it as expanded for moves)
    const childMap = buildChildMap(rows);
    const targetHasChildren = (childMap.get(targetRow.id) || []).length > 0;

    if (targetHasChildren) {
      // Insert as first child
      if (targetRow.depth >= MAX_DEPTH) {
        throw new Error(`Maximum nesting depth of ${MAX_DEPTH} exceeded`);
      }
      newParentId = targetRow.id;
      newDepth = targetRow.depth + 1;
    } else {
      // Sibling after target
      newParentId = targetRow.parentId ?? null;
      newDepth = targetRow.depth;
    }
  } else {
    // Append at end
    newParentId = null;
    newDepth = 0;
  }

  // Compute depth delta for the moved roots
  const depthDeltas = new Map<string, number>();
  for (const mid of movedIds) {
    const origRow = rowMap.get(mid);
    if (!origRow) continue;
    depthDeltas.set(mid, newDepth - origRow.depth);
  }

  // Apply depth adjustments to moved rows
  const adjustedMovedRows: HierarchyRow[] = [];
  for (const mr of movedRows) {
    // Find which moved root this row descends from (or is itself)
    let delta = 0;
    if (depthDeltas.has(mr.id)) {
      delta = depthDeltas.get(mr.id)!;
    } else {
      // It's a descendant — find the root ancestor in movedIds
      let current = mr.parentId;
      while (current !== null) {
        if (depthDeltas.has(current)) {
          delta = depthDeltas.get(current)!;
          break;
        }
        const parentRow = rowMap.get(current);
        current = parentRow?.parentId ?? null;
      }
    }

    const adjustedDepth = Math.max(0, mr.depth + delta);
    if (adjustedDepth > MAX_DEPTH) {
      throw new Error(`Move would push row ${mr.id} to depth ${adjustedDepth}, exceeding max ${MAX_DEPTH}`);
    }

    // For root moved rows, set parentId directly
    if (movedIds.includes(mr.id)) {
      adjustedMovedRows.push({ ...mr, parentId: newParentId, depth: newDepth });
    } else {
      adjustedMovedRows.push({ ...mr, depth: adjustedDepth });
    }
  }

  // Determine insertion point in remaining rows
  let insertIdx: number;
  if (opts.beforeId) {
    const targetInRemaining = remainingRows.findIndex((r) => r.id === opts.beforeId);
    insertIdx = targetInRemaining === -1 ? remainingRows.length : targetInRemaining;
  } else if (opts.afterId) {
    const targetInRemaining = remainingRows.findIndex((r) => r.id === opts.afterId);
    if (targetInRemaining === -1) {
      insertIdx = remainingRows.length;
    } else {
      // After the target and its remaining descendants
      const targetRow = rowMap.get(opts.afterId)!;
      let lastIdx = targetInRemaining;
      for (let i = targetInRemaining + 1; i < remainingRows.length; i++) {
        if (remainingRows[i].depth > targetRow.depth) {
          lastIdx = i;
        } else {
          break;
        }
      }
      insertIdx = lastIdx + 1;
    }
  } else {
    insertIdx = remainingRows.length;
  }

  const result = [...remainingRows];
  result.splice(insertIdx, 0, ...adjustedMovedRows);
  return renumber(result);
}

// ─── deleteRows ───────────────────────────────────────────────────────────

interface DeleteOpts {
  cascade: boolean;
}

/**
 * Delete rows. If cascade=true, also delete all descendants.
 * If cascade=false, re-parent direct children to the deleted row's parent.
 */
export function deleteRows(
  rows: HierarchyRow[],
  rowIds: string[],
  opts: DeleteOpts,
): HierarchyRow[] {
  if (rowIds.length === 0) return [...rows];

  const rowMap = new Map(rows.map((r) => [r.id, r]));
  const childMap = buildChildMap(rows);

  let idsToDelete: Set<string>;

  if (opts.cascade) {
    // BFS to collect all descendants
    idsToDelete = new Set(rowIds);
    const queue = [...rowIds];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const children = childMap.get(current) || [];
      for (const cid of children) {
        if (!idsToDelete.has(cid)) {
          idsToDelete.add(cid);
          queue.push(cid);
        }
      }
    }
  } else {
    // Re-parent direct children of each deleted row to that row's parent
    idsToDelete = new Set(rowIds);
    let result = [...rows];
    const rowIdxMap = new Map(result.map((r, i) => [r.id, i]));

    for (const delId of rowIds) {
      const delRow = rowMap.get(delId);
      if (!delRow) continue;
      const grandparentId = delRow.parentId ?? null;
      const children = childMap.get(delId) || [];

      for (const cid of children) {
        const idx = rowIdxMap.get(cid);
        if (idx === undefined) continue;
        const childRow = result[idx];
        const newDepth = Math.max(0, childRow.depth - 1);
        result[idx] = { ...childRow, parentId: grandparentId, depth: newDepth };
      }
    }

    // Also adjust deeper descendants of the re-parented children
    for (const delId of rowIds) {
      const delRow = rowMap.get(delId);
      if (!delRow) continue;
      const children = childMap.get(delId) || [];
      for (const cid of children) {
        result = adjustDescendantDepths(result, cid, Math.max(0, (rowMap.get(cid)?.depth ?? 1) - 1));
      }
    }

    // Now filter out deleted rows
    const filtered = result.filter((r) => !idsToDelete.has(r.id));
    return renumber(filtered);
  }

  // Cascade: just filter out all ids to delete
  const filtered = rows.filter((r) => !idsToDelete.has(r.id));
  return renumber(filtered);
}
