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
import { cn } from '@/utils/cn';
import { useGridSelection } from './useGridSelection';
import GridHeaderCell from './GridHeaderCell';
import GridRowNumCell from './GridRowNumCell';
import GridCell from './GridCell';
import ColumnTypeModal from './ColumnTypeModal';
import DropdownOptionsModal from './DropdownOptionsModal';
import type { Column, ColumnType, WorkspaceRole } from '@/types';

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

export default function SheetGrid({ sheetId, userRole }: SheetGridProps) {
  const dispatch = useAppDispatch();
  const columns = useAppSelector(selectGridColumns);
  const rows = useAppSelector(selectGridRows);
  const loading = useAppSelector(selectGridLoading);
  const workspaceMembers = useAppSelector(selectGridMembers);

  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(600);
  const observerRef = useRef<ResizeObserver | null>(null);
  const scrollNodeRef = useRef<HTMLDivElement | null>(null);

  // Modals state
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [typeModalColumnId, setTypeModalColumnId] = useState<string | null>(null);
  const [optionsModalOpen, setOptionsModalOpen] = useState(false);
  const [optionsModalColumnId, setOptionsModalColumnId] = useState<string | null>(null);
  // When true, the options modal is being shown as part of a type-change flow
  // (the column hasn't been saved as dropdown yet). On save we dispatch both
  // type + options in a single updateColumn call.
  const [pendingDropdownTypeChange, setPendingDropdownTypeChange] = useState(false);
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
  // scroll container mounts (after loading finishes). Replaces the old
  // useEffect([]) that failed because the container didn't exist during the
  // initial render while the spinner was showing.
  const scrollContainerRef = useCallback((node: HTMLDivElement | null) => {
    // Cleanup previous observer / listener
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    scrollNodeRef.current = node;

    if (!node) return;

    // Measure immediately
    setViewportHeight(node.clientHeight);

    // ResizeObserver for container resizes
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setViewportHeight(entry.contentRect.height);
      }
    });
    ro.observe(node);
    observerRef.current = ro;

    // Window resize listener for sidebar-collapse scenarios
    const handleWindowResize = () => {
      setViewportHeight(node.clientHeight);
    };
    window.addEventListener('resize', handleWindowResize);

    // Store cleanup on the node so we can tear down when it changes
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

  // Column operations
  const handleRenameColumn = useCallback(
    (columnId: string, name: string) => {
      dispatch(updateColumn({ sheetId, columnId, patch: { name } }));
    },
    [sheetId, dispatch],
  );

  const handleChangeColumnType = useCallback(
    (columnId: string) => {
      setTypeModalColumnId(columnId);
      setTypeModalOpen(true);
    },
    [],
  );

  const handleTypeSelect = useCallback(
    (type: ColumnType) => {
      if (!typeModalColumnId) return;

      if (type === 'dropdown') {
        // Chain: open options editor before saving the type change
        setPendingDropdownTypeChange(true);
        setOptionsModalColumnId(typeModalColumnId);
        setOptionsModalOpen(true);
      } else {
        dispatch(updateColumn({ sheetId, columnId: typeModalColumnId, patch: { type } }));
      }
    },
    [sheetId, typeModalColumnId, dispatch],
  );

  const handleEditOptions = useCallback(
    (columnId: string) => {
      setOptionsModalColumnId(columnId);
      setOptionsModalOpen(true);
    },
    [],
  );

  const handleOptionsSave = useCallback(
    (options: { label: string; color: string }[]) => {
      if (optionsModalColumnId) {
        if (pendingDropdownTypeChange) {
          // Type-change flow: save type + options together
          dispatch(updateColumn({ sheetId, columnId: optionsModalColumnId, patch: { type: 'dropdown', options } }));
          setPendingDropdownTypeChange(false);
        } else {
          // Normal edit-options flow
          dispatch(updateColumn({ sheetId, columnId: optionsModalColumnId, patch: { options } }));
        }
      }
    },
    [sheetId, optionsModalColumnId, pendingDropdownTypeChange, dispatch],
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
      dispatch(addColumn({ sheetId, data: { name: 'New Column', type: 'text', position } }));
    },
    [sheetId, columns, dispatch],
  );

  const handleSetPrimaryColumn = useCallback(
    (columnId: string) => {
      dispatch(setPrimaryColumn({ sheetId, columnId }));
    },
    [sheetId, dispatch],
  );

  // Row operations
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
        // Insert before this row by finding the previous row's ID
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

  // Cell operations
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
      // Only create a row if the value is non-empty
      if (value == null || value === '' || value === false) return;
      const col = columns[colIdx];
      if (!col) return;
      dispatch(addRow({ sheetId, data: { cells: { [col.id]: value } } }));
    },
    [sheetId, columns, dispatch],
  );

  // Column drag-and-drop
  const handleColDragStart = useCallback((colId: string) => {
    // Prevent dragging the primary column
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
          // Clamp: non-primary columns cannot be dropped before the primary column (index 0)
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

  // Row drag-and-drop
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

  // Get the column being edited for type modal
  const typeModalColumn = columns.find((c) => c.id === typeModalColumnId);
  const optionsModalColumn = columns.find((c) => c.id === optionsModalColumnId);

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
              className="sticky left-0 z-30 flex items-center justify-center border-b border-r bg-[var(--grid-header-bg)]"
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
                  zIndex: col.isPrimary ? 10 : undefined,
                }}
                data-icod-id={`src_features_sheets_grid_sheetgrid_tsx_dc1c_${col.id}`}>
                <GridHeaderCell
                  column={col}
                  userRole={userRole}
                  onRename={handleRenameColumn}
                  onChangeType={handleChangeColumnType}
                  onEditOptions={handleEditOptions}
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
                  onClick={() => dispatch(addColumn({ sheetId, data: { name: 'New Column', type: 'text' } }))}
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

            return (
              <div
                key={rowIdx}
                className="absolute flex w-max"
                style={{
                  top,
                  height: ROW_HEIGHT,
                  willChange: 'transform',
                }}
                data-icod-id={`src_features_sheets_grid_sheetgrid_tsx_d513_${rowIdx}`}>
                {/* Row number cell */}
                <div
                  className="sticky left-0 z-10"
                  style={{ width: 'var(--grid-row-num-width)' }}
                  data-icod-id={`src_features_sheets_grid_sheetgrid_tsx_e4b5_${rowIdx}`}>
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
                    data-icod-id={`src_features_sheets_grid_sheetgrid_tsx_581e_${rowIdx}`} />
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
                        zIndex: col.isPrimary ? 10 : undefined,
                      }}
                      data-icod-id={`src_features_sheets_grid_sheetgrid_tsx_07af_${rowIdx}_${col.id}`}>
                      <GridCell
                        column={col}
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
                        data-icod-id={`src_features_sheets_grid_sheetgrid_tsx_5e20_${rowIdx}_${col.id}`} />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      {/* Modals */}
      <ColumnTypeModal
        open={typeModalOpen}
        onClose={() => setTypeModalOpen(false)}
        currentType={typeModalColumn?.type || 'text'}
        onSelect={handleTypeSelect}
        data-icod-id="src_features_sheets_grid_sheetgrid_tsx_7860" />
      <DropdownOptionsModal
        open={optionsModalOpen}
        onClose={() => setOptionsModalOpen(false)}
        options={optionsModalColumn?.options || []}
        onSave={handleOptionsSave}
        data-icod-id="src_features_sheets_grid_sheetgrid_tsx_6f88" />
      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Delete column"
        description="This will permanently delete this column and all its data. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDeleteColumn}
        data-icod-id="src_features_sheets_grid_sheetgrid_tsx_ca62" />
    </div>
  );
}
