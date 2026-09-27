import { useState, useRef, useCallback } from 'react';
import { ChevronDown, Type, Hash, Calendar, List, CheckSquare, Users, GripVertical } from 'lucide-react';
import { DropdownMenu } from '@/components/ui';
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

interface GridHeaderCellProps {
  column: Column;
  userRole: WorkspaceRole;
  onRename: (columnId: string, name: string) => void;
  onChangeType: (columnId: string) => void;
  onEditOptions: (columnId: string) => void;
  onDelete: (columnId: string) => void;
  onInsertLeft: (columnId: string) => void;
  onInsertRight: (columnId: string) => void;
  onDragStart?: (columnId: string) => void;
  onDragOver?: (columnId: string) => void;
  onDrop?: (columnId: string) => void;
}

export default function GridHeaderCell({
  column,
  userRole,
  onRename,
  onChangeType,
  onEditOptions,
  onDelete,
  onInsertLeft,
  onInsertRight,
  onDragStart,
  onDragOver,
  onDrop,
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
      { label: 'Change type', onClick: () => onChangeType(column.id) },
    );

    if (column.type === 'dropdown') {
      menuItems.push({ label: 'Edit options', onClick: () => onEditOptions(column.id) });
    }

    menuItems.push(
      { type: 'divider' },
      { label: 'Insert column left', onClick: () => onInsertLeft(column.id) },
      { label: 'Insert column right', onClick: () => onInsertRight(column.id) },
    );
  }

  if (canDelete && !column.isPrimary) {
    menuItems.push(
      { type: 'divider' },
      { label: 'Delete column', danger: true, onClick: () => onDelete(column.id) },
    );
  }

  return (
    <div
      className={cn(
        'group relative flex items-center border-b border-r select-none',
        'h-[var(--grid-header-height)] px-[var(--grid-cell-padding-x)]',
        'bg-[var(--grid-header-bg)] text-[var(--grid-header-text)]',
        'text-[var(--grid-header-font-size)] font-[var(--grid-header-font-weight)]',
      )}
      style={{ borderColor: 'var(--grid-line-color)' }}
      draggable={canEdit}
      onDragStart={() => onDragStart?.(column.id)}
      onDragOver={(e) => { e.preventDefault(); onDragOver?.(column.id); }}
      onDrop={() => onDrop?.(column.id)}
      data-icod-id="src_features_sheets_grid_gridheadercell_tsx_4443">
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
          data-icod-id="src_features_sheets_grid_gridheadercell_tsx_58f5" />
      ) : (
        <>
          <Icon
            className="mr-1.5 h-3 w-3 shrink-0 opacity-60"
            data-icod-id="src_features_sheets_grid_gridheadercell_tsx_570e" />
          <span
            className="truncate cursor-pointer"
            onDoubleClick={() => { if (canEdit) startRenaming(); }}
            data-icod-id="src_features_sheets_grid_gridheadercell_tsx_d968">{column.name}</span>
        </>
      )}
      {canEdit && !renaming && (
        <div
          className="ml-auto hidden items-center gap-0.5 group-hover:flex"
          data-icod-id="src_features_sheets_grid_gridheadercell_tsx_26df">
          <DropdownMenu
            trigger={
              <button
                className="rounded p-0.5 hover:bg-muted transition-colors"
                aria-label="Column menu"
                data-icod-id="src_features_sheets_grid_gridheadercell_tsx_1905">
                <ChevronDown
                  className="h-3 w-3"
                  data-icod-id="src_features_sheets_grid_gridheadercell_tsx_8325" />
              </button>
            }
            items={menuItems}
            skipRestoreFocus
            data-icod-id="src_features_sheets_grid_gridheadercell_tsx_cd5c" />
        </div>
      )}
      {/* Drag handle indicator */}
      {canEdit && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize opacity-0 group-hover:opacity-40 hover:!opacity-80 transition-opacity"
          data-icod-id="src_features_sheets_grid_gridheadercell_tsx_7480">
          <GripVertical
            className="h-3 w-3 mt-2.5 -ml-0.5 text-muted-foreground"
            data-icod-id="src_features_sheets_grid_gridheadercell_tsx_fd3e" />
        </div>
      )}
    </div>
  );
}
