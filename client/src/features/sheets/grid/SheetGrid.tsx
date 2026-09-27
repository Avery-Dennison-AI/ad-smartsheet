import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Button, Spinner, ConfirmDialog } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchGrid,
  addColumn,
  updateColumn,
  deleteColumn,
  reorderColumns,
  setPrimaryColumn,
  addRow,
  updateCell,
  deleteRows,
  reorderRows,
  optimisticUpdateCell,
  rollbackCell,
  resizeColumn,
  resizeRows,
  selectGridColumns,
  selectGridRows,
  selectGridLoading,
  selectGridMembers,
} from '@/store/slices/gridSlice';
import { useGridSelection } from './useGridSelection';
import GridHeaderCell from './GridHeaderCell';
import GridRowNumCell from './GridRowNumCell';
import GridCell from './GridCell';
import ColumnPropertiesModal from './ColumnPropertiesModal';
import FormattingToolbar from './FormattingToolbar';
import type { ColumnType, DropdownOption, WorkspaceRole } from '@/types';

const DEFAULT_ROW_HEIGHT = 34; // matches --grid-row-height
const HEADER_HEIGHT = 36; // matches --grid-header-height
const MIN_BLANK_ROWS = 50;
const OVERSCAN = 5;
const DEFAULT_COL_WIDTH = 160;
const PRIMARY_COL_WIDTH = 240;
const MIN_COL_WIDTH = 60;
const MAX_COL_WIDTH = 800;
const MIN_ROW_HEIGHT = 34;
const MAX_ROW_HEIGHT = 400;

interface SheetGridProps {
  sheetId: string;
  userRole: WorkspaceRole;
}

interface ColumnPropertiesState {
  open: boolean;
  columnId: string | null;
  initialName: string;
  initialType: ColumnType;
  initialOptions: DropdownOption[];
  isPrimary: boolean;
  existingCellCount: number;
  insertPosition: number | null;
}

const defaultColumnPropertiesState: ColumnPropertiesState = {
  open: false,
  columnId: null,
  initialName: '',
  initialType: 'text',
  initialOptions: [],
  isPrimary: false,
  existingCellCount: 0,
  insertPosition: null,
};

// ─── Helper: get column width ──────────────────────────────────────────────
function getColWidth(col: { isPrimary?: boolean; width?: number }): number {
  return col.width ?? (col.isPrimary ? PRIMARY_COL_WIDTH : DEFAULT_COL_WIDTH);
}

// ─── Helper: get row height ────────────────────────────────────────────────
function getRowHeight(row: { height?: number } | undefined): number {
  return row?.height ?? DEFAULT_ROW_HEIGHT;
}

// ─── Row position cache builder ────────────────────────────────────────────
function buildRowPositions(
  rows: Array<{ height?: number }>,
  blankRowCount: number,
  defaultHeight: number = DEFAULT_ROW_HEIGHT,
): { tops: number[]; total: number } {
  const dataCount = rows.length;
  const totalCount = dataCount + blankRowCount;
  const tops: number[] = new Array(totalCount);
  let top = HEADER_HEIGHT;

  for (let i = 0; i < dataCount; i++) {
    tops[i] = top;
    top += rows[i]?.height ?? defaultHeight;
  }
  for (let i = dataCount; i < totalCount; i++) {
    tops[i] = top;
    top += defaultHeight;
  }

  return { tops, total: top };
}

// ─── Binary search: find first visible row index ──────────────────────────
function findFirstVisible(tops: number[], scrollTop: number): number {
  let lo = 0;
  let hi = tops.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    if (tops[mid] <= scrollTop) {
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return Math.max(0, hi);
}

export default function SheetGrid({ sheetId, userRole }: SheetGridProps) {
  const dispatch = useAppDispatch();
  const columns = useAppSelector(selectGridColumns);
  const rows = useAppSelector(selectGridRows);
  const loading = useAppSelector(selectGridLoading);
  const workspaceMembers = useAppSelector(selectGridMembers);

  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(600);
  const observerRef = useRef<ResizeObserver | null>(null);
  const scrollNodeRef = useRef<HTMLDivElement | null>(null);

  // Track hovered row index for primary column hover state
  const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null);

  // Column properties modal state (replaces ColumnTypeModal + DropdownOptionsModal)
  const [colPropsModal, setColPropsModal] = useState<ColumnPropertiesState>(defaultColumnPropertiesState);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteColId, setPendingDeleteColId] = useState<string | null>(null);

  // Drag state
  const [dragColId, setDragColId] = useState<string | null>(null);
  const [dragRowIndex, setDragRowIndex] = useState<number | null>(null);

  // ─── Column resize drag state ──────────────────────────────────────────
  type ColResizeDrag = {
    columnId: string;
    startX: number;
    startWidth: number;
    currentWidth: number;
  } | null;
  const [colResizeDrag, setColResizeDrag] = useState<ColResizeDrag>(null);

  // ─── Row resize drag state ─────────────────────────────────────────────
  type RowResizeDrag = {
    rowIds: string[];
    startY: number;
    startHeights: Record<string, number>;
    currentDelta: number;
  } | null;
  const [rowResizeDrag, setRowResizeDrag] = useState<RowResizeDrag>(null);

  // Load grid on mount
  useEffect(() => {
    dispatch(fetchGrid(sheetId));
  }, [sheetId, dispatch]);

  // Callback ref: attaches ResizeObserver + window resize listener when the
  // scroll container mounts (after loading finishes).
  const scrollContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    scrollNodeRef.current = node;

    if (!node) return;

    setViewportHeight(node.clientHeight);

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setViewportHeight(entry.contentRect.height);
      }
    });
    ro.observe(node);
    observerRef.current = ro;

    const handleWindowResize = () => {
      setViewportHeight(node.clientHeight);
    };
    window.addEventListener('resize', handleWindowResize);

    (node as any).__cleanupResize = () => {
      ro.disconnect();
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      const node = scrollNodeRef.current;
      if (node && (node as any).__cleanupResize) {
        (node as any).__cleanupResize();
      }
    };
  }, []);

  // Scroll handler
  const handleScroll = useCallback(() => {
    if (scrollNodeRef.current) {
      setScrollTop(scrollNodeRef.current.scrollTop);
      setIsScrolled(scrollNodeRef.current.scrollLeft > 0);
    }
  }, []);

  // ─── Compute column widths map (including live drag overrides) ─────────
  const liveColumnWidths = useMemo(() => {
    const map: Record<string, number> = {};
    for (const col of columns) {
      map[col.id] = getColWidth(col);
    }
    // Apply live drag override
    if (colResizeDrag) {
      map[colResizeDrag.columnId] = colResizeDrag.currentWidth;
    }
    return map;
  }, [columns, colResizeDrag]);

  // ─── Total content width ───────────────────────────────────────────────
  const totalContentWidth = useMemo(() => {
    let w = 0;
    for (const col of columns) {
      w += liveColumnWidths[col.id] ?? getColWidth(col);
    }
    return w;
  }, [columns, liveColumnWidths]);

  // ─── Row positions cache ───────────────────────────────────────────────
  const rowPositions = useMemo(() => {
    return buildRowPositions(rows, MIN_BLANK_ROWS, DEFAULT_ROW_HEIGHT);
  }, [rows]);

  const totalRows = rows.length + MIN_BLANK_ROWS;

  // ─── Visible row range ─────────────────────────────────────────────────
  const { visibleStartRow, visibleEndRow } = useMemo(() => {
    const { tops } = rowPositions;
    const start = findFirstVisible(tops, scrollTop);
    const overscanStart = Math.max(0, start - OVERSCAN);

    let end = start;
    const bottomEdge = scrollTop + viewportHeight;
    while (end < totalRows - 1 && tops[end] < bottomEdge) {
      end++;
    }
    const overscanEnd = Math.min(totalRows - 1, end + OVERSCAN);

    return { visibleStartRow: overscanStart, visibleEndRow: overscanEnd };
  }, [rowPositions, scrollTop, viewportHeight, totalRows]);

  const visibleRows = useMemo(() => {
    const result = [];
    for (let i = visibleStartRow; i <= visibleEndRow; i++) {
      result.push(i);
    }
    return result;
  }, [visibleStartRow, visibleEndRow]);

  // ─── Live row heights during row resize ────────────────────────────────
  const liveRowHeights = useMemo(() => {
    if (!rowResizeDrag) return null;
    const map: Record<string, number> = {};
    for (const rowId of rowResizeDrag.rowIds) {
      const startH = rowResizeDrag.startHeights[rowId] ?? DEFAULT_ROW_HEIGHT;
      const newH = Math.max(MIN_ROW_HEIGHT, Math.min(MAX_ROW_HEIGHT, startH + rowResizeDrag.currentDelta));
      map[rowId] = newH;
    }
    return map;
  }, [rowResizeDrag]);

  // Selection hook
  const selection = useGridSelection({
    rowCount: totalRows,
    colCount: columns.length,
    onClearCells: (positions) => {
      for (const pos of positions) {
        const row = rows[pos.rowIdx];
        if (row) {
          const col = columns[pos.colIdx];
          if (col) {
            const prevValue = row.cells[col.id] ?? null;
            dispatch(optimisticUpdateCell({ rowId: row.id, columnId: col.id, value: null }));
            dispatch(updateCell({ sheetId, rowId: row.id, columnId: col.id, value: null }))
              .unwrap()
              .catch(() => {
                dispatch(rollbackCell({ rowId: row.id, columnId: col.id, previousValue: prevValue }));
              });
          }
        }
      }
    },
  });

  // Connect selection hook's containerRef to the scroll container so keyboard navigation works
  useEffect(() => {
    (selection.containerRef as React.MutableRefObject<HTMLDivElement | null>).current = scrollNodeRef.current;
  }, [selection.containerRef, loading]);

  // Derive activeCell and selectedCells for FormattingToolbar
  const fmtActiveCell = useMemo(() => {
    if (!selection.activeCell) return null;
    const row = rows[selection.activeCell.rowIdx];
    const col = columns[selection.activeCell.colIdx];
    if (!row || !col) return null;
    return { rowId: row.id, columnId: col.id };
  }, [selection.activeCell, rows, columns]);

  const fmtSelectedCells = useMemo(() => {
    const cells = selection.getSelectedCells();
    return cells
      .map((pos) => {
        const row = rows[pos.rowIdx];
        const col = columns[pos.colIdx];
        if (!row || !col) return null;
        return { rowId: row.id, columnId: col.id };
      })
      .filter(Boolean) as Array<{ rowId: string; columnId: string }>;
  }, [selection, rows, columns]);

  // ─── Column operations ──────────────────────────────────────────────────

  const handleRenameColumn = useCallback(
    (columnId: string, name: string) => {
      dispatch(updateColumn({ sheetId, columnId, patch: { name } }));
    },
    [sheetId, dispatch],
  );

  // Open column properties modal for editing an existing column
  const handleEditColumnProperties = useCallback(
    (columnId: string) => {
      const col = columns.find((c) => c.id === columnId);
      if (!col) return;

      // Count existing non-null cell values for this column
      let cellCount = 0;
      for (const row of rows) {
        if (row.cells[columnId] != null && row.cells[columnId] !== '') {
          cellCount++;
        }
      }

      setColPropsModal({
        open: true,
        columnId,
        initialName: col.name,
        initialType: col.type,
        initialOptions: col.options ?? [],
        isPrimary: !!col.isPrimary,
        existingCellCount: cellCount,
        insertPosition: null,
      });
    },
    [columns, rows],
  );

  // Save handler for the unified column properties modal
  const handleColumnPropertiesSave = useCallback(
    (data: { name: string; type: ColumnType; options?: DropdownOption[] }) => {
      if (colPropsModal.columnId) {
        // Editing existing column
        dispatch(updateColumn({
          sheetId,
          columnId: colPropsModal.columnId,
          patch: {
            name: data.name,
            type: data.type,
            ...(data.type === 'dropdown' ? { options: data.options } : {}),
          },
        }));
      } else {
        // Adding new column — include position if set (from insert left/right)
        dispatch(addColumn({
          sheetId,
          data: {
            name: data.name,
            type: data.type,
            ...(colPropsModal.insertPosition !== null ? { position: colPropsModal.insertPosition } : {}),
            ...(data.type === 'dropdown' ? { options: data.options } : {}),
          },
        }));
      }
      setColPropsModal(defaultColumnPropertiesState);
    },
    [sheetId, colPropsModal.columnId, colPropsModal.insertPosition, dispatch],
  );

  const handleDeleteColumn = useCallback(
    (columnId: string) => {
      setPendingDeleteColId(columnId);
      setDeleteConfirmOpen(true);
    },
    [],
  );

  const confirmDeleteColumn = useCallback(() => {
    if (pendingDeleteColId) {
      dispatch(deleteColumn({ sheetId, columnId: pendingDeleteColId }));
    }
    setDeleteConfirmOpen(false);
    setPendingDeleteColId(null);
  }, [sheetId, pendingDeleteColId, dispatch]);

  const handleInsertColumn = useCallback(
    (afterColumnId: string, direction: 'left' | 'right') => {
      const colIndex = columns.findIndex((c) => c.id === afterColumnId);
      const position = direction === 'left' ? colIndex : colIndex + 1;
      // Open the properties modal for the new column instead of creating directly
      setColPropsModal({
        open: true,
        columnId: null, // null = new column
        initialName: 'New Column',
        initialType: 'text',
        initialOptions: [],
        isPrimary: false,
        existingCellCount: 0,
        insertPosition: position,
      });
    },
    [columns],
  );

  const handleSetPrimaryColumn = useCallback(
    (columnId: string) => {
      dispatch(setPrimaryColumn({ sheetId, columnId }));
    },
    [sheetId, dispatch],
  );

  // ─── Row operations ─────────────────────────────────────────────────────

  const handleAddRow = useCallback(
    (afterRowId?: string) => {
      dispatch(addRow({ sheetId, data: afterRowId ? { afterRowId } : undefined }));
    },
    [sheetId, dispatch],
  );

  const handleInsertRowAbove = useCallback(
    (rowIndex: number) => {
      const row = rows[rowIndex];
      if (row) {
        const prevRow = rowIndex > 0 ? rows[rowIndex - 1] : undefined;
        dispatch(addRow({ sheetId, data: prevRow ? { afterRowId: prevRow.id } : undefined }));
      }
    },
    [sheetId, rows, dispatch],
  );

  const handleInsertRowBelow = useCallback(
    (rowIndex: number) => {
      const row = rows[rowIndex];
      if (row) {
        dispatch(addRow({ sheetId, data: { afterRowId: row.id } }));
      }
    },
    [sheetId, rows, dispatch],
  );

  const handleDeleteRows = useCallback(
    (rowIndices: number[]) => {
      const rowIds = rowIndices
        .map((i) => rows[i]?.id)
        .filter(Boolean) as string[];
      if (rowIds.length > 0) {
        dispatch(deleteRows({ sheetId, rowIds }));
      }
    },
    [sheetId, rows, dispatch],
  );

  // ─── Cell operations ────────────────────────────────────────────────────

  const handleCellCommit = useCallback(
    (rowId: string, columnId: string, value: unknown) => {
      const row = rows.find((r) => r.id === rowId);
      const prevValue = row?.cells[columnId] ?? null;
      dispatch(optimisticUpdateCell({ rowId, columnId, value }));
      dispatch(updateCell({ sheetId, rowId, columnId, value }))
        .unwrap()
        .catch(() => {
          dispatch(rollbackCell({ rowId, columnId, previousValue: prevValue }));
        });
    },
    [sheetId, rows, dispatch],
  );

  // Add a new dropdown option to a column definition
  const handleAddDropdownOption = useCallback(
    (columnId: string, label: string) => {
      const col = columns.find((c) => c.id === columnId);
      if (!col || col.type !== 'dropdown') return;
      const existingOptions = col.options ?? [];
      const defaultColor = existingOptions[0]?.color ?? 'gray';
      const newOptions = [...existingOptions, { label, color: defaultColor }];
      dispatch(updateColumn({ sheetId, columnId, patch: { options: newOptions } }));
    },
    [sheetId, columns, dispatch],
  );

  // Handle committing a value from a blank row — creates a new row with first cell value
  const handleBlankRowCommit = useCallback(
    (colIdx: number, value: unknown) => {
      if (value == null || value === '' || value === false) return;
      const col = columns[colIdx];
      if (!col) return;
      dispatch(addRow({ sheetId, data: { cells: { [col.id]: value } } }));
    },
    [sheetId, columns, dispatch],
  );

  // ─── Column drag-and-drop ───────────────────────────────────────────────

  const handleColDragStart = useCallback((colId: string) => {
    const col = columns.find((c) => c.id === colId);
    if (col?.isPrimary) return;
    setDragColId(colId);
  }, [columns]);

  const handleColDrop = useCallback(
    (targetColId: string) => {
      if (dragColId && dragColId !== targetColId) {
        const ids = columns.map((c) => c.id);
        const fromIdx = ids.indexOf(dragColId);
        let toIdx = ids.indexOf(targetColId);
        if (fromIdx !== -1 && toIdx !== -1) {
          if (toIdx < 1) toIdx = 1;
          ids.splice(fromIdx, 1);
          ids.splice(toIdx, 0, dragColId);
          dispatch(reorderColumns({ sheetId, orderedIds: ids }));
        }
      }
      setDragColId(null);
    },
    [dragColId, columns, sheetId, dispatch],
  );

  // ─── Row drag-and-drop ──────────────────────────────────────────────────

  const handleRowDragStart = useCallback((rowIdx: number) => {
    setDragRowIndex(rowIdx);
  }, []);

  const handleRowDrop = useCallback(
    (targetRowIdx: number) => {
      if (dragRowIndex !== null && dragRowIndex !== targetRowIdx) {
        const ids = rows.map((r) => r.id);
        if (dragRowIndex < ids.length && targetRowIdx < ids.length) {
          const draggedId = ids[dragRowIndex];
          ids.splice(dragRowIndex, 1);
          ids.splice(targetRowIdx, 0, draggedId);
          dispatch(reorderRows({ sheetId, orderedIds: ids }));
        }
      }
      setDragRowIndex(null);
    },
    [dragRowIndex, rows, sheetId, dispatch],
  );

  // ─── Column resize handlers ─────────────────────────────────────────────

  const handleColumnResizeStart = useCallback(
    (e: React.MouseEvent, columnId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const col = columns.find((c) => c.id === columnId);
      if (!col) return;
      const startWidth = getColWidth(col);
      setColResizeDrag({
        columnId,
        startX: e.clientX,
        startWidth,
        currentWidth: startWidth,
      });
    },
    [columns],
  );

  const handleColumnResizeDoubleClick = useCallback(
    (columnId: string) => {
      // Auto-fit: measure widest content in this column
      // For now, reset to default width since measuring rendered cells requires DOM access
      const col = columns.find((c) => c.id === columnId);
      if (!col) return;
      const defaultW = col.isPrimary ? PRIMARY_COL_WIDTH : DEFAULT_COL_WIDTH;
      dispatch(resizeColumn({ sheetId, columnId, width: defaultW }));
    },
    [sheetId, columns, dispatch],
  );

  // Global mousemove/mouseup for column resize
  useEffect(() => {
    if (!colResizeDrag) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - colResizeDrag.startX;
      const newWidth = Math.max(MIN_COL_WIDTH, Math.min(MAX_COL_WIDTH, colResizeDrag.startWidth + delta));
      setColResizeDrag((prev) =>
        prev ? { ...prev, currentWidth: newWidth } : null,
      );
    };

    const handleMouseUp = () => {
      if (colResizeDrag) {
        const finalWidth = Math.max(MIN_COL_WIDTH, Math.min(MAX_COL_WIDTH, colResizeDrag.currentWidth));
        dispatch(resizeColumn({ sheetId, columnId: colResizeDrag.columnId, width: finalWidth }));
      }
      setColResizeDrag(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [colResizeDrag, sheetId, dispatch]);

  // ─── Row resize handlers ────────────────────────────────────────────────

  const handleRowResizeStart = useCallback(
    (e: React.MouseEvent, rowIndex: number) => {
      e.preventDefault();
      e.stopPropagation();

      // Determine which rows to resize: if the clicked row is selected, resize all selected rows
      let targetRowIds: string[];
      let startHeights: Record<string, number> = {};

      if (selection.selectedRowIndices.has(rowIndex)) {
        // Resize all selected rows
        targetRowIds = [];
        for (const idx of selection.selectedRowIndices) {
          const row = rows[idx];
          if (row) {
            targetRowIds.push(row.id);
            startHeights[row.id] = getRowHeight(row);
          }
        }
      } else {
        // Resize only this single row
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
    [rows, selection.selectedRowIndices],
  );

  const handleRowResizeDoubleClick = useCallback(
    (rowIndex: number) => {
      // Reset to default height
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
      setRowResizeDrag((prev) =>
        prev ? { ...prev, currentDelta: delta } : null,
      );
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

  const canEdit = userRole === 'editor' || userRole === 'admin' || userRole === 'owner';

  if (loading) {
    return (
      <div
        className="flex h-full items-center justify-center"
        data-icod-id="src_features_sheets_grid_sheetgrid_tsx_926d">
        <Spinner size="lg" data-icod-id="src_features_sheets_grid_sheetgrid_tsx_4b5c" />
      </div>
    );
  }

  return (
    <div
      className="relative flex h-full flex-col overflow-hidden"
      data-icod-id="src_features_sheets_grid_sheetgrid_tsx_f837">
      {/* Formatting toolbar */}
      <FormattingToolbar
        sheetId={sheetId}
        userRole={userRole}
        activeCell={fmtActiveCell}
        selectedCells={fmtSelectedCells}
        selectedRows={selection.selectedRowIndices}
        selectedColumns={selection.selectedColIndices}
        columns={columns}
        rows={rows}
        onReturnFocus={() => scrollNodeRef.current?.focus()}
        data-icod-id="src_features_sheets_grid_sheetgrid_tsx_1675" />
      {/* Scrollable grid container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto"
        style={{ scrollPaddingTop: HEADER_HEIGHT }}
        onScroll={handleScroll}
        tabIndex={0}
        data-icod-id="src_features_sheets_grid_sheetgrid_tsx_f8f4">
        <div
          style={{ height: rowPositions.total, minWidth: 'max-content' }}
          className="relative"
          data-icod-id="src_features_sheets_grid_sheetgrid_tsx_d24c">
          {/* Sticky header row */}
          <div
            className="sticky top-0 z-20 flex"
            style={{ height: HEADER_HEIGHT }}
            data-icod-id="src_features_sheets_grid_sheetgrid_tsx_abaf">
            {/* Top-left corner cell */}
            <div
              className="sticky left-0 z-[22] flex items-center justify-center border-b border-r bg-[var(--grid-header-bg)]"
              style={{
                width: 'var(--grid-row-num-width)',
                height: HEADER_HEIGHT,
                borderColor: 'var(--grid-line-color)',
              }}
              data-icod-id="src_features_sheets_grid_sheetgrid_tsx_9515" />

            {/* Column headers */}
            {columns.map((col, colIdx) => {
              const colW = liveColumnWidths[col.id] ?? getColWidth(col);
              return (
                <div
                  key={col.id}
                  style={{
                    width: colW,
                    minWidth: colW,
                    position: col.isPrimary ? 'sticky' : undefined,
                    left: col.isPrimary ? 'var(--grid-row-num-width)' : undefined,
                    zIndex: col.isPrimary ? 21 : undefined,
                  }}
                  data-icod-id={`src_features_sheets_grid_sheetgrid_tsx_dc1c_${col.id}`}>
                  <GridHeaderCell
                    column={col}
                    columnIndex={colIdx}
                    userRole={userRole}
                    isScrolled={col.isPrimary ? isScrolled : false}
                    isColumnSelected={selection.isColSelected(colIdx)}
                    onRename={handleRenameColumn}
                    onEditProperties={handleEditColumnProperties}
                    onDelete={handleDeleteColumn}
                    onInsertLeft={(id) => handleInsertColumn(id, 'left')}
                    onInsertRight={(id) => handleInsertColumn(id, 'right')}
                    onSelectColumn={selection.selectColumn}
                    onDragStart={handleColDragStart}
                    onDragOver={() => {}}
                    onDrop={handleColDrop}
                    onSetPrimary={canEdit && !col.isPrimary && col.type === 'text' ? handleSetPrimaryColumn : undefined}
                    onColumnResizeStart={handleColumnResizeStart}
                    onColumnResizeDoubleClick={handleColumnResizeDoubleClick}
                    data-icod-id={`src_features_sheets_grid_sheetgrid_tsx_aa0f_${col.id}`} />
                </div>
              );
            })}

            {/* Add column button */}
            {canEdit && (
              <div
                className="flex shrink-0 items-center border-b px-2"
                style={{
                  height: HEADER_HEIGHT,
                  borderColor: 'var(--grid-line-color)',
                }}
                data-icod-id="src_features_sheets_grid_sheetgrid_tsx_ad6f">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setColPropsModal({
                      open: true,
                      columnId: null,
                      initialName: '',
                      initialType: 'text',
                      initialOptions: [],
                      isPrimary: false,
                      existingCellCount: 0,
                      insertPosition: null,
                    });
                  }}
                  data-icod-id="src_features_sheets_grid_sheetgrid_tsx_6c44">
                  <Plus
                    className="mr-1 h-3 w-3"
                    data-icod-id="src_features_sheets_grid_sheetgrid_tsx_4a05" />
                  Add
                </Button>
              </div>
            )}
          </div>

          {/* Data rows (virtualized with variable heights) */}
          {visibleRows.map((rowIdx) => {
            const row = rows[rowIdx];
            const isBlankRow = !row;
            const rowH = liveRowHeights && row && liveRowHeights[row.id] !== undefined
              ? liveRowHeights[row.id]
              : getRowHeight(row);
            const top = rowPositions.tops[rowIdx] ?? (HEADER_HEIGHT + rowIdx * DEFAULT_ROW_HEIGHT);
            const isRowHovered = hoveredRowIndex === rowIdx;

            return (
              <div
                key={rowIdx}
                className="absolute flex w-max"
                style={{
                  top,
                  height: rowH,
                  willChange: 'transform',
                }}
                onMouseEnter={() => setHoveredRowIndex(rowIdx)}
                onMouseLeave={() => setHoveredRowIndex((prev) => prev === rowIdx ? null : prev)}
                data-icod-id={`src_features_sheets_grid_sheetgrid_tsx_a4d5_${rowIdx}`}>
                {/* Row number cell */}
                <div
                  className="sticky left-0 z-[12]"
                  style={{ width: 'var(--grid-row-num-width)' }}
                  data-icod-id={`src_features_sheets_grid_sheetgrid_tsx_3381_${rowIdx}`}>
                  <GridRowNumCell
                    rowNumber={rowIdx + 1}
                    rowIndex={rowIdx}
                    userRole={userRole}
                    isSelected={selection.isRowSelected(rowIdx)}
                    onSelectRow={selection.selectRow}
                    onInsertAbove={handleInsertRowAbove}
                    onInsertBelow={handleInsertRowBelow}
                    onDeleteRows={handleDeleteRows}
                    onDragStart={handleRowDragStart}
                    onDragOver={() => {}}
                    onDrop={handleRowDrop}
                    onRowResizeStart={handleRowResizeStart}
                    onRowResizeDoubleClick={handleRowResizeDoubleClick}
                    data-icod-id={`src_features_sheets_grid_sheetgrid_tsx_6b31_${rowIdx}`} />
                </div>
                {/* Data cells */}
                {columns.map((col, colIdx) => {
                  const cellValue = row ? (row.cells[col.id] ?? null) : null;
                  const isActive = selection.isActiveCell(rowIdx, colIdx);
                  const isSelected = selection.isCellSelected(rowIdx, colIdx);
                  const isEditing = selection.editingCell?.rowIdx === rowIdx && selection.editingCell?.colIdx === colIdx;
                  const colW = liveColumnWidths[col.id] ?? getColWidth(col);

                  return (
                    <div
                      key={col.id}
                      style={{
                        width: colW,
                        minWidth: colW,
                        position: col.isPrimary ? 'sticky' : undefined,
                        left: col.isPrimary ? 'var(--grid-row-num-width)' : undefined,
                        zIndex: col.isPrimary ? 11 : undefined,
                      }}
                      data-icod-id={`src_features_sheets_grid_sheetgrid_tsx_41f3_${rowIdx}_${col.id}`}>
                      <GridCell
                        column={col}
                        rowId={row?.id}
                        value={cellValue}
                        isActive={isActive}
                        isSelected={isSelected}
                        isEditing={isEditing}
                        readOnly={!canEdit}
                        workspaceMembers={workspaceMembers}
                        rowHeight={rowH}
                        onCommit={(val) => {
                          if (isBlankRow) {
                            handleBlankRowCommit(colIdx, val);
                          } else {
                            handleCellCommit(row.id, col.id, val);
                          }
                        }}
                        onStartEdit={() => {
                          selection.startEditing({ rowIdx, colIdx });
                        }}
                        onStopEdit={selection.stopEditing}
                        onCellClick={(e) => {
                          selection.handleCellClick(rowIdx, colIdx, e.shiftKey);
                          // Focus the scroll container so keyboard shortcuts work immediately
                          scrollNodeRef.current?.focus();
                        }}
                        onAddDropdownOption={handleAddDropdownOption}
                        isPrimary={!!col.isPrimary}
                        isScrolled={col.isPrimary ? isScrolled : false}
                        isRowHovered={col.isPrimary ? isRowHovered : false}
                        isRowSelected={selection.isRowSelected(rowIdx)}
                        isColSelected={selection.isColSelected(colIdx)}
                        data-icod-id={`src_features_sheets_grid_sheetgrid_tsx_1587_${rowIdx}_${col.id}`} />
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Column resize guide line */}
          {colResizeDrag && (
            <div
              className="pointer-events-none absolute top-0 bottom-0 z-50 w-px bg-primary"
              style={{
                left: (() => {
                  // Calculate the x position of the column being resized
                  let x = 0; // Start after row-number column (handled by CSS var)
                  for (const col of columns) {
                    const w = liveColumnWidths[col.id] ?? getColWidth(col);
                    if (col.id === colResizeDrag.columnId) {
                      return x + w;
                    }
                    x += w;
                  }
                  return x;
                })(),
              }}
              data-icod-id="col_resize_guide"
            />
          )}

          {/* Row resize guide line */}
          {rowResizeDrag && (
            <div
              className="pointer-events-none absolute left-0 right-0 z-50 h-px bg-primary"
              style={{
                top: (() => {
                  // Find the bottom edge of the row(s) being resized
                  if (rowResizeDrag.rowIds.length === 0) return 0;
                  // Use the last row in the list to find its bottom edge
                  const lastRowId = rowResizeDrag.rowIds[rowResizeDrag.rowIds.length - 1];
                  const rowIdx = rows.findIndex((r) => r.id === lastRowId);
                  if (rowIdx === -1) return 0;
                  const rowTop = rowPositions.tops[rowIdx] ?? 0;
                  const rowH = liveRowHeights?.[lastRowId] ?? getRowHeight(rows[rowIdx]);
                  return rowTop + rowH;
                })(),
              }}
              data-icod-id="row_resize_guide"
            />
          )}
        </div>
      </div>
      {/* Modals */}
      <ColumnPropertiesModal
        open={colPropsModal.open}
        onClose={() => setColPropsModal(defaultColumnPropertiesState)}
        onSave={handleColumnPropertiesSave}
        initialName={colPropsModal.initialName}
        initialType={colPropsModal.initialType}
        initialOptions={colPropsModal.initialOptions}
        isPrimary={colPropsModal.isPrimary}
        existingCellCount={colPropsModal.existingCellCount}
        data-icod-id="src_features_sheets_grid_sheetgrid_tsx_b979" />
      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Delete column"
        description="This will permanently delete this column and all its data. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDeleteColumn}
        data-icod-id="src_features_sheets_grid_sheetgrid_tsx_b261" />
    </div>
  );
}
