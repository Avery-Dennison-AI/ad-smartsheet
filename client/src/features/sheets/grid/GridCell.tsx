import { useState, useRef, useEffect, useCallback } from 'react';
import { useCellFormatting } from './useCellFormatting';
import TextCellEditor from './editors/TextCellEditor';
import NumberCellEditor from './editors/NumberCellEditor';
import DateCellEditor from './editors/DateCellEditor';
import DropdownCellEditOverlay from './DropdownCellEditOverlay';
import ContactCellEditOverlay from './ContactCellEditOverlay';
import TextCellDisplay from './displays/TextCellDisplay';
import NumberCellDisplay from './displays/NumberCellDisplay';
import DateCellDisplay from './displays/DateCellDisplay';
import DropdownCellDisplay from './displays/DropdownCellDisplay';
import ContactCellDisplay from './displays/ContactCellDisplay';
import CheckboxCellDisplay from './displays/CheckboxCellDisplay';
import { cn } from '@/utils/cn';
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
  onCellClick?: (e: React.MouseEvent) => void;
  isPrimary?: boolean;
  isScrolled?: boolean;
  isRowHovered?: boolean;
  isRowSelected?: boolean;
  isColSelected?: boolean;
  onContextMenu?: (rowIndex: number, x: number, y: number) => void;
  rowIndex?: number;
  /** Hierarchy props */
  depth?: number;
  hasChildren?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function GridCell({
  column, rowId, value, isActive, isSelected, isEditing, readOnly,
  workspaceMembers, onCommit, onStartEdit, onStopEdit, onAddDropdownOption,
  onCellClick, isPrimary, isScrolled, isRowHovered, isRowSelected,
  isColSelected, onContextMenu, rowIndex,
  depth, hasChildren, isCollapsed, onToggleCollapse,
}: GridCellProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [editValue, setEditValue] = useState<string>('');
  const cellRef = useRef<HTMLDivElement>(null);
  const committedRef = useRef(false);

  const { fmt, formattingStyle } = useCellFormatting(rowId, column.id, column.type);

  useEffect(() => { if (isEditing) committedRef.current = false; }, [isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current && (column.type === 'text' || column.type === 'number')) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing, column.type]);

  useEffect(() => {
    if (isEditing && column.type !== 'checkbox') {
      setEditValue(value != null ? String(value) : '');
    }
  }, [isEditing, value, column.type]);

  const handleDoubleClick = useCallback(() => {
    if (!readOnly) onStartEdit();
  }, [readOnly, onStartEdit]);

  const commitEdit = useCallback(() => {
    if (committedRef.current) return;
    committedRef.current = true;
    if (column.type === 'number') {
      onCommit(editValue.trim() === '' ? null : Number(editValue));
    } else {
      onCommit(editValue.trim() === '' ? null : editValue);
    }
    onStopEdit();
  }, [editValue, column.type, onCommit, onStopEdit]);

  const cancelEdit = useCallback(() => {
    committedRef.current = true;
    onStopEdit();
  }, [onStopEdit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); commitEdit(); }
    else if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
  }, [commitEdit, cancelEdit]);

  const handleCheckboxClick = useCallback(() => {
    if (readOnly) return;
    onCommit(!value);
  }, [readOnly, value, onCommit]);

  // ─── Display rendering ────────────────────────────────────────────────

  const renderDisplay = () => {
    switch (column.type) {
      case 'text': return (
        <TextCellDisplay
          value={value}
          isPrimary={isPrimary}
          depth={depth}
          hasChildren={hasChildren}
          isCollapsed={isCollapsed}
          onToggleCollapse={onToggleCollapse}
          data-icod-id="src_features_sheets_grid_gridcell_tsx_4216" />
      );
      case 'number': return <NumberCellDisplay value={value} data-icod-id="src_features_sheets_grid_gridcell_tsx_9cef" />;
      case 'date': return <DateCellDisplay value={value} data-icod-id="src_features_sheets_grid_gridcell_tsx_eace" />;
      case 'dropdown': return (
        <DropdownCellDisplay
          value={value}
          options={column.options}
          readOnly={readOnly}
          data-icod-id="src_features_sheets_grid_gridcell_tsx_9188" />
      );
      case 'checkbox': return <CheckboxCellDisplay value={value} data-icod-id="src_features_sheets_grid_gridcell_tsx_4fb8" />;
      case 'contact': return (
        <ContactCellDisplay
          value={value}
          workspaceMembers={workspaceMembers}
          data-icod-id="src_features_sheets_grid_gridcell_tsx_6944" />
      );
      default: return (
        <TextCellDisplay
          value={value}
          isPrimary={isPrimary}
          depth={depth}
          hasChildren={hasChildren}
          isCollapsed={isCollapsed}
          onToggleCollapse={onToggleCollapse}
          data-icod-id="src_features_sheets_grid_gridcell_tsx_c9ed" />
      );
    }
  };

  // ─── Edit mode rendering ──────────────────────────────────────────────

  const renderEditMode = () => {
    switch (column.type) {
      case 'text':
        return (
          <TextCellEditor
            inputRef={inputRef}
            value={editValue}
            onChange={(v) => setEditValue(v)}
            onKeyDown={handleKeyDown}
            onBlur={() => { if (!committedRef.current) commitEdit(); }}
            formattingStyle={formattingStyle}
            textColor={fmt.textColor ?? undefined}
            fillColor={fmt.fillColor ?? undefined}
            wrapText={!!fmt.wrapText}
            data-icod-id="src_features_sheets_grid_gridcell_tsx_ce36" />
        );
      case 'number':
        return (
          <NumberCellEditor
            inputRef={inputRef}
            value={editValue}
            onChange={(v) => setEditValue(v)}
            onKeyDown={handleKeyDown}
            onBlur={() => { if (!committedRef.current) commitEdit(); }}
            formattingStyle={formattingStyle}
            textColor={fmt.textColor ?? undefined}
            fillColor={fmt.fillColor ?? undefined}
            wrapText={!!fmt.wrapText}
            data-icod-id="src_features_sheets_grid_gridcell_tsx_f097" />
        );
      case 'date':
        return (
          <DateCellEditor
            cellRef={cellRef}
            editValue={editValue}
            displayValue={value}
            onChange={(dateVal) => {
              if (!committedRef.current) { committedRef.current = true; setEditValue(dateVal ?? ''); onCommit(dateVal); onStopEdit(); }
            }}
            onClose={() => { if (!committedRef.current) { committedRef.current = true; onStopEdit(); } }}
            data-icod-id="src_features_sheets_grid_gridcell_tsx_672c" />
        );
      case 'dropdown':
        return (
          <DropdownCellEditOverlay
            cellRef={cellRef}
            value={value}
            options={column.options}
            readOnly={readOnly}
            onCommit={onCommit}
            onStopEdit={onStopEdit}
            onAddDropdownOption={onAddDropdownOption}
            columnId={column.id}
            committedRef={committedRef}
            data-icod-id="src_features_sheets_grid_gridcell_tsx_af71" />
        );
      case 'checkbox': return null;
      case 'contact':
        return (
          <ContactCellEditOverlay
            cellRef={cellRef}
            value={value}
            workspaceMembers={workspaceMembers}
            onCommit={onCommit}
            onStopEdit={onStopEdit}
            committedRef={committedRef}
            data-icod-id="src_features_sheets_grid_gridcell_tsx_b844" />
        );
      default: return null;
    }
  };

  // ─── Cell background logic ────────────────────────────────────────────

  const getCompositeBackground = (): string | undefined => {
    const fill = fmt.fillColor;
    if (!isPrimary) {
      if (!fill) return undefined;
      if (isActive) return `linear-gradient(var(--grid-selection-bg), var(--grid-selection-bg)), ${fill}`;
      if (isSelected || isRowSelected || isColSelected) return `linear-gradient(var(--grid-range-bg), var(--grid-range-bg)), ${fill}`;
      if (isRowHovered) return `linear-gradient(var(--grid-row-hover), var(--grid-row-hover)), ${fill}`;
      return fill;
    }
    // Primary column backgrounds
    if (isActive) return fill ? `linear-gradient(var(--grid-selection-bg), var(--grid-selection-bg)), ${fill}` : 'var(--grid-selection-bg)';
    if (isSelected || isRowSelected || isColSelected) return fill ? `linear-gradient(var(--grid-range-bg), var(--grid-range-bg)), ${fill}` : 'var(--grid-range-bg)';
    if (isRowHovered) return fill ? `linear-gradient(var(--grid-row-hover), var(--grid-row-hover)), ${fill}` : 'var(--grid-row-hover-bg)';
    return fill ?? 'var(--grid-bg)';
  };

  return (
    <div
      ref={cellRef}
      className={cn(
        'group relative flex overflow-hidden h-full px-[var(--grid-cell-padding-x)]',
        'text-sm text-foreground cursor-cell border-b border-r items-center',
        isActive && 'ring-2 ring-inset ring-[var(--grid-selected-border)] [z-index:var(--z-toolbar)]',
        !fmt.fillColor && (isSelected || isRowSelected || isColSelected) && !isActive && !isPrimary && 'bg-[var(--grid-range-bg)]',
        !fmt.fillColor && !isSelected && !isActive && !isPrimary && !isRowSelected && !isColSelected && 'hover:bg-[var(--grid-row-hover)]',
      )}
      style={{
        borderColor: 'var(--grid-line-color)',
        backgroundColor: getCompositeBackground(),
        boxShadow: isPrimary && isScrolled ? '2px 0 6px -1px rgba(0,0,0,0.12)' : undefined,
      }}
      onMouseDown={(e) => { if (isEditing) return; if (onCellClick) onCellClick(e); }}
      onClick={() => { if (column.type === 'checkbox' && !readOnly) handleCheckboxClick(); }}
      onDoubleClick={handleDoubleClick}
      onContextMenu={(e) => {
        if (onContextMenu && rowIndex !== undefined) { e.preventDefault(); e.stopPropagation(); onContextMenu(rowIndex, e.clientX, e.clientY); }
      }}
      data-editing={isEditing ? 'true' : undefined}
      data-icod-id="src_features_sheets_grid_gridcell_tsx_d537">
      {isEditing && column.type !== 'checkbox' ? renderEditMode() : (
        <div
          className={cn('flex w-full h-full', fmt.wrapText && (column.type === 'text' || column.type === 'number') ? '' : 'overflow-hidden')}
          style={formattingStyle}
          data-icod-id="src_features_sheets_grid_gridcell_tsx_d409">{renderDisplay()}</div>
      )}
    </div>
  );
}
