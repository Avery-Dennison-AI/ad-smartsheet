import { useState, useCallback, useEffect, useRef } from 'react';

export interface CellPosition {
  rowIdx: number;
  colIdx: number;
}

export interface SelectionRange {
  start: CellPosition;
  end: CellPosition;
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

  // Get all cells in the current selection range
  const getSelectedCells = useCallback((): CellPosition[] => {
    if (!selectionRange) {
      return activeCell ? [activeCell] : [];
    }

    const cells: CellPosition[] = [];
    const minRow = Math.min(selectionRange.start.rowIdx, selectionRange.end.rowIdx);
    const maxRow = Math.max(selectionRange.start.rowIdx, selectionRange.end.rowIdx);
    const minCol = Math.min(selectionRange.start.colIdx, selectionRange.end.colIdx);
    const maxCol = Math.max(selectionRange.start.colIdx, selectionRange.end.colIdx);

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        cells.push({ rowIdx: r, colIdx: c });
      }
    }
    return cells;
  }, [activeCell, selectionRange]);

  // Check if a cell is selected
  const isCellSelected = useCallback(
    (rowIdx: number, colIdx: number): boolean => {
      if (!activeCell && !selectionRange) return false;

      if (selectionRange) {
        const minRow = Math.min(selectionRange.start.rowIdx, selectionRange.end.rowIdx);
        const maxRow = Math.max(selectionRange.start.rowIdx, selectionRange.end.rowIdx);
        const minCol = Math.min(selectionRange.start.colIdx, selectionRange.end.colIdx);
        const maxCol = Math.max(selectionRange.start.colIdx, selectionRange.end.colIdx);
        return rowIdx >= minRow && rowIdx <= maxRow && colIdx >= minCol && colIdx <= maxCol;
      }

      return activeCell?.rowIdx === rowIdx && activeCell?.colIdx === colIdx;
    },
    [activeCell, selectionRange],
  );

  const isActiveCell = useCallback(
    (rowIdx: number, colIdx: number): boolean => {
      return activeCell?.rowIdx === rowIdx && activeCell?.colIdx === colIdx;
    },
    [activeCell],
  );

  // Handle click on a cell
  const handleCellClick = useCallback(
    (rowIdx: number, colIdx: number, shiftKey: boolean) => {
      if (shiftKey && activeCell) {
        setSelectionRange({ start: activeCell, end: { rowIdx, colIdx } });
      } else {
        setActiveCell({ rowIdx, colIdx });
        setSelectionRange(null);
      }
      setEditingCell(null);
    },
    [activeCell],
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
  }, [activeCell, editingCell, rowCount, colCount, startEditing, getSelectedCells, onClearCells]);

  return {
    activeCell,
    selectionRange,
    editingCell,
    containerRef,
    handleCellClick,
    startEditing,
    stopEditing,
    setActiveCell,
    setSelectionRange,
    isCellSelected,
    isActiveCell,
    getSelectedCells,
  };
}
