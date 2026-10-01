import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { Spinner, Button } from '@/components/ui';
import type { DropdownMenuItem } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchGrid,
  updateCell,
  addRow,
  optimisticUpdateCell,
  rollbackCell,
  selectGridColumns,
  selectGridRows,
  selectGridLoading,
  selectGridMembers,
} from '@/store/slices/gridSlice';
import { useGridSelection } from './useGridSelection';
import { useGridVirtualization } from './useGridVirtualization';
import { useWrapRowHeights } from './useWrapRowHeights';
import { useColumnOperations, defaultColumnPropertiesState } from './useColumnOperations';
import { useRowOperations } from './useRowOperations';
import { useRowCollapse } from './useRowCollapse';
import { getVisibleRows, getAllParentIds, getDescendantIds } from './hierarchyHelpers';
import GridHeaderRow from './GridHeaderRow';
import GridBody from './GridBody';
import GridDialogs from './GridDialogs';
import FormattingToolbar from './FormattingToolbar';
import { getColWidth, DEFAULT_ROW_HEIGHT, HEADER_HEIGHT } from './gridHelpers';
import type { WorkspaceRole } from '@/types';

const MIN_BLANK_ROWS = 50;

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

  const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number; rowIndex: number } | null>(null);

  const canEdit = userRole === 'editor' || userRole === 'admin' || userRole === 'owner';

  // ─── Row collapse state ──────────────────────────────────────────────
  const { collapsedIds, toggleCollapse, expandAll, collapseAll } = useRowCollapse(sheetId);

  // ─── Hierarchy computations ──────────────────────────────────────────
  const visibleRows = useMemo(
    () => getVisibleRows(rows, collapsedIds),
    [rows, collapsedIds],
  );

  const parentIds = useMemo(() => new Set(getAllParentIds(rows)), [rows]);

  const rowNumberMap = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((row, idx) => {
      map.set(row.id, idx + 1);
    });
    return map;
  }, [rows]);

  // Load grid on mount
  useEffect(() => {
    dispatch(fetchGrid(sheetId));
  }, [sheetId, dispatch]);

  // ─── Hooks ──────────────────────────────────────────────────────────────

  const colOps = useColumnOperations(sheetId);
  const rowOps = useRowOperations(sheetId);

  // Descendant count for delete confirmation dialog
  const pendingDeleteDescendantCount = useMemo(() => {
    if (!rowOps.pendingDeleteRowIds) return 0;
    let count = 0;
    for (const id of rowOps.pendingDeleteRowIds) {
      count += getDescendantIds(rows, id).length;
    }
    return count;
  }, [rowOps.pendingDeleteRowIds, rows]);

  // ─── Column widths (needed before virtualization for wrap height calc) ──

  const liveColumnWidths = useMemo(() => {
    const map: Record<string, number> = {};
    for (const col of columns) {
      map[col.id] = getColWidth(col);
    }
    if (colOps.colResizeDrag) {
      map[colOps.colResizeDrag.columnId] = colOps.colResizeDrag.currentWidth;
    }
    return map;
  }, [columns, colOps.colResizeDrag]);

  // ─── Wrap text row heights ──────────────────────────────────────────────

  const wrapRowHeights = useWrapRowHeights({
    rows,
    columns,
    liveColWidths: liveColumnWidths,
  });

  const virtualization = useGridVirtualization({
    rows: visibleRows,
    blankRowCount: MIN_BLANK_ROWS,
    defaultRowHeight: DEFAULT_ROW_HEIGHT,
    effectiveRowHeights: wrapRowHeights,
  });

  // Selection hook
  const selection = useGridSelection({
    rowCount: virtualization.totalRows,
    colCount: columns.length,
    onClearCells: (positions) => {
      for (const pos of positions) {
        const row = visibleRows[pos.rowIdx];
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

  // Connect selection hook's containerRef to the scroll container
  useEffect(() => {
    (selection.containerRef as React.MutableRefObject<HTMLDivElement | null>).current = virtualization.scrollNodeRef.current;
  }, [selection.containerRef, loading]);

  // Derive activeCell and selectedCells for FormattingToolbar
  const fmtActiveCell = useMemo(() => {
    if (!selection.activeCell) return null;
    const row = visibleRows[selection.activeCell.rowIdx];
    const col = columns[selection.activeCell.colIdx];
    if (!row || !col) return null;
    return { rowId: row.id, columnId: col.id };
  }, [selection.activeCell, visibleRows, columns]);

  const fmtSelectedCells = useMemo(() => {
    const cells = selection.getSelectedCells();
    return cells
      .map((pos) => {
        const row = visibleRows[pos.rowIdx];
        const col = columns[pos.colIdx];
        if (!row || !col) return null;
        return { rowId: row.id, columnId: col.id };
      })
      .filter(Boolean) as Array<{ rowId: string; columnId: string }>;
  }, [selection, visibleRows, columns]);

  // ─── Live row heights during resize ─────────────────────────────────────

  const liveRowHeights = useMemo(() => {
    if (!rowOps.rowResizeDrag) return null;
    const map: Record<string, number> = {};
    for (const rowId of rowOps.rowResizeDrag.rowIds) {
      const startH = rowOps.rowResizeDrag.startHeights[rowId] ?? DEFAULT_ROW_HEIGHT;
      const newH = Math.max(34, Math.min(400, startH + rowOps.rowResizeDrag.currentDelta));
      map[rowId] = newH;
    }
    return map;
  }, [rowOps.rowResizeDrag]);

  // ─── Cell operations ────────────────────────────────────────────────────

  const handleCellCommit = useCallback(
    (rowId: string, columnId: string, value: unknown) => {
      const row = visibleRows.find((r) => r.id === rowId);
      const prevValue = row?.cells[columnId] ?? null;
      dispatch(optimisticUpdateCell({ rowId, columnId, value }));
      dispatch(updateCell({ sheetId, rowId, columnId, value }))
        .unwrap()
        .catch(() => {
          dispatch(rollbackCell({ rowId, columnId, previousValue: prevValue }));
        });
    },
    [sheetId, visibleRows, dispatch],
  );

  const handleBlankRowCommit = useCallback(
    (colIdx: number, value: unknown) => {
      if (value == null || value === '' || value === false) return;
      const col = columns[colIdx];
      if (!col) return;
      dispatch(addRow({ sheetId, data: { cells: { [col.id]: value } } }));
    },
    [sheetId, columns, dispatch],
  );

  // ─── Context menu handler ──────────────────────────────────────────────

  const handleRowContextMenu = useCallback(
    (rowIndex: number, x: number, y: number) => {
      const row = visibleRows[rowIndex];
      if (!row || !canEdit) return;
      setContextMenuPos({ x, y, rowIndex });
    },
    [visibleRows, canEdit],
  );

  // Close context menu on outside click / scroll
  useEffect(() => {
    if (!contextMenuPos) return;
    const close = () => setContextMenuPos(null);
    document.addEventListener('mousedown', close);
    window.addEventListener('scroll', close, { capture: true, passive: true });
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('scroll', close, { capture: true });
    };
  }, [contextMenuPos]);

  // ─── Keyboard shortcut: Ctrl/Cmd + Minus to delete selected rows ──────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '-' && (e.ctrlKey || e.metaKey)) {
        if (!virtualization.scrollNodeRef.current?.contains(document.activeElement as Node)) return;
        if (selection.selectedRowIndices.size === 0) return;
        e.preventDefault();
        const rowIds: string[] = [];
        for (const idx of selection.selectedRowIndices) {
          const row = visibleRows[idx];
          if (row) rowIds.push(row.id);
        }
        if (rowIds.length > 0) {
          rowOps.setPendingDeleteRowIds(rowIds);
        }
      }
      // Ctrl/Cmd+] → indent
      if (e.key === ']' && (e.ctrlKey || e.metaKey)) {
        if (!canEdit) return;
        if (!virtualization.scrollNodeRef.current?.contains(document.activeElement as Node)) return;
        if (selection.selectedRowIndices.size === 0) return;
        e.preventDefault();
        const rowIds: string[] = [];
        for (const idx of selection.selectedRowIndices) {
          const row = visibleRows[idx];
          if (row) rowIds.push(row.id);
        }
        if (rowIds.length > 0) {
          rowOps.indentRows(rowIds);
        }
      }
      // Ctrl/Cmd+[ → outdent
      if (e.key === '[' && (e.ctrlKey || e.metaKey)) {
        if (!canEdit) return;
        if (!virtualization.scrollNodeRef.current?.contains(document.activeElement as Node)) return;
        if (selection.selectedRowIndices.size === 0) return;
        e.preventDefault();
        const rowIds: string[] = [];
        for (const idx of selection.selectedRowIndices) {
          const row = visibleRows[idx];
          if (row) rowIds.push(row.id);
        }
        if (rowIds.length > 0) {
          rowOps.outdentRows(rowIds);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selection.selectedRowIndices, visibleRows, virtualization.scrollNodeRef, rowOps, canEdit]);

  // Row resize start wrapper that passes selectedRowIndices
  const handleRowResizeStartWrapper = useCallback(
    (e: React.MouseEvent, rowIndex: number) => {
      rowOps.handleRowResizeStart(e, rowIndex, selection.selectedRowIndices);
    },
    [rowOps, selection.selectedRowIndices],
  );

  // Confirm delete rows wrapper
  const handleConfirmDeleteRows = useCallback((includeDescendants?: boolean) => {
    rowOps.confirmDeleteRows(
      selection.selectedRowIndices,
      selection.clearRowColumnSelection,
      selection.selectRow,
      includeDescendants,
    );
  }, [rowOps, selection]);

  if (loading) {
    return (
      <div
        className="flex h-full items-center justify-center"
        data-icod-id="src_features_sheets_grid_sheetgrid_tsx_8fa5">
        <Spinner size="lg" data-icod-id="src_features_sheets_grid_sheetgrid_tsx_86af" />
      </div>
    );
  }

  return (
    <div
      className="relative flex h-full flex-col overflow-hidden"
      data-icod-id="src_features_sheets_grid_sheetgrid_tsx_c38a">
      {/* Formatting toolbar */}
      <FormattingToolbar
        sheetId={sheetId}
        userRole={userRole}
        activeCell={fmtActiveCell}
        selectedCells={fmtSelectedCells}
        selectedRows={selection.selectedRowIndices}
        selectedColumns={selection.selectedColIndices}
        columns={columns}
        rows={visibleRows}
        onReturnFocus={() => virtualization.scrollNodeRef.current?.focus()}
        onIndentRows={() => {
          const rowIds: string[] = [];
          for (const idx of selection.selectedRowIndices) {
            const row = visibleRows[idx];
            if (row) rowIds.push(row.id);
          }
          if (rowIds.length > 0) rowOps.indentRows(rowIds);
        }}
        onOutdentRows={() => {
          const rowIds: string[] = [];
          for (const idx of selection.selectedRowIndices) {
            const row = visibleRows[idx];
            if (row) rowIds.push(row.id);
          }
          if (rowIds.length > 0) rowOps.outdentRows(rowIds);
        }}
        data-icod-id="src_features_sheets_grid_sheetgrid_tsx_fb36" />
      {/* Scrollable grid container */}
      <div
        ref={virtualization.scrollContainerRef}
        className="flex-1 overflow-auto"
        onScroll={virtualization.onScroll}
        onContextMenu={(e) => e.preventDefault()}
        tabIndex={0}
        data-icod-id="src_features_sheets_grid_sheetgrid_tsx_scroll">
        <div
          style={{ minWidth: 'max-content' }}
          data-icod-id="src_features_sheets_grid_sheetgrid_tsx_333a">
          <GridHeaderRow
            columns={columns}
            liveColumnWidths={liveColumnWidths}
            userRole={userRole}
            isScrolled={virtualization.isScrolled}
            canEdit={canEdit}
            isColSelected={selection.isColSelected}
            onRename={colOps.handleRenameColumn}
            onEditProperties={colOps.handleEditColumnProperties}
            onDelete={colOps.handleDeleteColumn}
            onInsertLeft={(id) => colOps.handleInsertColumn(id, 'left')}
            onInsertRight={(id) => colOps.handleInsertColumn(id, 'right')}
            onSelectColumn={selection.selectColumn}
            onDragStart={colOps.handleColDragStart}
            onDrop={colOps.handleColDrop}
            onSetPrimary={colOps.handleSetPrimaryColumn}
            onColumnResizeStart={colOps.handleColumnResizeStart}
            onColumnResizeDoubleClick={colOps.handleColumnResizeDoubleClick}
            onAddColumn={() => colOps.setColPropsModal({
              open: true,
              columnId: null,
              initialName: '',
              initialType: 'text',
              initialOptions: [],
              isPrimary: false,
              existingCellCount: 0,
              insertPosition: null,
            })}
            colResizeDrag={colOps.colResizeDrag}
            data-icod-id="src_features_sheets_grid_sheetgrid_tsx_5930" />
          <GridBody
            visibleRows={virtualization.visibleRows}
            rows={visibleRows}
            columns={columns}
            liveColumnWidths={liveColumnWidths}
            rowPositions={virtualization.rowPositions}
            liveRowHeights={liveRowHeights}
            wrapRowHeights={wrapRowHeights}
            userRole={userRole}
            canEdit={canEdit}
            workspaceMembers={workspaceMembers}
            hoveredRowIndex={hoveredRowIndex}
            setHoveredRowIndex={setHoveredRowIndex}
            isScrolled={virtualization.isScrolled}
            isActiveCell={selection.isActiveCell}
            isCellSelected={selection.isCellSelected}
            isRowSelected={selection.isRowSelected}
            isColSelected={selection.isColSelected}
            editingCell={selection.editingCell}
            onCellCommit={handleCellCommit}
            onBlankRowCommit={handleBlankRowCommit}
            onStartEditing={selection.startEditing}
            onStopEditing={selection.stopEditing}
            onCellClick={(rowIdx, colIdx, e) => selection.handleCellClick(rowIdx, colIdx, e.shiftKey)}
            onSelectRow={selection.selectRow}
            onInsertRowAbove={rowOps.handleInsertRowAbove}
            onInsertRowBelow={rowOps.handleInsertRowBelow}
            onRequestDeleteRows={rowOps.setPendingDeleteRowIds}
            onRowDragStart={rowOps.handleRowDragStart}
            onRowDrop={rowOps.handleRowDrop}
            onRowResizeStart={handleRowResizeStartWrapper}
            onRowResizeDoubleClick={rowOps.handleRowResizeDoubleClick}
            onRowContextMenu={handleRowContextMenu}
            onAddDropdownOption={colOps.handleAddDropdownOption}
            collapsedIds={collapsedIds}
            parentIds={parentIds}
            onToggleCollapse={toggleCollapse}
            onIndentRow={(rowId) => rowOps.indentRows([rowId])}
            onOutdentRow={(rowId) => rowOps.outdentRows([rowId])}
            onExpandAll={expandAll}
            onCollapseAll={() => collapseAll(getAllParentIds(rows))}
            rowNumberMap={rowNumberMap}
            scrollNodeRef={virtualization.scrollNodeRef}
            rowResizeDrag={rowOps.rowResizeDrag}
            totalHeight={virtualization.rowPositions.total}
            data-icod-id="src_features_sheets_grid_sheetgrid_tsx_a98f" />
        </div>
      </div>
      {/* Dialogs */}
      <GridDialogs
        colPropsModal={colOps.colPropsModal}
        onCloseColProps={() => colOps.setColPropsModal(defaultColumnPropertiesState)}
        onSaveColProps={colOps.handleColumnPropertiesSave}
        deleteConfirmOpen={colOps.deleteConfirmOpen}
        onCloseDeleteConfirm={() => colOps.setDeleteConfirmOpen(false)}
        onConfirmDeleteColumn={colOps.confirmDeleteColumn}
        pendingDeleteRowIds={rowOps.pendingDeleteRowIds}
        onCloseDeleteRows={() => rowOps.setPendingDeleteRowIds(null)}
        onConfirmDeleteRows={handleConfirmDeleteRows}
        descendantCount={pendingDeleteDescendantCount}
        data-icod-id="src_features_sheets_grid_sheetgrid_tsx_16d2" />
      {/* Floating context menu for right-click on rows */}
      {contextMenuPos && (() => {
        const ctxRow = visibleRows[contextMenuPos.rowIndex];
        if (!ctxRow) return null;

        const ctxItems: DropdownMenuItem[] = [];
        if (canEdit) {
          ctxItems.push(
            { label: 'Insert row above', onClick: () => rowOps.handleInsertRowAbove(ctxRow.id) },
            { label: 'Insert row below', onClick: () => rowOps.handleInsertRowBelow(ctxRow.id) },
            { type: 'divider' },
            { label: 'Indent', onClick: () => rowOps.indentRows([ctxRow.id]) },
            { label: 'Outdent', onClick: () => rowOps.outdentRows([ctxRow.id]) },
            { type: 'divider' },
            {
              label: `Delete ${selection.selectedRowIndices.size > 1 ? `${selection.selectedRowIndices.size} rows` : 'row'}`,
              danger: true,
              onClick: () => {
                const ids: string[] = [];
                if (selection.selectedRowIndices.size > 1) {
                  for (const idx of selection.selectedRowIndices) {
                    const r = visibleRows[idx];
                    if (r) ids.push(r.id);
                  }
                } else {
                  ids.push(ctxRow.id);
                }
                rowOps.setPendingDeleteRowIds(ids);
              },
            },
          );
        }

        if (ctxItems.length === 0) return null;

        let left = contextMenuPos.x;
        let top = contextMenuPos.y;
        const menuWidth = 200;
        const menuHeight = ctxItems.length * 36 + 8;
        if (left + menuWidth > window.innerWidth) left = window.innerWidth - menuWidth - 8;
        if (top + menuHeight > window.innerHeight) top = window.innerHeight - menuHeight - 8;

        return ReactDOM.createPortal(
          <div
            className="fixed min-w-[180px] rounded-[var(--radius-md)] border border-border bg-card py-1 shadow-[var(--shadow-md)]"
            style={{ zIndex: 'var(--z-dropdown)', left, top }}
            onMouseDown={(e) => e.stopPropagation()}
            data-icod-id="src_features_sheets_grid_sheetgrid_tsx_989a">
            {ctxItems.map((item, index) => {
              if (item.type === 'divider') {
                return (
                  <div
                    key={`ctx-div-${index}`}
                    className="my-1 border-t border-border"
                    data-icod-id={`src_features_sheets_grid_sheetgrid_tsx_3177_${index}`} />
                );
              }
              return (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className={`w-full justify-start gap-2 px-3 py-1.5 text-sm ${item.danger ? 'text-destructive hover:bg-destructive/10' : ''}`}
                  onClick={() => {
                    item.onClick?.();
                    setContextMenuPos(null);
                  }}
                  data-icod-id={`src_features_sheets_grid_sheetgrid_tsx_24fa_${index}`}>
                  <span
                    className="flex-1 text-left"
                    data-icod-id={`src_features_sheets_grid_sheetgrid_tsx_5bc2_${index}`}>{item.label}</span>
                </Button>
              );
            })}
          </div>,
          document.body,
        );
      })()}
    </div>
  );
}
