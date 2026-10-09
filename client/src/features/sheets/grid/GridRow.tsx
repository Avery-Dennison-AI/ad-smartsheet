import GridRowNumCell from './GridRowNumCell';
import GridCell from './GridCell';
import { getColWidth, getRowHeight } from './gridHelpers';
import type { Column, GridRow as GridRowType, WorkspaceRole } from '@/types';
import type { DropPosition } from './useRowOperations';
import { PanelRightOpen, MessageSquare, Paperclip } from 'lucide-react';
import { IconButton } from '@/components/ui';

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
  onDragStart: (e: React.DragEvent, rowId: string) => void;
  onDragOver: (e: React.DragEvent, targetRowId: string) => void;
  onDrop: (targetRowId: string, position: DropPosition) => void;
  onDragEnd: () => void;
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
  /** Drag-and-drop visual state */
  draggedRowIds?: Set<string>;
  dropTargetRowId?: string | null;
  dropPosition?: DropPosition | null;
  /** Open item detail panel callback */
  onOpenItem?: (rowId: string, tab?: 'comments' | 'activity' | 'attachments') => void;
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
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
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
  draggedRowIds,
  dropTargetRowId,
  dropPosition,
  onOpenItem,
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

  // Drag visual state
  const isDraggedRow = row ? draggedRowIds?.has(row.id) ?? false : false;
  const isDropTarget = row ? dropTargetRowId === row.id : false;

  return (
    <div
      key={rowIdx}
      className={`absolute flex w-max ${isDraggedRow ? 'opacity-40' : ''}`}
      style={{ top, height: rowH, willChange: 'transform' }}
      onMouseEnter={() => setHoveredRowIndex(rowIdx)}
      onMouseLeave={() => setHoveredRowIndex((prev) => prev === rowIdx ? null : prev)}
      onDragOver={(e) => {
        if (!row || !canEdit) return;
        e.preventDefault();
        e.stopPropagation();
        onDragOver(e, row.id);
      }}
      onDrop={(e) => {
        if (!row || !canEdit) return;
        e.preventDefault();
        e.stopPropagation();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const position: DropPosition = e.clientY < midY ? 'above' : 'below';
        onDrop(row.id, position);
      }}
      onDragEnd={onDragEnd}
      data-icod-id="src_features_sheets_grid_gridrow_tsx_cce7">
      {/* Drop insertion line indicator */}
      {isDropTarget && dropPosition && (
        <div
          className="pointer-events-none absolute left-0 right-0 h-[2px] bg-primary"
          style={{
            top: dropPosition === 'above' ? -1 : undefined,
            bottom: dropPosition === 'below' ? -1 : undefined,
            zIndex: 'var(--z-grid-header)',
          }}
          data-icod-id="src_features_sheets_grid_gridrow_tsx_drop_line" />
      )}
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
          onDragStart={onDragStart}
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
          onOpenItem={!isBlankRow && row?.id && onOpenItem ? (rowId) => onOpenItem(rowId) : undefined}
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
            {/* Icon group on primary cell — paperclip + comment badge + open details button */}
            {col.isPrimary && !isBlankRow && row?.id && ((row.commentCount ?? 0) > 0 || (row.attachmentCount ?? 0) > 0 || isRowHovered) && (
              <div
                className="absolute right-1 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1 flex-shrink-0"
                data-icod-id={`src_features_sheets_grid_gridrow_tsx_icongroup_${row.id}`}>
                {/* Attachment count badge */}
                {(row.attachmentCount ?? 0) > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenItem?.(row.id, 'attachments');
                    }}
                    className="flex shrink-0 items-center gap-0.5 rounded px-1 py-0.5 text-[10px] text-muted-foreground hover:bg-muted/50"
                    title="View attachments"
                    data-icod-id={`src_features_sheets_grid_gridrow_tsx_attachments_${row.id}`}>
                    <Paperclip
                      className="h-3 w-3"
                      data-icod-id={`src_features_sheets_grid_gridrow_tsx_clipicon_${row.id}`} />
                    <span data-icod-id={`src_features_sheets_grid_gridrow_tsx_clipcount_${row.id}`}>{row.attachmentCount}</span>
                  </button>
                )}
                {/* Comment count badge */}
                {(row.commentCount ?? 0) > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenItem?.(row.id, 'comments');
                    }}
                    className="flex shrink-0 items-center gap-0.5 rounded px-1 py-0.5 text-[10px] text-muted-foreground hover:bg-muted/50"
                    title="View comments"
                    data-icod-id={`src_features_sheets_grid_gridrow_tsx_comments_${row.id}`}>
                    <MessageSquare
                      className="h-3 w-3"
                      data-icod-id={`src_features_sheets_grid_gridrow_tsx_6b07_${col.id}`} />
                    <span data-icod-id={`src_features_sheets_grid_gridrow_tsx_4fe6_${col.id}`}>{row.commentCount}</span>
                  </button>
                )}
                {/* Open details button - visible on hover */}
                {isRowHovered && (
                  <IconButton
                    size="sm"
                    tooltip="Open details"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenItem?.(row.id);
                    }}
                    className="shrink-0"
                    data-icod-id={`src_features_sheets_grid_gridrow_tsx_1dcd_${col.id}`}>
                    <PanelRightOpen
                      className="h-3.5 w-3.5"
                      data-icod-id={`src_features_sheets_grid_gridrow_tsx_1b53_${col.id}`} />
                  </IconButton>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
