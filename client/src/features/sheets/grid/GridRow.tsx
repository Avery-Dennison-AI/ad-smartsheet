import GridRowNumCell from './GridRowNumCell';
import GridCell from './GridCell';
import type { Column, GridRow as GridRowType, WorkspaceRole } from '@/types';

const DEFAULT_ROW_HEIGHT = 34;
const DEFAULT_COL_WIDTH = 160;
const PRIMARY_COL_WIDTH = 240;

function getColWidth(col: { isPrimary?: boolean; width?: number }): number {
  return col.width ?? (col.isPrimary ? PRIMARY_COL_WIDTH : DEFAULT_COL_WIDTH);
}

function getRowHeight(row: { height?: number } | undefined): number {
  return row?.height ?? DEFAULT_ROW_HEIGHT;
}

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
}

export default function GridRow({
  rowIdx,
  row,
  columns,
  liveColumnWidths,
  rowPositions,
  liveRowHeights,
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
}: GridRowProps) {
  const isBlankRow = !row;
  const rowH = liveRowHeights && row && liveRowHeights[row.id] !== undefined
    ? liveRowHeights[row.id]
    : getRowHeight(row);
  const top = rowPositions.tops[rowIdx];
  const isRowHovered = hoveredRowIndex === rowIdx;

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
          rowNumber={rowIdx + 1}
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
              data-icod-id={`src_features_sheets_grid_gridrow_tsx_4e48_${col.id}`} />
          </div>
        );
      })}
    </div>
  );
}
