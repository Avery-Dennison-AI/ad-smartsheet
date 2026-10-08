import { useCallback } from 'react';
import { GripVertical, MoreHorizontal, ChevronRight, ChevronDown, PanelRightOpen } from 'lucide-react';
import { DropdownMenu, IconButton, ResizeHandle } from '@/components/ui';
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
  onRequestDeleteRows: (rowIds: string[]) => void;
  onDragStart?: (e: React.DragEvent, rowId: string) => void;
  onRowResizeStart?: (e: React.MouseEvent, rowIndex: number) => void;
  onRowResizeDoubleClick?: (rowIndex: number) => void;
  onRowContextMenu?: (rowIndex: number, x: number, y: number) => void;
  /** Hierarchy props */
  canIndent?: boolean;
  canOutdent?: boolean;
  onIndent?: (rowId: string) => void;
  onOutdent?: (rowId: string) => void;
  hasChildren?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: (rowId: string) => void;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
  /** Open item detail panel callback */
  onOpenItem?: (rowId: string) => void;
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
  onRequestDeleteRows,
  onDragStart,
  onRowResizeStart,
  onRowResizeDoubleClick,
  onRowContextMenu,
  canIndent,
  canOutdent,
  onIndent,
  onOutdent,
  hasChildren,
  isCollapsed,
  onToggleCollapse,
  onExpandAll,
  onCollapseAll,
  onOpenItem,
}: GridRowNumCellProps) {
  const canEdit = userRole === 'editor' || userRole === 'admin' || userRole === 'owner';
  const isData = !!rowId;

  const menuItems: DropdownMenuItem[] = [];

  // Add "Open details" for any row (viewer or editor)
  if (isData && onOpenItem) {
    menuItems.push(
      { label: 'Open details', onClick: () => onOpenItem(rowId!) },
      { type: 'divider' },
    );
  }

  if (canEdit && isData) {
    menuItems.push(
      { label: 'Insert row above', onClick: () => onInsertAbove(rowId!) },
      { label: 'Insert row below', onClick: () => onInsertBelow(rowId!) },
      { type: 'divider' },
      { label: 'Indent', onClick: canIndent ? () => onIndent?.(rowId!) : undefined },
      { label: 'Outdent', onClick: canOutdent ? () => onOutdent?.(rowId!) : undefined },
      { type: 'divider' },
      {
        label: 'Delete row',
        danger: true,
        onClick: () => onRequestDeleteRows([rowId!]),
      },
    );

    if (hasChildren) {
      menuItems.push(
        { type: 'divider' },
        { label: 'Expand all', onClick: () => onExpandAll?.() },
        { label: 'Collapse all', onClick: () => onCollapseAll?.() },
      );
    }
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

  return (
    <div
      className={cn(
        'group relative flex h-full items-center justify-center border-b border-r select-none',
        'w-[var(--grid-row-num-width)]',
        'bg-[var(--grid-header-bg)] text-[var(--grid-header-text)]',
        'text-xs font-medium cursor-grab hover:cursor-grab active:cursor-grabbing',
        isSelected && 'bg-[var(--grid-range-bg)]',
      )}
      style={{ borderColor: 'var(--grid-line-color)' }}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      draggable={canEdit && isData}
      onDragStart={(e) => {
        if (rowId && onDragStart) {
          e.dataTransfer.setData('text/plain', rowId);
          e.dataTransfer.effectAllowed = 'move';
          onDragStart(e, rowId);
        }
      }}
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
    </div>
  );
}
