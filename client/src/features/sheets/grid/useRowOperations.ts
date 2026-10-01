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

interface UseRowOperationsResult {
  dragRowIndex: number | null;
  rowResizeDrag: RowResizeDrag;
  pendingDeleteRowIds: string[] | null;
  setPendingDeleteRowIds: React.Dispatch<React.SetStateAction<string[] | null>>;
  handleAddRow: (afterRowId?: string) => void;
  handleInsertRowAbove: (rowId: string) => void;
  handleInsertRowBelow: (rowId: string) => void;
  handleDeleteRows: (rowIds: string[], includeDescendants?: boolean) => void;
  confirmDeleteRows: (selectedRowIndices: Set<number>, selectionClearFn: () => void, selectionSelectRowFn: (idx: number, opts: { shift: boolean; meta: boolean }) => void, includeDescendants?: boolean) => void;
  indentRows: (rowIds: string[]) => void;
  outdentRows: (rowIds: string[]) => void;
  canIndentSelection: (rowIds: string[]) => boolean;
  canOutdentSelection: (rowIds: string[]) => boolean;
  handleRowDragStart: (rowIdx: number) => void;
  handleRowDrop: (targetRowIdx: number) => void;
  handleRowResizeStart: (e: React.MouseEvent, rowIndex: number, selectedRowIndices: Set<number>) => void;
  handleRowResizeDoubleClick: (rowIndex: number) => void;
}

export function useRowOperations(
  sheetId: string,
): UseRowOperationsResult {
  const dispatch = useAppDispatch();
  const rows = useAppSelector(selectGridRows);

  const [dragRowIndex, setDragRowIndex] = useState<number | null>(null);
  const [rowResizeDrag, setRowResizeDrag] = useState<RowResizeDrag>(null);
  const [pendingDeleteRowIds, setPendingDeleteRowIds] = useState<string[] | null>(null);

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
    (rowId: string) => {
      dispatch(insertRow({ sheetId, afterRowId: rowId }));
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

  const handleRowDragStart = useCallback((rowIdx: number) => {
    setDragRowIndex(rowIdx);
  }, []);

  const handleRowDrop = useCallback(
    (targetRowIdx: number) => {
      if (dragRowIndex !== null && dragRowIndex !== targetRowIdx) {
        const ids = rows.map((r) => r.id);
        if (dragRowIndex < ids.length && targetRowIdx < ids.length) {
          const draggedId = ids[dragRowIndex];
          // Get descendants to drag as a group
          const descendantIds = getDescendantIds(rows, draggedId);
          const groupIds = [draggedId, ...descendantIds];

          // Remove all group IDs from their current positions
          const newIds = ids.filter((id) => !groupIds.includes(id));

          // Calculate insert position
          let insertIdx = targetRowIdx;
          if (dragRowIndex < targetRowIdx) {
            // Adjust for removed items before target
            const removedBefore = groupIds.filter((gid) => {
              const gidIdx = ids.indexOf(gid);
              return gidIdx < targetRowIdx;
            }).length;
            insertIdx = targetRowIdx - removedBefore;
          }

          // Insert group at new position
          newIds.splice(insertIdx, 0, ...groupIds);
          dispatch(reorderRows({ sheetId, orderedIds: newIds }));
        }
      }
      setDragRowIndex(null);
    },
    [dragRowIndex, rows, sheetId, dispatch],
  );

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
    dragRowIndex,
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
    handleRowDragStart,
    handleRowDrop,
    handleRowResizeStart,
    handleRowResizeDoubleClick,
  };
}
