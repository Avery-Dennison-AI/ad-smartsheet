import { Plus } from 'lucide-react';
import { Button } from '@/components/ui';
import GridHeaderCell from './GridHeaderCell';
import { getColWidth, HEADER_HEIGHT } from './gridHelpers';
import type { Column, WorkspaceRole } from '@/types';

interface GridHeaderRowProps {
  columns: Column[];
  liveColumnWidths: Record<string, number>;
  userRole: WorkspaceRole;
  isScrolled: boolean;
  canEdit: boolean;
  isColSelected: (colIdx: number) => boolean;
  onRename: (columnId: string, name: string) => void;
  onEditProperties: (columnId: string) => void;
  onDelete: (columnId: string) => void;
  onInsertLeft: (id: string) => void;
  onInsertRight: (id: string) => void;
  onSelectColumn: (colIdx: number, opts: { shift: boolean; meta: boolean }) => void;
  onDragStart: (colId: string) => void;
  onDrop: (targetColId: string) => void;
  onSetPrimary: ((columnId: string) => void) | undefined;
  onColumnResizeStart: (e: React.MouseEvent, columnId: string) => void;
  onColumnResizeDoubleClick: (columnId: string) => void;
  onAddColumn: () => void;
  colResizeDrag: { columnId: string; currentWidth: number } | null;
}

export default function GridHeaderRow({
  columns,
  liveColumnWidths,
  userRole,
  isScrolled,
  canEdit,
  isColSelected,
  onRename,
  onEditProperties,
  onDelete,
  onInsertLeft,
  onInsertRight,
  onSelectColumn,
  onDragStart,
  onDrop,
  onSetPrimary,
  onColumnResizeStart,
  onColumnResizeDoubleClick,
  onAddColumn,
  colResizeDrag,
}: GridHeaderRowProps) {
  return (
    <div
      className="sticky top-0 flex"
      style={{ height: HEADER_HEIGHT, zIndex: 'var(--z-grid-header)' }}
      data-icod-id="src_features_sheets_grid_gridheaderrow_tsx_5aae">
      {/* Top-left corner cell */}
      <div
        className="sticky left-0 flex items-center justify-center border-b border-r bg-[var(--grid-header-bg)]"
        style={{
          width: 'var(--grid-row-num-width)',
          height: HEADER_HEIGHT,
          borderColor: 'var(--grid-line-color)',
          zIndex: 'calc(var(--z-grid-header) + 2)',
        }}
        data-icod-id="src_features_sheets_grid_gridheaderrow_tsx_f28d" />
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
              zIndex: col.isPrimary ? 'calc(var(--z-grid-header) + 1)' : undefined,
            }}
            data-icod-id={`src_features_sheets_grid_gridheaderrow_tsx_5c26_${col.id}`}>
            <GridHeaderCell
              column={col}
              columnIndex={colIdx}
              userRole={userRole}
              isScrolled={col.isPrimary ? isScrolled : false}
              isColumnSelected={isColSelected(colIdx)}
              onRename={onRename}
              onEditProperties={onEditProperties}
              onDelete={onDelete}
              onInsertLeft={onInsertLeft}
              onInsertRight={onInsertRight}
              onSelectColumn={onSelectColumn}
              onDragStart={onDragStart}
              onDragOver={() => {}}
              onDrop={onDrop}
              onSetPrimary={canEdit && !col.isPrimary && col.type === 'text' ? onSetPrimary : undefined}
              onColumnResizeStart={onColumnResizeStart}
              onColumnResizeDoubleClick={onColumnResizeDoubleClick}
              data-icod-id={`src_features_sheets_grid_gridheaderrow_tsx_8226_${col.id}`} />
          </div>
        );
      })}
      {/* Add column button */}
      {canEdit && (
        <div
          className="flex shrink-0 items-center border-b px-2"
          style={{ height: HEADER_HEIGHT, borderColor: 'var(--grid-line-color)' }}
          data-icod-id="src_features_sheets_grid_gridheaderrow_tsx_1c28">
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddColumn}
            data-icod-id="src_features_sheets_grid_gridheaderrow_tsx_68e6">
            <Plus
              className="mr-1 h-3 w-3"
              data-icod-id="src_features_sheets_grid_gridheaderrow_tsx_af4b" />
            Add
          </Button>
        </div>
      )}
      {/* Column resize guide line */}
      {colResizeDrag && (
        <div
          className="pointer-events-none absolute top-0 bottom-0 w-px bg-primary"
          style={{
            zIndex: 'var(--z-dropdown)',
            left: (() => {
              let x = 0;
              for (const col of columns) {
                const w = liveColumnWidths[col.id] ?? getColWidth(col);
                if (col.id === colResizeDrag.columnId) return x + w;
                x += w;
              }
              return x;
            })(),
          }}
          data-icod-id="src_features_sheets_grid_gridheaderrow_tsx_7776" />
      )}
    </div>
  );
}
