import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { Pill, Avatar } from '@/components/ui';
import CalendarDatePicker from '@/components/ui/CalendarDatePicker';
import { cn } from '@/utils/cn';
import { useAppSelector } from '@/store/hooks';
import { selectCellFormatting, selectColumnFormatting } from '@/store/slices/gridSlice';
import FloatingCellList, { type FloatingCellListItem } from './FloatingCellList';
import type { Column } from '@/types';

interface GridMember {
  id: string;
  fullName: string;
  email: string;
}

interface GridCellProps {
  column: Column;
  rowId?: string;
  value: string | number | boolean | null;
  isActive: boolean;
  isSelected: boolean;
  isEditing: boolean;
  readOnly: boolean;
  workspaceMembers?: GridMember[];
  rowHeight?: number;
  onCommit: (value: unknown) => void;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onAddDropdownOption?: (columnId: string, label: string) => void;
  /** Called on mouseDown to handle cell selection (before focus changes). */
  onCellClick?: (e: React.MouseEvent) => void;
  /** Whether this cell belongs to the primary (frozen) column. */
  isPrimary?: boolean;
  /** Whether the grid container has been scrolled horizontally. */
  isScrolled?: boolean;
  /** Whether the row is currently hovered. */
  isRowHovered?: boolean;
  /** Whether this cell's row is selected via row header click. */
  isRowSelected?: boolean;
  /** Whether this cell's column is selected via column header click. */
  isColSelected?: boolean;
  /** Called on right-click to open row context menu. */
  onContextMenu?: (rowIndex: number, x: number, y: number) => void;
  /** The index of this cell's row in the grid. */
  rowIndex?: number;
}

export default function GridCell({
  column,
  rowId,
  value,
  isActive,
  isSelected,
  isEditing,
  readOnly,
  workspaceMembers,
  rowHeight,
  onCommit,
  onStartEdit,
  onStopEdit,
  onAddDropdownOption,
  onCellClick,
  isPrimary,
  isScrolled,
  isRowHovered,
  isRowSelected,
  isColSelected,
  onContextMenu,
  rowIndex,
}: GridCellProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const [contactQuery, setContactQuery] = useState('');
  const [contactOpen, setContactOpen] = useState(false);
  const cellRef = useRef<HTMLDivElement>(null);
  // Track whether we've already committed in this edit session to prevent double-fire
  const committedRef = useRef(false);

  // Read cell formatting and column formatting from Redux store, then merge
  const cellFmt = useAppSelector((state) =>
    rowId ? selectCellFormatting(state, rowId, column.id) : {},
  );
  const colFmt = useAppSelector((state) =>
    selectColumnFormatting(state, column.id),
  );

  // Merge: column formatting is the base, cell formatting overrides
  const fmt = useMemo(() => {
    if (!colFmt || Object.keys(colFmt).length === 0) return cellFmt;
    if (!cellFmt || Object.keys(cellFmt).length === 0) return colFmt;
    return { ...colFmt, ...cellFmt };
  }, [colFmt, cellFmt]);

  // Build inline styles from formatting
  const effectiveTextAlign = fmt.textAlign ?? (column.type === 'number' ? 'right' : undefined);
  const formattingStyle: React.CSSProperties = {
    fontFamily: fmt.fontFamily && fmt.fontFamily !== 'default' ? fmt.fontFamily : undefined,
    fontSize: fmt.fontSize ? `${fmt.fontSize}px` : undefined,
    fontWeight: fmt.bold ? 'bold' : undefined,
    fontStyle: fmt.italic ? 'italic' : undefined,
    textDecoration: [fmt.underline && 'underline', fmt.strikethrough && 'line-through'].filter(Boolean).join(' ') || undefined,
    color: fmt.textColor ?? undefined,
    justifyContent: effectiveTextAlign === 'right' ? 'flex-end' : effectiveTextAlign === 'center' ? 'center' : 'flex-start',
    alignItems: fmt.verticalAlign === 'top' ? 'flex-start' : fmt.verticalAlign === 'bottom' ? 'flex-end' : 'center',
    textAlign: effectiveTextAlign ?? undefined,
  };

  // Reset committed flag when entering edit mode
  useEffect(() => {
    if (isEditing) {
      committedRef.current = false;
    }
  }, [isEditing]);

  // Focus input when entering edit mode (only for types with an in-cell input)
  useEffect(() => {
    if (isEditing && inputRef.current) {
      if (column.type === 'text' || column.type === 'number') {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }
  }, [isEditing, column.type]);

  // Initialize edit value when starting edit
  useEffect(() => {
    if (isEditing) {
      if (column.type === 'checkbox') return;
      setEditValue(value != null ? String(value) : '');
      if (column.type === 'dropdown') {
        setDropdownSearch('');
        setDropdownOpen(true);
      }
      if (column.type === 'contact') setContactOpen(true);
    }
  }, [isEditing, value, column.type]);

  const handleDoubleClick = useCallback(() => {
    if (!readOnly) onStartEdit();
  }, [readOnly, onStartEdit]);

  // Safe commit — only fires once per edit session
  const commitEdit = useCallback(() => {
    if (committedRef.current) return;
    committedRef.current = true;
    if (column.type === 'number') {
      const num = editValue.trim() === '' ? null : Number(editValue);
      onCommit(num);
    } else {
      onCommit(editValue.trim() === '' ? null : editValue);
    }
    onStopEdit();
  }, [editValue, column.type, onCommit, onStopEdit]);

  const cancelEdit = useCallback(() => {
    committedRef.current = true; // prevent onBlur from firing after cancel
    onStopEdit();
  }, [onStopEdit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        commitEdit();
      }
    },
    [commitEdit, cancelEdit],
  );

  // Checkbox toggle — single click
  const handleCheckboxClick = useCallback(() => {
    if (readOnly) return;
    onCommit(!value);
  }, [readOnly, value, onCommit]);

  // Format display value
  const renderDisplayValue = () => {
    if (value == null || value === '') {
      return (
        <span
          className="text-muted-foreground/40"
          data-icod-id="src_features_sheets_grid_gridcell_tsx_7eea" />
      );
    }

    switch (column.type) {
      case 'text':
        return (
          <span
            className="truncate"
            style={formattingStyle}
            data-icod-id="src_features_sheets_grid_gridcell_tsx_b822">{String(value)}</span>
        );
      case 'number':
        return (
          <span
            className="truncate text-right w-full block"
            style={formattingStyle}
            data-icod-id="src_features_sheets_grid_gridcell_tsx_00de">{String(value)}</span>
        );
      case 'date': {
        try {
          const d = new Date(String(value));
          return (
            <span
              className="truncate"
              data-icod-id="src_features_sheets_grid_gridcell_tsx_1727">{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          );
        } catch {
          return (
            <span
              className="truncate"
              data-icod-id="src_features_sheets_grid_gridcell_tsx_b7f9">{String(value)}</span>
          );
        }
      }
      case 'dropdown': {
        const opt = column.options?.find((o) => o.label === String(value));
        if (opt) {
          return (
            <Pill
              label={opt.label}
              color={opt.color}
              data-icod-id="src_features_sheets_grid_gridcell_tsx_242c" />
          );
        }
        return (
          <span
            className="truncate"
            data-icod-id="src_features_sheets_grid_gridcell_tsx_333a">{String(value)}</span>
        );
      }
      case 'checkbox':
        return value ? (
          <Check
            className="h-4 w-4 text-primary"
            data-icod-id="src_features_sheets_grid_gridcell_tsx_e0fa" />
        ) : (
          <div
            className="h-3.5 w-3.5 rounded border border-border"
            data-icod-id="src_features_sheets_grid_gridcell_tsx_4891" />
        );
      case 'contact': {
        const member = workspaceMembers?.find((m) => m.id === String(value));
        if (member) {
          return (
            <div
              className="flex items-center gap-1.5 truncate"
              data-icod-id="src_features_sheets_grid_gridcell_tsx_39bd">
              <Avatar
                name={member.fullName}
                size="sm"
                className="!h-5 !w-5"
                data-icod-id="src_features_sheets_grid_gridcell_tsx_7a18" />
              <span
                className="truncate text-xs"
                data-icod-id="src_features_sheets_grid_gridcell_tsx_7bdf">{member.fullName}</span>
            </div>
          );
        }
        return (
          <span
            className="truncate"
            data-icod-id="src_features_sheets_grid_gridcell_tsx_109a">{String(value)}</span>
        );
      }
      default:
        return (
          <span
            className="truncate"
            data-icod-id="src_features_sheets_grid_gridcell_tsx_83c3">{String(value)}</span>
        );
    }
  };

  // ─── Dropdown editor via FloatingCellList ────────────────────────────────
  const renderDropdownEditor = () => {
    const filteredOptions = column.options?.filter(
      (opt) => !dropdownSearch || opt.label.toLowerCase().includes(dropdownSearch.toLowerCase()),
    ) ?? [];
    const searchHasExactMatch = filteredOptions.some(
      (opt) => opt.label.toLowerCase() === dropdownSearch.trim().toLowerCase(),
    );
    const showAddOption = !readOnly && dropdownSearch.trim() !== '' && !searchHasExactMatch && onAddDropdownOption;

    const listItems: FloatingCellListItem<{ label: string; color: string }>[] = filteredOptions.map((opt) => ({
      id: opt.label,
      data: opt,
    }));

    const handleSelectItem = (item: FloatingCellListItem<{ label: string; color: string }>) => {
      if (!committedRef.current) {
        committedRef.current = true;
        onCommit(item.data.label);
        setDropdownOpen(false);
        onStopEdit();
      }
    };

    return (
      <div
        className="relative h-full w-full flex items-center px-1"
        data-icod-id="src_features_sheets_grid_gridcell_tsx_3f46">
        {/* Show current value as static text while the list is open */}
        <span
          className="truncate text-sm text-muted-foreground/60"
          data-icod-id="src_features_sheets_grid_gridcell_tsx_dd_static">
          {value != null && value !== '' ? String(value) : 'Select...'}
        </span>
        <FloatingCellList
          anchorRef={cellRef}
          additionalCloseTarget={cellRef}
          open={dropdownOpen}
          onClose={() => {
            setDropdownOpen(false);
            if (!committedRef.current) {
              committedRef.current = true;
              onStopEdit();
            }
          }}
          items={listItems}
          renderItem={(item, _idx, isFocused) => (
            <button
              className={cn(
                'flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs',
                isFocused && 'bg-muted',
              )}
              data-icod-id="src_features_sheets_grid_gridcell_tsx_1310">
              <Pill
                label={item.data.label}
                color={item.data.color}
                data-icod-id="src_features_sheets_grid_gridcell_tsx_5450" />
            </button>
          )}
          onSelect={handleSelectItem}
          header={
            <input
              className="h-full w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
              placeholder="Filter options..."
              value={dropdownSearch}
              onChange={(e) => setDropdownSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Tab') {
                  e.preventDefault();
                  if (filteredOptions.length > 0 && !committedRef.current) {
                    committedRef.current = true;
                    onCommit(filteredOptions[0].label);
                  }
                  setDropdownOpen(false);
                  onStopEdit();
                }
              }}
              autoFocus
              data-icod-id="src_features_sheets_grid_gridcell_tsx_5f71" />
          }
          footer={
            <>
              {/* Clear option */}
              {value != null && value !== '' && (
                <button
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-muted"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (!committedRef.current) {
                      committedRef.current = true;
                      onCommit(null);
                      setDropdownOpen(false);
                      onStopEdit();
                    }
                  }}
                  data-icod-id="src_features_sheets_grid_gridcell_tsx_e9b9">
                  <X
                    className="h-3 w-3 text-muted-foreground"
                    data-icod-id="src_features_sheets_grid_gridcell_tsx_26a5" />
                  <span
                    className="text-muted-foreground"
                    data-icod-id="src_features_sheets_grid_gridcell_tsx_5338">Clear</span>
                </button>
              )}
              {/* Add new option */}
              {showAddOption && (
                <button
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium text-primary hover:bg-muted"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (!committedRef.current) {
                      committedRef.current = true;
                      onAddDropdownOption(column.id, dropdownSearch.trim());
                      onCommit(dropdownSearch.trim());
                      setDropdownOpen(false);
                      onStopEdit();
                    }
                  }}
                  data-icod-id="src_features_sheets_grid_gridcell_tsx_a3f4">
                  Add &quot;{dropdownSearch.trim()}&quot; as option
                </button>
              )}
            </>
          }
          maxHeight={192}
          data-icod-id="src_features_sheets_grid_gridcell_tsx_3be8" />
      </div>
    );
  };

  // ─── Contact editor via FloatingCellList ─────────────────────────────────
  const renderContactEditor = () => {
    const filteredMembers = workspaceMembers?.filter(
      (m) =>
        !contactQuery ||
        m.fullName.toLowerCase().includes(contactQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(contactQuery.toLowerCase()),
    ) ?? [];

    const listItems: FloatingCellListItem<GridMember>[] = filteredMembers.map((m) => ({
      id: m.id,
      data: m,
    }));

    const handleSelectMember = (item: FloatingCellListItem<GridMember>) => {
      if (!committedRef.current) {
        committedRef.current = true;
        onCommit(item.data.id);
        setContactOpen(false);
        onStopEdit();
      }
    };

    return (
      <div
        className="relative h-full w-full flex items-center px-1"
        data-icod-id="src_features_sheets_grid_gridcell_tsx_0ee2">
        {/* Show current value as static text while the list is open */}
        <span
          className="truncate text-sm text-muted-foreground/60"
          data-icod-id="src_features_sheets_grid_gridcell_tsx_ct_static">
          {(() => {
            const member = workspaceMembers?.find((m) => m.id === String(value));
            return member ? member.fullName : 'Search members...';
          })()}
        </span>
        <FloatingCellList
          anchorRef={cellRef}
          additionalCloseTarget={cellRef}
          open={contactOpen}
          onClose={() => {
            setContactOpen(false);
            if (!committedRef.current) {
              committedRef.current = true;
              onStopEdit();
            }
          }}
          items={listItems}
          minWidth={220}
          renderItem={(item, _idx, isFocused) => (
            <button
              className={cn(
                'flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs',
                isFocused && 'bg-muted',
              )}
              data-icod-id="src_features_sheets_grid_gridcell_tsx_98a6">
              <Avatar
                name={item.data.fullName}
                size="sm"
                className="!h-5 !w-5"
                data-icod-id="src_features_sheets_grid_gridcell_tsx_1788" />
              <div
                className="min-w-0 flex-1"
                data-icod-id="src_features_sheets_grid_gridcell_tsx_a744">
                <div
                  className="truncate font-medium"
                  data-icod-id="src_features_sheets_grid_gridcell_tsx_2a72">{item.data.fullName}</div>
                <div
                  className="truncate text-muted-foreground"
                  data-icod-id="src_features_sheets_grid_gridcell_tsx_f5e7">{item.data.email}</div>
              </div>
            </button>
          )}
          onSelect={handleSelectMember}
          header={
            <input
              className="h-full w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
              placeholder="Search members..."
              value={contactQuery}
              onChange={(e) => setContactQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Tab') {
                  e.preventDefault();
                  if (filteredMembers.length > 0 && !committedRef.current) {
                    committedRef.current = true;
                    onCommit(filteredMembers[0].id);
                  }
                  setContactOpen(false);
                  onStopEdit();
                }
              }}
              autoFocus
              data-icod-id="src_features_sheets_grid_gridcell_tsx_2b68" />
          }
          footer={
            value != null && value !== '' ? (
              <button
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-muted"
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (!committedRef.current) {
                    committedRef.current = true;
                    onCommit(null);
                    setContactOpen(false);
                    onStopEdit();
                  }
                }}
                data-icod-id="src_features_sheets_grid_gridcell_tsx_539a">
                <X
                  className="h-3 w-3 text-muted-foreground"
                  data-icod-id="src_features_sheets_grid_gridcell_tsx_a119" />
                <span
                  className="text-muted-foreground"
                  data-icod-id="src_features_sheets_grid_gridcell_tsx_6182">Clear</span>
              </button>
            ) : undefined
          }
          maxHeight={220}
          data-icod-id="src_features_sheets_grid_gridcell_tsx_5c8a" />
      </div>
    );
  };

  // Render edit mode
  const renderEditMode = () => {
    switch (column.type) {
      case 'text':
        return (
          <input
            ref={inputRef}
            className="h-full w-full bg-transparent px-1 text-sm outline-none"
            style={{ ...formattingStyle, color: fmt.textColor ?? undefined, backgroundColor: fmt.fillColor ? 'transparent' : undefined }}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => { if (!committedRef.current) commitEdit(); }}
            data-icod-id="src_features_sheets_grid_gridcell_tsx_c428" />
        );
      case 'number':
        return (
          <input
            ref={inputRef}
            type="number"
            className="h-full w-full bg-transparent px-1 text-right text-sm outline-none"
            style={{ ...formattingStyle, color: fmt.textColor ?? undefined, backgroundColor: fmt.fillColor ? 'transparent' : undefined }}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => { if (!committedRef.current) commitEdit(); }}
            data-icod-id="src_features_sheets_grid_gridcell_tsx_a5a7" />
        );
      case 'date':
        return (
          <div
            className="relative h-full w-full"
            data-icod-id="src_features_sheets_grid_gridcell_tsx_0a57">
            {/* Static text showing current value while calendar is open */}
            <span
              className="flex h-full items-center truncate px-1 text-sm text-muted-foreground/60"
              data-icod-id="src_features_sheets_grid_gridcell_tsx_date_static">
              {value != null ? (() => {
                try {
                  const d = new Date(String(value));
                  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                } catch {
                  return String(value);
                }
              })() : ''}
            </span>
            <CalendarDatePicker
              value={editValue || null}
              onChange={(dateVal) => {
                if (!committedRef.current) {
                  committedRef.current = true;
                  setEditValue(dateVal ?? '');
                  onCommit(dateVal);
                  onStopEdit();
                }
              }}
              onClose={() => {
                if (!committedRef.current) {
                  committedRef.current = true;
                  onStopEdit();
                }
              }}
              anchorRef={cellRef}
              data-icod-id="src_features_sheets_grid_gridcell_tsx_4f2c" />
          </div>
        );
      case 'dropdown':
        return renderDropdownEditor();
      case 'checkbox':
        return null;
      case 'contact':
        return renderContactEditor();
      default:
        return null;
    }
  };

  // ─── Cell background logic for primary column states ─────────────────────
  const getCellBg = (): string | undefined => {
    if (!isPrimary) return undefined;
    if (isActive) return 'var(--grid-selection-bg)';
    if (isSelected || isRowSelected || isColSelected) return 'var(--grid-range-bg)';
    if (isRowHovered) return 'var(--grid-row-hover-bg)';
    return fmt.fillColor ? undefined : 'var(--grid-bg)';
  };

  const cellBg = getCellBg();

  // Build composite background: fillColor base + state overlay via gradient
  const getCompositeBackground = (): string | undefined => {
    const fill = fmt.fillColor;
    if (!fill) return cellBg;

    // When there's a fill color, layer interaction states on top via semi-transparent gradient
    if (isActive) {
      return `linear-gradient(var(--grid-selection-bg), var(--grid-selection-bg)), ${fill}`;
    }
    if (isSelected || isRowSelected || isColSelected) {
      return `linear-gradient(var(--grid-range-bg), var(--grid-range-bg)), ${fill}`;
    }
    if (isRowHovered && !isPrimary) {
      return `linear-gradient(var(--grid-row-hover), var(--grid-row-hover)), ${fill}`;
    }
    return fill;
  };

  const compositeBg = getCompositeBackground();

  return (
    <div
      ref={cellRef}
      className={cn(
        'group relative flex overflow-hidden',
        'h-full px-[var(--grid-cell-padding-x)]',
        'text-sm text-foreground cursor-cell',
        isActive && 'ring-2 ring-inset ring-[var(--grid-selected-border)] z-10',
        // Only use Tailwind bg classes when no fill color; otherwise compositeBg handles it
        !fmt.fillColor && (isSelected || isRowSelected || isColSelected) && !isActive && !isPrimary && 'bg-[var(--grid-range-bg)]',
        !fmt.fillColor && !isSelected && !isActive && !isPrimary && !isRowSelected && !isColSelected && 'hover:bg-[var(--grid-row-hover)]',
        'border-b border-r items-center',
      )}
      style={{
        borderColor: 'var(--grid-line-color)',
        backgroundColor: compositeBg,
        boxShadow: isPrimary && isScrolled ? '2px 0 6px -1px rgba(0,0,0,0.12)' : undefined,
      }}
      onMouseDown={(e) => {
        // If this cell is currently editing, don't propagate mousedown to selection handler.
        // This prevents ending edit mode when clicking inside the editor (input, calendar, list).
        if (isEditing) return;
        // Let parent handle cell selection on mouse down
        if (onCellClick) onCellClick(e);
      }}
      onClick={() => {
        if (column.type === 'checkbox' && !readOnly) {
          handleCheckboxClick();
        }
      }}
      onDoubleClick={handleDoubleClick}
      onContextMenu={(e) => {
        if (onContextMenu && rowIndex !== undefined) {
          e.preventDefault();
          e.stopPropagation();
          onContextMenu(rowIndex, e.clientX, e.clientY);
        }
      }}
      data-editing={isEditing ? 'true' : undefined}
      data-icod-id="src_features_sheets_grid_gridcell_tsx_fe64">
      {isEditing && column.type !== 'checkbox' ? (
        renderEditMode()
      ) : (
        <div
          className="flex w-full h-full overflow-hidden"
          style={formattingStyle}
          data-icod-id="src_features_sheets_grid_gridcell_tsx_288d">
          {renderDisplayValue()}
          {/* Chevron icon for dropdown cells when not editing */}
          {column.type === 'dropdown' && !isEditing && !readOnly && (
            <ChevronDown
              className="ml-auto h-3 w-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              data-icod-id="src_features_sheets_grid_gridcell_tsx_ff9f" />
          )}
        </div>
      )}
    </div>
  );
}
