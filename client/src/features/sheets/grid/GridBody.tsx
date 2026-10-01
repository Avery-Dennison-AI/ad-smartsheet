import GridRow from './GridRow';
import { DEFAULT_ROW_HEIGHT } from './gridHelpers';
import type { Column, GridRow as GridRowType, WorkspaceRole } from '@/types';

interface GridMember {
  id: string;
  fullName: string;
  email: string;
}

interface GridBodyProps {
  visibleRows: number[];
  rows: GridRowType[];
  columns: Column[];
  liveColumnWidths: Record<string, number>;
  rowPositions: { tops: number[]; total: number };
  liveRowHeights: Record<string, number> | null;
  wrapRowHeights: Record<string, number>;
  userRole: WorkspaceRole;
  canEdit: boolean;
  workspaceMembers?: GridMember[];
  hoveredRowIndex: number | null;
  setHoveredRowIndex: React.Dispatch<React.SetStateAction<number | null>>;
  isScrolled: boolean;
  // Selection state
  isActiveCell: (rowIdx: number, colIdx: number) => boolean;
  isCellSelected: (rowIdx: number, colIdx: number) => boolean;
  isRowSelected: (rowIdx: number) => boolean;
  isColSelected: (colIdx: number) => boolean;
  editingCell: { rowIdx: number; colIdx: number } | null;
  // Callbacks
  onCellCommit: (rowId: string, columnId: string, value: unknown) => void;
  onBlankRowCommit: (colIdx: number, value: unknown) => void;
  onStartEditing: (pos: { rowIdx: number; colIdx: number }) => void;
  onStopEditing: () => void;
  onCellClick: (rowIdx: number, colIdx: number, e: React.MouseEvent) => void;
  onSelectRow: (rowIdx: number, opts: { shift: boolean; meta: boolean }) => void;
  onInsertRowAbove: (rowId: string) => void;
  onInsertRowBelow: (rowId: string) => void;
  onRequestDeleteRows: (ids: string[]) => void;
  onRowDragStart: (rowIdx: number) => void;
  onRowDrop: (targetRowIdx: number) => void;
  onRowResizeStart: (e: React.MouseEvent, rowIndex: number) => void;
  onRowResizeDoubleClick: (rowIndex: number) => void;
  onRowContextMenu: (rowIndex: number, x: number, y: number) => void;
  onAddDropdownOption?: (columnId: string, label: string) => void;
  scrollNodeRef: React.MutableRefObject<HTMLDivElement | null>;
  rowResizeDrag: { rowIds: string[]; currentDelta: number; startHeights: Record<string, number> } | null;
  totalHeight: number;
  /** Hierarchy props */
  collapsedIds?: Set<string>;
  parentIds?: Set<string>;
  onToggleCollapse?: (rowId: string) => void;
  onIndentRow?: (rowId: string) => void;
  onOutdentRow?: (rowId: string) => void;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
  rowNumberMap?: Map<string, number>;
}

export default function GridBody({
  visibleRows,
  rows,
  columns,
  liveColumnWidths,
  rowPositions,
  liveRowHeights,
  wrapRowHeights,
  userRole,
  canEdit,
  workspaceMembers,
  hoveredRowIndex,
  setHoveredRowIndex,
  isScrolled,
  isActiveCell,
  isCellSelected,
  isRowSelected,
  isColSelected,
  editingCell,
  onCellCommit,
  onBlankRowCommit,
  onStartEditing,
  onStopEditing,
  onCellClick,
  onSelectRow,
  onInsertRowAbove,
  onInsertRowBelow,
  onRequestDeleteRows,
  onRowDragStart,
  onRowDrop,
  onRowResizeStart,
  onRowResizeDoubleClick,
  onRowContextMenu,
  onAddDropdownOption,
  scrollNodeRef,
  rowResizeDrag,
  totalHeight,
  collapsedIds,
  parentIds,
  onToggleCollapse,
  onIndentRow,
  onOutdentRow,
  onExpandAll,
  onCollapseAll,
  rowNumberMap,
}: GridBodyProps) {
  return (
    <div
      style={{ height: totalHeight, minWidth: 'max-content' }}
      className="relative"
      data-icod-id="src_features_sheets_grid_gridbody_tsx_1fd1">
      {visibleRows.map((rowIdx) => (
        <GridRow
          key={rowIdx}
          rowIdx={rowIdx}
          row={rows[rowIdx]}
          columns={columns}
          liveColumnWidths={liveColumnWidths}
          rowPositions={rowPositions}
          liveRowHeights={liveRowHeights}
          wrapRowHeights={wrapRowHeights}
          userRole={userRole}
          canEdit={canEdit}
          workspaceMembers={workspaceMembers}
          hoveredRowIndex={hoveredRowIndex}
          setHoveredRowIndex={setHoveredRowIndex}
          isScrolled={isScrolled}
          isActiveCell={isActiveCell}
          isCellSelected={isCellSelected}
          isRowSelected={isRowSelected}
          isColSelected={isColSelected}
          editingCell={editingCell}
          onCellCommit={onCellCommit}
          onBlankRowCommit={onBlankRowCommit}
          onStartEditing={onStartEditing}
          onStopEditing={onStopEditing}
          onCellClick={onCellClick}
          onSelectRow={onSelectRow}
          onInsertRowAbove={onInsertRowAbove}
          onInsertRowBelow={onInsertRowBelow}
          onRequestDeleteRows={onRequestDeleteRows}
          onRowDragStart={onRowDragStart}
          onRowDrop={onRowDrop}
          onRowResizeStart={onRowResizeStart}
          onRowResizeDoubleClick={onRowResizeDoubleClick}
          onRowContextMenu={onRowContextMenu}
          onAddDropdownOption={onAddDropdownOption}
          scrollNodeRef={scrollNodeRef}
          collapsedIds={collapsedIds}
          parentIds={parentIds}
          onToggleCollapse={onToggleCollapse}
          onIndentRow={onIndentRow}
          onOutdentRow={onOutdentRow}
          onExpandAll={onExpandAll}
          onCollapseAll={onCollapseAll}
          rowNumberMap={rowNumberMap}
          data-icod-id={`src_features_sheets_grid_gridbody_tsx_4447_${rowIdx}`} />
      ))}

      {/* Row resize guide line */}
      {rowResizeDrag && (
        <div
          className="pointer-events-none absolute left-0 right-0 h-px bg-primary"
          style={{
            zIndex: 'var(--z-dropdown)',
            top: (() => {
              if (rowResizeDrag.rowIds.length === 0) return 0;
              const lastRowId = rowResizeDrag.rowIds[rowResizeDrag.rowIds.length - 1];
              const rowIdx = rows.findIndex((r) => r.id === lastRowId);
              if (rowIdx === -1) return 0;
              const rowTop = rowPositions.tops[rowIdx] ?? 0;
              const rowH = liveRowHeights?.[lastRowId] ?? (rows[rowIdx]?.height ?? DEFAULT_ROW_HEIGHT);
              return rowTop + rowH;
            })(),
          }}
          data-icod-id="src_features_sheets_grid_gridbody_tsx_7a0e" />
      )}
    </div>
  );
}
