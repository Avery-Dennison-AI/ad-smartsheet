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

const ROW_HEIGHT = 34; // matches --grid-row-height
const HEADER_HEIGHT = 36; // matches --grid-header-height
const MIN_BLANK_ROWS = 50;
const OVERSCAN = 5;
const DEFAULT_COL_WIDTH = 180;
const PRIMARY_COL_WIDTH = 260;

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
}

const defaultColumnPropertiesState: ColumnPropertiesState = {
  open: false,
  columnId: null,
  initialName: '',
  initialType: 'text',
  initialOptions: [],
  isPrimary: false,
  existingCellCount: 0,
};

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

  // Virtualization calculations
  const totalRows = rows.length + MIN_BLANK_ROWS;
  const totalHeight = totalRows * ROW_HEIGHT + HEADER_HEIGHT;

  const visibleStartRow = Math.max(0, Math.floor((scrollTop - HEADER_HEIGHT) / ROW_HEIGHT) - OVERSCAN);
  const visibleEndRow = Math.min(
    totalRows - 1,
    Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + OVERSCAN,
  );

  const visibleRows = useMemo(() => {
    const result = [];
    for (let i = visibleStartRow; i <= visibleEndRow; i++) {
      result.push(i);
    }
    return result;
  }, [visibleStartRow, visibleEndRow]);

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
        // Adding new column
        dispatch(addColumn({
          sheetId,
          data: {
            name: data.name,
            type: data.type,
            ...(data.type === 'dropdown' ? { options: data.options } : {}),
          },
        }));
      }
      setColPropsModal(defaultColumnPropertiesState);
    },
    [sheetId, colPropsModal.columnId, dispatch],
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
          style={{ height: totalHeight, minWidth: 'max-content' }}
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
            {columns.map((col) => (
              <div
                key={col.id}
                style={{
                  width: col.isPrimary ? PRIMARY_COL_WIDTH : DEFAULT_COL_WIDTH,
                  minWidth: col.isPrimary ? PRIMARY_COL_WIDTH : DEFAULT_COL_WIDTH,
                  position: col.isPrimary ? 'sticky' : undefined,
                  left: col.isPrimary ? 'var(--grid-row-num-width)' : undefined,
                  zIndex: col.isPrimary ? 21 : undefined,
                }}
                data-icod-id={`src_features_sheets_grid_sheetgrid_tsx_dc1c_${col.id}`}>
                <GridHeaderCell
                  column={col}
                  userRole={userRole}
                  isScrolled={col.isPrimary ? isScrolled : false}
                  onRename={handleRenameColumn}
                  onEditProperties={handleEditColumnProperties}
                  onDelete={handleDeleteColumn}
                  onInsertLeft={(id) => handleInsertColumn(id, 'left')}
                  onInsertRight={(id) => handleInsertColumn(id, 'right')}
                  onDragStart={handleColDragStart}
                  onDragOver={() => {}}
                  onDrop={handleColDrop}
                  onSetPrimary={canEdit && !col.isPrimary && col.type === 'text' ? handleSetPrimaryColumn : undefined}
                  data-icod-id={`src_features_sheets_grid_sheetgrid_tsx_aa0f_${col.id}`} />
              </div>
            ))}

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

          {/* Data rows (virtualized) */}
          {visibleRows.map((rowIdx) => {
            const row = rows[rowIdx];
            const isBlankRow = !row;
            const top = HEADER_HEIGHT + rowIdx * ROW_HEIGHT;
            const isRowHovered = hoveredRowIndex === rowIdx;

            return (
              <div
                key={rowIdx}
                className="absolute flex w-max"
                style={{
                  top,
                  height: ROW_HEIGHT,
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
                    isSelected={false}
                    onSelectRow={() => {}}
                    onInsertAbove={handleInsertRowAbove}
                    onInsertBelow={handleInsertRowBelow}
                    onDeleteRows={handleDeleteRows}
                    onDragStart={handleRowDragStart}
                    onDragOver={() => {}}
                    onDrop={handleRowDrop}
                    data-icod-id={`src_features_sheets_grid_sheetgrid_tsx_6b31_${rowIdx}`} />
                </div>
                {/* Data cells */}
                {columns.map((col, colIdx) => {
                  const cellValue = row ? (row.cells[col.id] ?? null) : null;
                  const isActive = selection.isActiveCell(rowIdx, colIdx);
                  const isSelected = selection.isCellSelected(rowIdx, colIdx);
                  const isEditing = selection.editingCell?.rowIdx === rowIdx && selection.editingCell?.colIdx === colIdx;

                  return (
                    <div
                      key={col.id}
                      style={{
                        width: col.isPrimary ? PRIMARY_COL_WIDTH : DEFAULT_COL_WIDTH,
                        minWidth: col.isPrimary ? PRIMARY_COL_WIDTH : DEFAULT_COL_WIDTH,
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
                        onAddDropdownOption={handleAddDropdownOption}
                        isPrimary={!!col.isPrimary}
                        isScrolled={col.isPrimary ? isScrolled : false}
                        isRowHovered={col.isPrimary ? isRowHovered : false}
                        data-icod-id={`src_features_sheets_grid_sheetgrid_tsx_1587_${rowIdx}_${col.id}`} />
                    </div>
                  );
                })}
              </div>
            );
          })}
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
