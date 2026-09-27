import { useState, useRef, useCallback } from 'react';
import { ChevronDown, Type, Hash, Calendar, List, CheckSquare, Users, GripVertical } from 'lucide-react';
import { DropdownMenu, Tooltip, ResizeHandle } from '@/components/ui';
import type { DropdownMenuItem } from '@/components/ui';
import { cn } from '@/utils/cn';
import type { Column, ColumnType, WorkspaceRole } from '@/types';

const TYPE_ICONS: Record<ColumnType, typeof Type> = {
  text: Type,
  number: Hash,
  date: Calendar,
  dropdown: List,
  checkbox: CheckSquare,
  contact: Users,
};

interface SelectionModifiers {
  shift: boolean;
  meta: boolean;
}

interface GridHeaderCellProps {
  column: Column;
  columnIndex: number;
  userRole: WorkspaceRole;
  isScrolled?: boolean;
  isColumnSelected?: boolean;
  onRename: (columnId: string, name: string) => void;
  onEditProperties: (columnId: string) => void;
  onDelete: (columnId: string) => void;
  onInsertLeft: (columnId: string) => void;
  onInsertRight: (columnId: string) => void;
  onSelectColumn?: (colIdx: number, modifiers: SelectionModifiers) => void;
  onDragStart?: (columnId: string) => void;
  onDragOver?: (columnId: string) => void;
  onDrop?: (columnId: string) => void;
  onSetPrimary?: (columnId: string) => void;
  onColumnResizeStart?: (e: React.MouseEvent, columnId: string) => void;
  onColumnResizeDoubleClick?: (columnId: string) => void;
}

export default function GridHeaderCell({
  column,
  columnIndex,
  userRole,
  isScrolled,
  isColumnSelected,
  onRename,
  onEditProperties,
  onDelete,
  onInsertLeft,
  onInsertRight,
  onSelectColumn,
  onDragStart,
  onDragOver,
  onDrop,
  onSetPrimary,
  onColumnResizeStart,
  onColumnResizeDoubleClick,
}: GridHeaderCellProps) {
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(column.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const Icon = TYPE_ICONS[column.type];
  const canEdit = userRole === 'editor' || userRole === 'admin' || userRole === 'owner';
  const canDelete = userRole === 'admin' || userRole === 'owner';

  const startRenaming = useCallback(() => {
    setRenaming(true);
    setRenameValue(column.name);
    // Delay focus so the menu has fully unmounted first
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [column.name]);

  const handleRenameSubmit = useCallback(() => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== column.name) {
      onRename(column.id, trimmed);
    } else {
      setRenameValue(column.name);
    }
    setRenaming(false);
  }, [renameValue, column.name, column.id, onRename]);

  const menuItems: DropdownMenuItem[] = [];

  if (canEdit) {
    menuItems.push(
      { label: 'Rename', onClick: startRenaming },
      { label: 'Edit column properties', onClick: () => onEditProperties(column.id) },
    );

    // "Set as primary column" — only for non-primary text columns
    if (!column.isPrimary && column.type === 'text' && onSetPrimary) {
      menuItems.push({ label: 'Set as primary column', onClick: () => onSetPrimary(column.id) });
    }

    menuItems.push(
      { type: 'divider' },
    );

    if (!column.isPrimary) {
      menuItems.push({ label: 'Insert column left', onClick: () => onInsertLeft(column.id) });
    }
    menuItems.push({ label: 'Insert column right', onClick: () => onInsertRight(column.id) });
  }

  if (column.isPrimary) {
    // Primary column: show disabled delete with tooltip
    menuItems.push(
      { type: 'divider' },
      {
        label: (
          <Tooltip
            content="Set another column as primary to delete this column."
            data-icod-id="src_features_sheets_grid_gridheadercell_tsx_9895">
            <span
              className="opacity-40 cursor-not-allowed"
              data-icod-id="src_features_sheets_grid_gridheadercell_tsx_6df4">Delete column</span>
          </Tooltip>
        ),
      },
    );
  } else if (canDelete) {
    menuItems.push(
      { type: 'divider' },
      { label: 'Delete column', danger: true, onClick: () => onDelete(column.id) },
    );
  }

  const handleHeaderClick = useCallback((e: React.MouseEvent) => {
    if (renaming) return;
    // Don't trigger column selection when clicking the menu button area
    if ((e.target as HTMLElement).closest('[data-column-menu]')) return;
    onSelectColumn?.(columnIndex, { shift: e.shiftKey, meta: e.metaKey || e.ctrlKey });
  }, [renaming, onSelectColumn, columnIndex]);

  return (
    <div
      className={cn(
        'group relative flex items-center border-b border-r select-none',
        'h-[var(--grid-header-height)] px-[var(--grid-cell-padding-x)]',
        'bg-[var(--grid-header-bg)] text-[var(--grid-header-text)]',
        'text-xs font-semibold cursor-pointer',
        isColumnSelected && 'bg-[var(--grid-range-bg)]',
      )}
      style={{
        borderColor: 'var(--grid-line-color)',
        boxShadow: column.isPrimary && isScrolled ? '2px 0 6px -1px rgba(0,0,0,0.12)' : undefined,
      }}
      draggable={canEdit}
      onDragStart={() => onDragStart?.(column.id)}
      onDragOver={(e) => { e.preventDefault(); onDragOver?.(column.id); }}
      onDrop={() => onDrop?.(column.id)}
      onClick={handleHeaderClick}
      data-icod-id="src_features_sheets_grid_gridheadercell_tsx_649d">
      {renaming ? (
        <input
          ref={inputRef}
          className="w-full bg-transparent text-xs font-medium text-foreground outline-none"
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRenameSubmit();
            if (e.key === 'Escape') { setRenameValue(column.name); setRenaming(false); }
          }}
          data-icod-id="src_features_sheets_grid_gridheadercell_tsx_c336" />
      ) : (
        <>
          <Icon
            className="mr-1.5 h-3 w-3 shrink-0 text-muted-foreground"
            data-icod-id="src_features_sheets_grid_gridheadercell_tsx_953d" />
          <span
            className="truncate cursor-pointer"
            onDoubleClick={() => { if (canEdit) startRenaming(); }}
            data-icod-id="src_features_sheets_grid_gridheadercell_tsx_a875">{column.name}</span>
        </>
      )}
      {canEdit && !renaming && (
        <div
          className="ml-auto hidden items-center gap-0.5 group-hover:flex"
          data-column-menu=""
          data-icod-id="src_features_sheets_grid_gridheadercell_tsx_d303">
          <DropdownMenu
            trigger={
              <button
                className="rounded p-0.5 hover:bg-muted transition-colors"
                aria-label="Column menu"
                data-icod-id="src_features_sheets_grid_gridheadercell_tsx_e82a">
                <ChevronDown
                  className="h-3 w-3"
                  data-icod-id="src_features_sheets_grid_gridheadercell_tsx_41a0" />
              </button>
            }
            items={menuItems}
            skipRestoreFocus
            data-icod-id="src_features_sheets_grid_gridheadercell_tsx_e3ac" />
        </div>
      )}
      {/* Drag handle indicator */}
      {canEdit && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize opacity-0 group-hover:opacity-40 hover:!opacity-80 transition-opacity"
          data-icod-id="src_features_sheets_grid_gridheadercell_tsx_206f">
          <GripVertical
            className="h-3 w-3 mt-2.5 -ml-0.5 text-muted-foreground"
            data-icod-id="src_features_sheets_grid_gridheadercell_tsx_2633" />
        </div>
      )}
      {/* Column resize handle on right edge */}
      <ResizeHandle
        direction="column"
        disabled={!canEdit}
        onDragStart={(e) => onColumnResizeStart?.(e, column.id)}
        data-icod-id="src_features_sheets_grid_gridheadercell_tsx_8092" />
    </div>
  );
}
