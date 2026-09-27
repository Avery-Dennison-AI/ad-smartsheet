import { useCallback, useState } from 'react';
import { GripVertical, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, IconButton, ConfirmDialog, ResizeHandle } from '@/components/ui';
import type { DropdownMenuItem } from '@/components/ui';
import { cn } from '@/utils/cn';
import type { WorkspaceRole } from '@/types';

interface SelectionModifiers {
  shift: boolean;
  meta: boolean;
}

interface GridRowNumCellProps {
  rowNumber: number;
  rowIndex: number;
  rowId?: string;
  userRole: WorkspaceRole;
  isSelected?: boolean;
  onSelectRow: (rowIndex: number, modifiers: SelectionModifiers) => void;
  onInsertAbove: (rowId: string) => void;
  onInsertBelow: (rowId: string) => void;
  onDeleteRows: (rowIds: string[]) => void;
  onDragStart?: (rowIndex: number) => void;
  onDragOver?: (rowIndex: number) => void;
  onDrop?: (rowIndex: number) => void;
  onRowResizeStart?: (e: React.MouseEvent, rowIndex: number) => void;
  onRowResizeDoubleClick?: (rowIndex: number) => void;
  onRowContextMenu?: (rowIndex: number, x: number, y: number) => void;
}

export default function GridRowNumCell({
  rowNumber,
  rowIndex,
  rowId,
  userRole,
  isSelected,
  onSelectRow,
  onInsertAbove,
  onInsertBelow,
  onDeleteRows,
  onDragStart,
  onDragOver,
  onDrop,
  onRowResizeStart,
  onRowResizeDoubleClick,
  onRowContextMenu,
}: GridRowNumCellProps) {
  const canEdit = userRole === 'editor' || userRole === 'admin' || userRole === 'owner';
  const isData = !!rowId;

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const menuItems: DropdownMenuItem[] = [];

  if (canEdit && isData) {
    menuItems.push(
      { label: 'Insert row above', onClick: () => onInsertAbove(rowId!) },
      { label: 'Insert row below', onClick: () => onInsertBelow(rowId!) },
      { type: 'divider' },
      {
        label: 'Delete row',
        danger: true,
        onClick: () => setDeleteConfirmOpen(true),
      },
    );
  }

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectRow(rowIndex, { shift: e.shiftKey, meta: e.metaKey || e.ctrlKey });
  }, [onSelectRow, rowIndex]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isData || !canEdit) return;
    // If this row isn't selected, select it first
    if (!isSelected) {
      onSelectRow(rowIndex, { shift: false, meta: false });
    }
    onRowContextMenu?.(rowIndex, e.clientX, e.clientY);
  }, [isData, canEdit, isSelected, onSelectRow, rowIndex, onRowContextMenu]);

  const handleConfirmDelete = useCallback(() => {
    if (rowId) {
      onDeleteRows([rowId]);
    }
  }, [rowId, onDeleteRows]);

  return (
    <div
      className={cn(
        'group relative flex h-full items-center justify-center border-b border-r select-none',
        'w-[var(--grid-row-num-width)]',
        'bg-[var(--grid-header-bg)] text-[var(--grid-header-text)]',
        'text-xs font-medium cursor-pointer',
        isSelected && 'bg-[var(--grid-range-bg)]',
      )}
      style={{ borderColor: 'var(--grid-line-color)' }}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      draggable={canEdit}
      onDragStart={() => onDragStart?.(rowIndex)}
      onDragOver={(e) => { e.preventDefault(); onDragOver?.(rowIndex); }}
      onDrop={() => onDrop?.(rowIndex)}
      data-icod-id="src_features_sheets_grid_gridrownumcell_tsx_34b4">
      <span
        className="group-hover:hidden"
        data-icod-id="src_features_sheets_grid_gridrownumcell_tsx_d2b4">{rowNumber}</span>
      {/* Hover state: drag handle + menu */}
      <div
        className="hidden items-center gap-0.5 group-hover:flex"
        data-icod-id="src_features_sheets_grid_gridrownumcell_tsx_05ca">
        {canEdit && (
          <GripVertical
            className="h-3 w-3 cursor-grab text-muted-foreground active:cursor-grabbing"
            data-icod-id="src_features_sheets_grid_gridrownumcell_tsx_6182" />
        )}
        {menuItems.length > 0 && (
          <DropdownMenu
            trigger={
              <IconButton
                size="sm"
                tooltip="Row actions"
                onMouseDown={(e) => e.stopPropagation()}
                data-icod-id="src_features_sheets_grid_gridrownumcell_tsx_ea5b">
                <MoreHorizontal
                  className="h-3 w-3"
                  data-icod-id="src_features_sheets_grid_gridrownumcell_tsx_52ef" />
              </IconButton>
            }
            items={menuItems}
            skipRestoreFocus
            data-icod-id="src_features_sheets_grid_gridrownumcell_tsx_e9e0" />
        )}
      </div>
      {/* Row resize handle on bottom edge */}
      <ResizeHandle
        direction="row"
        disabled={!canEdit}
        onDragStart={(e) => onRowResizeStart?.(e, rowIndex)}
        data-icod-id="src_features_sheets_grid_gridrownumcell_tsx_e0f2" />
      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Delete 1 row?"
        description="This can't be undone."
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        data-icod-id="src_features_sheets_grid_gridrownumcell_tsx_confirm" />
    </div>
  );
}
