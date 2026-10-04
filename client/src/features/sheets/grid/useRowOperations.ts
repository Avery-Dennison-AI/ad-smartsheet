import { useState, useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  addRow,
  insertRow,
  deleteRows,
  reorderRows,
  resizeRows,
  indentSelectedRows,
  outdentSelectedRows,
  selectGridRows,
} from '@/store/slices/gridSlice';
import { getRowHeight, DEFAULT_ROW_HEIGHT } from './gridHelpers';
import { getDescendantIds, canIndent as canIndentRow, canOutdent as canOutdentRow } from './hierarchyHelpers';

const MIN_ROW_HEIGHT = 34;
const MAX_ROW_HEIGHT = 400;

type RowResizeDrag = {
  rowIds: string[];
  startY: number;
  startHeights: Record<string, number>;
  currentDelta: number;
} | null;

export type DropPosition = 'above' | 'below';

interface UseRowOperationsResult {
  rowResizeDrag: RowResizeDrag;
  pendingDeleteRowIds: string[] | null;
  setPendingDeleteRowIds: React.Dispatch<React.SetStateAction<string[] | null>>;
  handleAddRow: (afterRowId?: string) => void;
  handleInsertRowAbove: (rowId: string) => void;
  handleInsertRowBelow: (rowId: string, isParentExpanded?: boolean) => void;
  handleDeleteRows: (rowIds: string[], includeDescendants?: boolean) => void;
  confirmDeleteRows: (selectedRowIndices: Set<number>, selectionClearFn: () => void, selectionSelectRowFn: (idx: number, opts: { shift: boolean; meta: boolean }) => void, includeDescendants?: boolean) => void;
  indentRows: (rowIds: string[]) => void;
  outdentRows: (rowIds: string[]) => void;
  canIndentSelection: (rowIds: string[]) => boolean;
  canOutdentSelection: (rowIds: string[]) => boolean;
  // Drag-and-drop
  draggedRowIds: Set<string>;
  dropTargetRowId: string | null;
  dropPosition: DropPosition | null;
  handleDragStart: (e: React.DragEvent, rowId: string, selectedRowIds?: Set<string>) => void;
  handleDragOver: (e: React.DragEvent, targetRowId: string) => void;
  handleDrop: (targetRowId: string, position: DropPosition) => void;
  handleDragEnd: () => void;
  // Row resize
  handleRowResizeStart: (e: React.MouseEvent, rowIndex: number, selectedRowIndices: Set<number>) => void;
  handleRowResizeDoubleClick: (rowIndex: number) => void;
}

export function useRowOperations(
  sheetId: string,
  collapsedIds?: Set<string>,
): UseRowOperationsResult {
  const dispatch = useAppDispatch();
  const rows = useAppSelector(selectGridRows);

  const [rowResizeDrag, setRowResizeDrag] = useState<RowResizeDrag>(null);
  const [pendingDeleteRowIds, setPendingDeleteRowIds] = useState<string[] | null>(null);

  // Drag-and-drop state
  const [draggedRowIds, setDraggedRowIds] = useState<Set<string>>(new Set());
  const [dragSourceRowId, setDragSourceRowId] = useState<string | null>(null);
  const [dropTargetRowId, setDropTargetRowId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<DropPosition | null>(null);

  const handleAddRow = useCallback(
    (afterRowId?: string) => {
      dispatch(addRow({ sheetId, data: afterRowId ? { afterRowId } : undefined }));
    },
    [sheetId, dispatch],
  );

  const handleInsertRowAbove = useCallback(
    (rowId: string) => {
      dispatch(insertRow({ sheetId, beforeRowId: rowId }));
    },
    [sheetId, dispatch],
  );

  const handleInsertRowBelow = useCallback(
    (rowId: string, isParentExpanded?: boolean) => {
      dispatch(insertRow({ sheetId, afterRowId: rowId, isParentExpanded }));
    },
    [sheetId, dispatch],
  );

  const handleDeleteRows = useCallback(
    (rowIds: string[], includeDescendants = false) => {
      if (rowIds.length > 0) {
        dispatch(deleteRows({ sheetId, rowIds, includeDescendants }));
      }
    },
    [sheetId, dispatch],
  );

  const confirmDeleteRows = useCallback(
    (
      selectedRowIndices: Set<number>,
      selectionClearFn: () => void,
      selectionSelectRowFn: (idx: number, opts: { shift: boolean; meta: boolean }) => void,
      includeDescendants = false,
    ) => {
      if (pendingDeleteRowIds && pendingDeleteRowIds.length > 0) {
        dispatch(deleteRows({ sheetId, rowIds: pendingDeleteRowIds, includeDescendants }));
        const maxDeletedIdx = Math.max(
          ...pendingDeleteRowIds.map((id) => rows.findIndex((r) => r.id === id)),
        );
        const remainingCount = rows.length - pendingDeleteRowIds.length;
        if (remainingCount > 0) {
          const nextIdx = Math.min(maxDeletedIdx, remainingCount - 1);
          selectionSelectRowFn(nextIdx, { shift: false, meta: false });
        } else {
          selectionClearFn();
        }
      }
      setPendingDeleteRowIds(null);
    },
    [sheetId, pendingDeleteRowIds, rows, dispatch],
  );

  const indentRowsHandler = useCallback(
    (rowIds: string[]) => {
      if (rowIds.length > 0) {
        dispatch(indentSelectedRows({ sheetId, rowIds }));
      }
    },
    [sheetId, dispatch],
  );

  const outdentRowsHandler = useCallback(
    (rowIds: string[]) => {
      if (rowIds.length > 0) {
        dispatch(outdentSelectedRows({ sheetId, rowIds }));
      }
    },
    [sheetId, dispatch],
  );

  const canIndentSelection = useCallback(
    (rowIds: string[]): boolean => {
      return rowIds.some((id) => canIndentRow(rows, id));
    },
    [rows],
  );

  const canOutdentSelection = useCallback(
    (rowIds: string[]): boolean => {
      return rowIds.some((id) => canOutdentRow(rows, id));
    },
    [rows],
  );

  // ─── Drag-and-drop ──────────────────────────────────────────────────────

  const clearDragState = useCallback(() => {
    setDraggedRowIds(new Set());
    setDragSourceRowId(null);
    setDropTargetRowId(null);
    setDropPosition(null);
  }, []);

  const handleDragStart = useCallback(
    (e: React.DragEvent, rowId: string, selectedRowIds?: Set<string>) => {
      e.dataTransfer.setData('text/plain', rowId);
      e.dataTransfer.effectAllowed = 'move';

      // Compute dragged group: dragged row + descendants
      const descendantIds = getDescendantIds(rows, rowId);
      let groupIds = new Set([rowId, ...descendantIds]);

      // If multiple rows are selected and the dragged row is among them, include all selected + their descendants
      if (selectedRowIds && selectedRowIds.size > 1 && selectedRowIds.has(rowId)) {
        for (const selId of selectedRowIds) {
          groupIds.add(selId);
          const descIds = getDescendantIds(rows, selId);
          for (const d of descIds) {
            groupIds.add(d);
          }
        }
      }

      setDraggedRowIds(groupIds);
      setDragSourceRowId(rowId);
    },
    [rows],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, targetRowId: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      // Prevent dropping a row inside its own descendants
      if (draggedRowIds.has(targetRowId)) return;

      // Determine position based on mouse Y relative to the row element
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const position: DropPosition = e.clientY < midY ? 'above' : 'below';

      setDropTargetRowId(targetRowId);
      setDropPosition(position);
    },
    [draggedRowIds],
  );

  const handleDrop = useCallback(
    (targetRowId: string, position: DropPosition) => {
      if (draggedRowIds.size === 0 || !dragSourceRowId) {
        clearDragState();
        return;
      }

      // Prevent dropping onto own descendant
      if (draggedRowIds.has(targetRowId)) {
        clearDragState();
        return;
      }

      const targetRow = rows.find((r) => r.id === targetRowId);
      if (!targetRow) {
        clearDragState();
        return;
      }

      // Build ordered ID list: remove dragged rows, reinsert at target position
      const allIds = rows.map((r) => r.id);
      const newIds = allIds.filter((id) => !draggedRowIds.has(id));

      // Find where to insert in the filtered list
      let insertIdx = newIds.indexOf(targetRowId);
      if (insertIdx === -1) {
        clearDragState();
        return;
      }

      // Collect dragged group IDs preserving their relative order
      const draggedGroupOrdered = allIds.filter((id) => draggedRowIds.has(id));

      if (position === 'above') {
        newIds.splice(insertIdx, 0, ...draggedGroupOrdered);
      } else {
        // Below: find the last descendant of target row in the filtered list
        const targetDescendants = getDescendantIds(rows, targetRowId);
        const targetGroupIds = new Set([targetRowId, ...targetDescendants]);
        // Find last index of any target group member in newIds
        let lastTargetIdx = insertIdx;
        for (let i = insertIdx + 1; i < newIds.length; i++) {
          if (targetGroupIds.has(newIds[i])) {
            lastTargetIdx = i;
          } else {
            break;
          }
        }
        newIds.splice(lastTargetIdx + 1, 0, ...draggedGroupOrdered);
      }

      // Compute parentUpdates for moved root rows
      const parentUpdates: Array<{ rowId: string; parentId: string | null; depth: number }> = [];

      if (position === 'above') {
        // Same parent/depth as target row (sibling above)
        const newParentId = targetRow.parentId ?? null;
        const newDepth = targetRow.depth ?? 0;
        // Only update the top-level dragged roots (those whose original parent differs)
        for (const id of draggedGroupOrdered) {
          const row = rows.find((r) => r.id === id);
          if (!row) continue;
          // Only update rows that were direct children of the original context
          // We only need to update the "root" dragged rows — those not descended from other dragged rows
          const isChildOfDragged = rows.some((r) => draggedRowIds.has(r.id) && r.parentId === id);
          const isRootDragged = !rows.some((r) => draggedRowIds.has(r.id) && r.id === row.parentId);
          if (isRootDragged) {
            parentUpdates.push({ rowId: id, parentId: newParentId, depth: newDepth });
          }
        }
      } else {
        // Below target
        const targetHasChildren = rows.some((r) => r.parentId === targetRowId);
        const targetIsCollapsed = collapsedIds?.has(targetRowId) ?? false;

        if (targetHasChildren && !targetIsCollapsed) {
          // Insert as first child of expanded parent
          const newParentId = targetRowId;
          const newDepth = (targetRow.depth ?? 0) + 1;
          for (const id of draggedGroupOrdered) {
            const row = rows.find((r) => r.id === id);
            if (!row) continue;
            const isRootDragged = !rows.some((r) => draggedRowIds.has(r.id) && r.id === row.parentId);
            if (isRootDragged) {
              parentUpdates.push({ rowId: id, parentId: newParentId, depth: newDepth });
            }
          }
        } else {
          // Sibling after target
          const newParentId = targetRow.parentId ?? null;
          const newDepth = targetRow.depth ?? 0;
          for (const id of draggedGroupOrdered) {
            const row = rows.find((r) => r.id === id);
            if (!row) continue;
            const isRootDragged = !rows.some((r) => draggedRowIds.has(r.id) && r.id === row.parentId);
            if (isRootDragged) {
              parentUpdates.push({ rowId: id, parentId: newParentId, depth: newDepth });
            }
          }
        }
      }

      dispatch(reorderRows({ sheetId, orderedIds: newIds, parentUpdates }));
      clearDragState();
    },
    [rows, draggedRowIds, dragSourceRowId, collapsedIds, sheetId, dispatch, clearDragState],
  );

  const handleDragEnd = useCallback(() => {
    clearDragState();
  }, [clearDragState]);

  // Escape key cancels drag
  useEffect(() => {
    if (draggedRowIds.size === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearDragState();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [draggedRowIds, clearDragState]);

  // ─── Row resize ─────────────────────────────────────────────────────────

  const handleRowResizeStart = useCallback(
    (e: React.MouseEvent, rowIndex: number, selectedRowIndices: Set<number>) => {
      e.preventDefault();
      e.stopPropagation();

      let targetRowIds: string[];
      let startHeights: Record<string, number> = {};

      if (selectedRowIndices.has(rowIndex)) {
        targetRowIds = [];
        for (const idx of selectedRowIndices) {
          const row = rows[idx];
          if (row) {
            targetRowIds.push(row.id);
            startHeights[row.id] = getRowHeight(row);
          }
        }
      } else {
        const row = rows[rowIndex];
        if (!row) return;
        targetRowIds = [row.id];
        startHeights[row.id] = getRowHeight(row);
      }

      if (targetRowIds.length === 0) return;

      setRowResizeDrag({
        rowIds: targetRowIds,
        startY: e.clientY,
        startHeights,
        currentDelta: 0,
      });
    },
    [rows],
  );

  const handleRowResizeDoubleClick = useCallback(
    (rowIndex: number) => {
      const row = rows[rowIndex];
      if (!row) return;
      dispatch(resizeRows({ sheetId, updates: [{ rowId: row.id, height: DEFAULT_ROW_HEIGHT }] }));
    },
    [sheetId, rows, dispatch],
  );

  // Global mousemove/mouseup for row resize
  useEffect(() => {
    if (!rowResizeDrag) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientY - rowResizeDrag.startY;
      setRowResizeDrag((prev) => prev ? { ...prev, currentDelta: delta } : null);
    };

    const handleMouseUp = () => {
      if (rowResizeDrag) {
        const updates = rowResizeDrag.rowIds.map((rowId) => {
          const startH = rowResizeDrag.startHeights[rowId] ?? DEFAULT_ROW_HEIGHT;
          const finalH = Math.max(MIN_ROW_HEIGHT, Math.min(MAX_ROW_HEIGHT, startH + rowResizeDrag.currentDelta));
          return { rowId, height: finalH };
        });
        dispatch(resizeRows({ sheetId, updates }));
      }
      setRowResizeDrag(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [rowResizeDrag, sheetId, dispatch]);

  return {
    rowResizeDrag,
    pendingDeleteRowIds,
    setPendingDeleteRowIds,
    handleAddRow,
    handleInsertRowAbove,
    handleInsertRowBelow,
    handleDeleteRows,
    confirmDeleteRows,
    indentRows: indentRowsHandler,
    outdentRows: outdentRowsHandler,
    canIndentSelection,
    canOutdentSelection,
    // Drag-and-drop
    draggedRowIds,
    dropTargetRowId,
    dropPosition,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    // Row resize
    handleRowResizeStart,
    handleRowResizeDoubleClick,
  };
}
