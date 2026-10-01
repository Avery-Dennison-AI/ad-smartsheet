import GridRowNumCell from './GridRowNumCell';
import GridCell from './GridCell';
import { getColWidth, getRowHeight } from './gridHelpers';
import type { Column, GridRow as GridRowType, WorkspaceRole } from '@/types';

interface GridMember {
  id: string;
  fullName: string;
  email: string;
}

interface GridRowProps {
  rowIdx: number;
  row: GridRowType | undefined;
  columns: Column[];
  liveColumnWidths: Record<string, number>;
  rowPositions: { tops: number[] };
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

export default function GridRow({
  rowIdx,
  row,
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
  collapsedIds,
  parentIds,
  onToggleCollapse,
  onIndentRow,
  onOutdentRow,
  onExpandAll,
  onCollapseAll,
  rowNumberMap,
}: GridRowProps) {
  const isBlankRow = !row;
  const rowH = liveRowHeights && row && liveRowHeights[row.id] !== undefined
    ? liveRowHeights[row.id]
    : (row && wrapRowHeights[row.id] !== undefined)
      ? wrapRowHeights[row.id]
      : getRowHeight(row);
  const top = rowPositions.tops[rowIdx];
  const isRowHovered = hoveredRowIndex === rowIdx;

  // Hierarchy metadata for this row
  const rowDepth = row?.depth ?? 0;
  const rowParentId = row?.parentId ?? null;
  const rowIsCollapsed = row ? collapsedIds?.has(row.id) ?? false : false;
  const visibleRowNumber = row ? rowNumberMap?.get(row.id) : undefined;
  const rowHasChildren = row ? parentIds?.has(row.id) ?? false : false;

  return (
    <div
      key={rowIdx}
      className="absolute flex w-max"
      style={{ top, height: rowH, willChange: 'transform' }}
      onMouseEnter={() => setHoveredRowIndex(rowIdx)}
      onMouseLeave={() => setHoveredRowIndex((prev) => prev === rowIdx ? null : prev)}
      data-icod-id="src_features_sheets_grid_gridrow_tsx_cce7">
      {/* Row number cell */}
      <div
        className="sticky left-0"
        style={{ width: 'var(--grid-row-num-width)', zIndex: 'calc(var(--z-grid-sticky) + 10)' }}
        data-icod-id="src_features_sheets_grid_gridrow_tsx_e176">
        <GridRowNumCell
          rowNumber={visibleRowNumber ?? (rowIdx + 1)}
          rowIndex={rowIdx}
          rowId={row?.id}
          userRole={userRole}
          isSelected={isRowSelected(rowIdx)}
          onSelectRow={onSelectRow}
          onInsertAbove={onInsertRowAbove}
          onInsertBelow={onInsertRowBelow}
          onRequestDeleteRows={onRequestDeleteRows}
          onDragStart={onRowDragStart}
          onDragOver={() => {}}
          onDrop={onRowDrop}
          onRowResizeStart={onRowResizeStart}
          onRowResizeDoubleClick={onRowResizeDoubleClick}
          onRowContextMenu={!isBlankRow ? onRowContextMenu : undefined}
          canIndent={!!row && rowDepth < 10}
          canOutdent={!!rowParentId}
          onIndent={!isBlankRow ? onIndentRow : undefined}
          onOutdent={!isBlankRow ? onOutdentRow : undefined}
          hasChildren={rowHasChildren}
          isCollapsed={rowIsCollapsed}
          onToggleCollapse={!isBlankRow ? onToggleCollapse : undefined}
          onExpandAll={onExpandAll}
          onCollapseAll={onCollapseAll}
          data-icod-id="src_features_sheets_grid_gridrow_tsx_994c" />
      </div>
      {/* Data cells */}
      {columns.map((col, colIdx) => {
        const cellValue = row ? (row.cells[col.id] ?? null) : null;
        const isActive = isActiveCell(rowIdx, colIdx);
        const isSelected = isCellSelected(rowIdx, colIdx);
        const isEditing = editingCell?.rowIdx === rowIdx && editingCell?.colIdx === colIdx;
        const colW = liveColumnWidths[col.id] ?? getColWidth(col);

        return (
          <div
            key={col.id}
            style={{
              width: colW,
              minWidth: colW,
              position: col.isPrimary ? 'sticky' : undefined,
              left: col.isPrimary ? 'var(--grid-row-num-width)' : undefined,
              zIndex: col.isPrimary ? 'calc(var(--z-grid-sticky) + 9)' : undefined,
            }}
            data-icod-id={`src_features_sheets_grid_gridrow_tsx_aeab_${col.id}`}>
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
                  onBlankRowCommit(colIdx, val);
                } else {
                  onCellCommit(row.id, col.id, val);
                }
              }}
              onStartEdit={() => onStartEditing({ rowIdx, colIdx })}
              onStopEdit={onStopEditing}
              onCellClick={(e) => {
                onCellClick(rowIdx, colIdx, e);
                scrollNodeRef.current?.focus();
              }}
              onAddDropdownOption={onAddDropdownOption}
              isPrimary={!!col.isPrimary}
              isScrolled={col.isPrimary ? isScrolled : false}
              isRowHovered={col.isPrimary ? isRowHovered : false}
              isRowSelected={isRowSelected(rowIdx)}
              isColSelected={isColSelected(colIdx)}
              onContextMenu={!isBlankRow ? onRowContextMenu : undefined}
              rowIndex={rowIdx}
              depth={col.isPrimary ? rowDepth : undefined}
              hasChildren={col.isPrimary ? rowHasChildren : undefined}
              isCollapsed={col.isPrimary ? rowIsCollapsed : undefined}
              onToggleCollapse={col.isPrimary && !isBlankRow && row?.id ? () => onToggleCollapse?.(row.id) : undefined}
              data-icod-id={`src_features_sheets_grid_gridrow_tsx_4e48_${col.id}`} />
          </div>
        );
      })}
    </div>
  );
}
