import { useState, useCallback, useEffect, useRef } from 'react';

export interface CellPosition {
  rowIdx: number;
  colIdx: number;
}

export interface SelectionRange {
  start: CellPosition;
  end: CellPosition;
}

interface SelectionModifiers {
  shift: boolean;
  meta: boolean;
}

interface UseGridSelectionOptions {
  rowCount: number;
  colCount: number;
  onClearCells?: (positions: CellPosition[]) => void;
  onEditCell?: (pos: CellPosition) => void;
}

export function useGridSelection({
  rowCount,
  colCount,
  onClearCells,
  onEditCell,
}: UseGridSelectionOptions) {
  const [activeCell, setActiveCell] = useState<CellPosition | null>(null);
  const [selectionRange, setSelectionRange] = useState<SelectionRange | null>(null);
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Row and column selection state (uses indices, not IDs — SheetGrid maps them)
  const [selectedRowIndices, setSelectedRowIndices] = useState<Set<number>>(new Set());
  const [selectedColIndices, setSelectedColIndices] = useState<Set<number>>(new Set());
  // Track the anchor for shift-range selection
  const [rowAnchor, setRowAnchor] = useState<number | null>(null);
  const [colAnchor, setColAnchor] = useState<number | null>(null);

  // Clear row/column selection when cell selection starts
  const clearRowColumnSelection = useCallback(() => {
    setSelectedRowIndices(new Set());
    setSelectedColIndices(new Set());
    setRowAnchor(null);
    setColAnchor(null);
  }, []);

  // Select a row by index with modifier support
  const selectRow = useCallback(
    (rowIdx: number, modifiers: SelectionModifiers) => {
      // Clear cell selection when selecting rows
      setActiveCell(null);
      setSelectionRange(null);
      setEditingCell(null);
      setSelectedColIndices(new Set());
      setColAnchor(null);

      if (modifiers.shift && rowAnchor !== null) {
        // Range select from anchor to current
        const min = Math.min(rowAnchor, rowIdx);
        const max = Math.max(rowAnchor, rowIdx);
        const newSet = new Set<number>();
        for (let i = min; i <= max; i++) newSet.add(i);
        setSelectedRowIndices(newSet);
      } else if (modifiers.meta) {
        // Toggle single row
        setSelectedRowIndices((prev) => {
          const next = new Set(prev);
          if (next.has(rowIdx)) {
            next.delete(rowIdx);
          } else {
            next.add(rowIdx);
          }
          return next;
        });
        setRowAnchor(rowIdx);
      } else {
        // Single row select
        setSelectedRowIndices(new Set([rowIdx]));
        setRowAnchor(rowIdx);
      }
    },
    [rowAnchor],
  );

  // Select a column by index with modifier support
  const selectColumn = useCallback(
    (colIdx: number, modifiers: SelectionModifiers) => {
      // Clear cell selection when selecting columns
      setActiveCell(null);
      setSelectionRange(null);
      setEditingCell(null);
      setSelectedRowIndices(new Set());
      setRowAnchor(null);

      if (modifiers.shift && colAnchor !== null) {
        // Range select from anchor to current
        const min = Math.min(colAnchor, colIdx);
        const max = Math.max(colAnchor, colIdx);
        const newSet = new Set<number>();
        for (let i = min; i <= max; i++) newSet.add(i);
        setSelectedColIndices(newSet);
      } else if (modifiers.meta) {
        // Toggle single column
        setSelectedColIndices((prev) => {
          const next = new Set(prev);
          if (next.has(colIdx)) {
            next.delete(colIdx);
          } else {
            next.add(colIdx);
          }
          return next;
        });
        setColAnchor(colIdx);
      } else {
        // Single column select
        setSelectedColIndices(new Set([colIdx]));
        setColAnchor(colIdx);
      }
    },
    [colAnchor],
  );

  // Get all cells in the current selection range (cell range + row/col selections)
  const getSelectedCells = useCallback((): CellPosition[] => {
    const cells: CellPosition[] = [];
    const seen = new Set<string>();

    const addCell = (r: number, c: number) => {
      const key = `${r},${c}`;
      if (!seen.has(key)) {
        seen.add(key);
        cells.push({ rowIdx: r, colIdx: c });
      }
    };

    // Add cells from row/column selections
    if (selectedRowIndices.size > 0) {
      for (const r of selectedRowIndices) {
        for (let c = 0; c < colCount; c++) {
          addCell(r, c);
        }
      }
    }

    if (selectedColIndices.size > 0) {
      for (const c of selectedColIndices) {
        for (let r = 0; r < rowCount; r++) {
          addCell(r, c);
        }
      }
    }

    // Add cells from cell range selection
    if (selectionRange) {
      const minRow = Math.min(selectionRange.start.rowIdx, selectionRange.end.rowIdx);
      const maxRow = Math.max(selectionRange.start.rowIdx, selectionRange.end.rowIdx);
      const minCol = Math.min(selectionRange.start.colIdx, selectionRange.end.colIdx);
      const maxCol = Math.max(selectionRange.start.colIdx, selectionRange.end.colIdx);

      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          addCell(r, c);
        }
      }
    } else if (activeCell && selectedRowIndices.size === 0 && selectedColIndices.size === 0) {
      addCell(activeCell.rowIdx, activeCell.colIdx);
    }

    return cells;
  }, [activeCell, selectionRange, selectedRowIndices, selectedColIndices, rowCount, colCount]);

  // Check if a cell is selected (by cell range or row/col selection)
  const isCellSelected = useCallback(
    (rowIdx: number, colIdx: number): boolean => {
      if (selectedRowIndices.has(rowIdx) || selectedColIndices.has(colIdx)) return true;

      if (selectionRange) {
        const minRow = Math.min(selectionRange.start.rowIdx, selectionRange.end.rowIdx);
        const maxRow = Math.max(selectionRange.start.rowIdx, selectionRange.end.rowIdx);
        const minCol = Math.min(selectionRange.start.colIdx, selectionRange.end.colIdx);
        const maxCol = Math.max(selectionRange.start.colIdx, selectionRange.end.colIdx);
        return rowIdx >= minRow && rowIdx <= maxRow && colIdx >= minCol && colIdx <= maxCol;
      }

      return activeCell?.rowIdx === rowIdx && activeCell?.colIdx === colIdx;
    },
    [activeCell, selectionRange, selectedRowIndices, selectedColIndices],
  );

  const isActiveCell = useCallback(
    (rowIdx: number, colIdx: number): boolean => {
      return activeCell?.rowIdx === rowIdx && activeCell?.colIdx === colIdx;
    },
    [activeCell],
  );

  const isRowSelected = useCallback(
    (rowIdx: number): boolean => selectedRowIndices.has(rowIdx),
    [selectedRowIndices],
  );

  const isColSelected = useCallback(
    (colIdx: number): boolean => selectedColIndices.has(colIdx),
    [selectedColIndices],
  );

  // Handle click on a cell — clears row/col selection
  const handleCellClick = useCallback(
    (rowIdx: number, colIdx: number, shiftKey: boolean) => {
      // Clear row/column selection when clicking a cell
      clearRowColumnSelection();

      if (shiftKey && activeCell) {
        setSelectionRange({ start: activeCell, end: { rowIdx, colIdx } });
      } else {
        setActiveCell({ rowIdx, colIdx });
        setSelectionRange(null);
      }
      setEditingCell(null);
    },
    [activeCell, clearRowColumnSelection],
  );

  // Start editing a cell
  const startEditing = useCallback(
    (pos?: CellPosition) => {
      const target = pos || activeCell;
      if (target) {
        setEditingCell(target);
        onEditCell?.(target);
      }
    },
    [activeCell, onEditCell],
  );

  // Stop editing
  const stopEditing = useCallback(() => {
    setEditingCell(null);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingCell) return; // Let the editor handle keys
      if (!containerRef.current?.contains(document.activeElement as Node)) return;

      // If rows or columns are selected, Escape clears them
      if (selectedRowIndices.size > 0 || selectedColIndices.size > 0) {
        if (e.key === 'Escape') {
          clearRowColumnSelection();
          return;
        }
        // Delete/Backspace on row/col selection handled by SheetGrid via onClearCells
        if ((e.key === 'Delete' || e.key === 'Backspace') && onClearCells) {
          e.preventDefault();
          const selected = getSelectedCells();
          if (selected.length > 0) onClearCells(selected);
          return;
        }
        return; // Don't navigate while rows/cols are selected
      }

      if (!activeCell) return;

      const { rowIdx, colIdx } = activeCell;

      switch (e.key) {
        case 'ArrowUp': {
          e.preventDefault();
          const newRow = Math.max(0, rowIdx - 1);
          if (e.shiftKey) {
            setSelectionRange((prev) => ({
              start: prev?.start || activeCell,
              end: { rowIdx: newRow, colIdx },
            }));
          } else {
            setActiveCell({ rowIdx: newRow, colIdx });
            setSelectionRange(null);
          }
          break;
        }
        case 'ArrowDown': {
          e.preventDefault();
          const newRow = Math.min(rowCount - 1, rowIdx + 1);
          if (e.shiftKey) {
            setSelectionRange((prev) => ({
              start: prev?.start || activeCell,
              end: { rowIdx: newRow, colIdx },
            }));
          } else {
            setActiveCell({ rowIdx: newRow, colIdx });
            setSelectionRange(null);
          }
          break;
        }
        case 'ArrowLeft': {
          e.preventDefault();
          const newCol = Math.max(0, colIdx - 1);
          if (e.shiftKey) {
            setSelectionRange((prev) => ({
              start: prev?.start || activeCell,
              end: { rowIdx, colIdx: newCol },
            }));
          } else {
            setActiveCell({ rowIdx, colIdx: newCol });
            setSelectionRange(null);
          }
          break;
        }
        case 'ArrowRight': {
          e.preventDefault();
          const newCol = Math.min(colCount - 1, colIdx + 1);
          if (e.shiftKey) {
            setSelectionRange((prev) => ({
              start: prev?.start || activeCell,
              end: { rowIdx, colIdx: newCol },
            }));
          } else {
            setActiveCell({ rowIdx, colIdx: newCol });
            setSelectionRange(null);
          }
          break;
        }
        case 'Tab': {
          e.preventDefault();
          if (e.shiftKey) {
            const newCol = colIdx > 0 ? colIdx - 1 : colCount - 1;
            const newRow = colIdx > 0 ? rowIdx : Math.max(0, rowIdx - 1);
            setActiveCell({ rowIdx: newRow, colIdx: newCol });
          } else {
            const newCol = colIdx < colCount - 1 ? colIdx + 1 : 0;
            const newRow = colIdx < colCount - 1 ? rowIdx : Math.min(rowCount - 1, rowIdx + 1);
            setActiveCell({ rowIdx: newRow, colIdx: newCol });
          }
          setSelectionRange(null);
          break;
        }
        case 'Enter': {
          e.preventDefault();
          if (e.shiftKey) {
            const newRow = Math.max(0, rowIdx - 1);
            setActiveCell({ rowIdx: newRow, colIdx });
          } else {
            startEditing();
          }
          setSelectionRange(null);
          break;
        }
        case 'F2': {
          e.preventDefault();
          startEditing();
          break;
        }
        case 'Delete':
        case 'Backspace': {
          e.preventDefault();
          const selected = getSelectedCells();
          if (selected.length > 0 && onClearCells) {
            onClearCells(selected);
          }
          break;
        }
        case 'Escape': {
          setSelectionRange(null);
          break;
        }
        default: {
          // If user starts typing a character, enter edit mode
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            startEditing();
          }
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCell, editingCell, rowCount, colCount, startEditing, getSelectedCells, onClearCells, selectedRowIndices, selectedColIndices, clearRowColumnSelection]);

  return {
    activeCell,
    selectionRange,
    editingCell,
    containerRef,
    selectedRowIndices,
    selectedColIndices,
    handleCellClick,
    startEditing,
    stopEditing,
    setActiveCell,
    setSelectionRange,
    isCellSelected,
    isActiveCell,
    isRowSelected,
    isColSelected,
    getSelectedCells,
    selectRow,
    selectColumn,
    clearRowColumnSelection,
  };
}
