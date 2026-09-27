import { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Check, X } from 'lucide-react';
import { Pill, Avatar } from '@/components/ui';
import { cn } from '@/utils/cn';
import type { Column } from '@/types';

interface GridMember {
  id: string;
  fullName: string;
  email: string;
}

interface GridCellProps {
  column: Column;
  value: string | number | boolean | null;
  isActive: boolean;
  isSelected: boolean;
  isEditing: boolean;
  readOnly: boolean;
  workspaceMembers?: GridMember[];
  onCommit: (value: unknown) => void;
  onStartEdit: () => void;
  onStopEdit: () => void;
}

export default function GridCell({
  column,
  value,
  isActive,
  isSelected,
  isEditing,
  readOnly,
  workspaceMembers,
  onCommit,
  onStartEdit,
  onStopEdit,
}: GridCellProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [contactQuery, setContactQuery] = useState('');
  const [contactOpen, setContactOpen] = useState(false);
  const cellRef = useRef<HTMLDivElement>(null);
  // Track whether we've already committed in this edit session to prevent double-fire
  const committedRef = useRef(false);

  // Reset committed flag when entering edit mode
  useEffect(() => {
    if (isEditing) {
      committedRef.current = false;
    }
  }, [isEditing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (column.type === 'text' || column.type === 'number') {
        inputRef.current.select();
      }
    }
  }, [isEditing, column.type]);

  // Initialize edit value when starting edit
  useEffect(() => {
    if (isEditing) {
      if (column.type === 'checkbox') return;
      setEditValue(value != null ? String(value) : '');
      if (column.type === 'dropdown') setDropdownOpen(true);
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
          data-icod-id="src_features_sheets_grid_gridcell_tsx_e913" />
      );
    }

    switch (column.type) {
      case 'text':
        return (
          <span
            className="truncate"
            data-icod-id="src_features_sheets_grid_gridcell_tsx_8734">{String(value)}</span>
        );
      case 'number':
        return (
          <span
            className="truncate text-right w-full block"
            data-icod-id="src_features_sheets_grid_gridcell_tsx_01d1">{String(value)}</span>
        );
      case 'date': {
        try {
          const d = new Date(String(value));
          return (
            <span
              className="truncate"
              data-icod-id="src_features_sheets_grid_gridcell_tsx_b9f9">{d.toLocaleDateString()}</span>
          );
        } catch {
          return (
            <span
              className="truncate"
              data-icod-id="src_features_sheets_grid_gridcell_tsx_8304">{String(value)}</span>
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
              data-icod-id="src_features_sheets_grid_gridcell_tsx_2ebb" />
          );
        }
        return (
          <span
            className="truncate"
            data-icod-id="src_features_sheets_grid_gridcell_tsx_3b51">{String(value)}</span>
        );
      }
      case 'checkbox':
        return value ? (
          <Check
            className="h-4 w-4 text-primary"
            data-icod-id="src_features_sheets_grid_gridcell_tsx_5315" />
        ) : (
          <div
            className="h-3.5 w-3.5 rounded border border-border"
            data-icod-id="src_features_sheets_grid_gridcell_tsx_2f38" />
        );
      case 'contact': {
        const member = workspaceMembers?.find((m) => m.id === String(value));
        if (member) {
          return (
            <div
              className="flex items-center gap-1.5 truncate"
              data-icod-id="src_features_sheets_grid_gridcell_tsx_d7ec">
              <Avatar
                name={member.fullName}
                size="sm"
                className="!h-5 !w-5"
                data-icod-id="src_features_sheets_grid_gridcell_tsx_09a5" />
              <span
                className="truncate text-xs"
                data-icod-id="src_features_sheets_grid_gridcell_tsx_7b8c">{member.fullName}</span>
            </div>
          );
        }
        return (
          <span
            className="truncate"
            data-icod-id="src_features_sheets_grid_gridcell_tsx_87d7">{String(value)}</span>
        );
      }
      default:
        return (
          <span
            className="truncate"
            data-icod-id="src_features_sheets_grid_gridcell_tsx_0c91">{String(value)}</span>
        );
    }
  };

  // Render edit mode
  const renderEditMode = () => {
    switch (column.type) {
      case 'text':
        return (
          <input
            ref={inputRef}
            className="h-full w-full bg-transparent px-1 text-sm outline-none"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => { if (!committedRef.current) commitEdit(); }}
            data-icod-id="src_features_sheets_grid_gridcell_tsx_f796" />
        );
      case 'number':
        return (
          <input
            ref={inputRef}
            type="number"
            className="h-full w-full bg-transparent px-1 text-right text-sm outline-none"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => { if (!committedRef.current) commitEdit(); }}
            data-icod-id="src_features_sheets_grid_gridcell_tsx_5c82" />
        );
      case 'date':
        return (
          <div
            className="relative h-full w-full"
            data-icod-id="src_features_sheets_grid_gridcell_tsx_24d4">
            <input
              ref={inputRef}
              type="date"
              className="h-full w-full bg-transparent px-1 text-sm outline-none"
              value={editValue}
              onChange={(e) => {
                setEditValue(e.target.value);
                // Date picker fires onChange on selection — commit immediately
                if (e.target.value) {
                  if (!committedRef.current) {
                    committedRef.current = true;
                    onCommit(e.target.value);
                    onStopEdit();
                  }
                }
              }}
              onKeyDown={handleKeyDown}
              onBlur={() => { if (!committedRef.current) commitEdit(); }}
              data-icod-id="src_features_sheets_grid_gridcell_tsx_42f1" />
          </div>
        );
      case 'dropdown':
        return (
          <div
            className="relative h-full w-full"
            data-icod-id="src_features_sheets_grid_gridcell_tsx_32ee">
            <button
              className="flex h-full w-full items-center px-1 text-left text-sm outline-none"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              data-icod-id="src_features_sheets_grid_gridcell_tsx_5735">
              {editValue || <span
                className="text-muted-foreground"
                data-icod-id="src_features_sheets_grid_gridcell_tsx_acdc">Select...</span>}
            </button>
            {dropdownOpen && (
              <div
                className="absolute left-0 top-full z-50 mt-1 max-h-48 min-w-[120px] overflow-y-auto rounded-md border border-border bg-card py-1 shadow-md"
                data-icod-id="src_features_sheets_grid_gridcell_tsx_3c74">
                {column.options?.map((opt) => (
                  <button
                    key={opt.label}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-muted"
                    onClick={() => {
                      if (!committedRef.current) {
                        committedRef.current = true;
                        onCommit(opt.label);
                        setDropdownOpen(false);
                        onStopEdit();
                      }
                    }}
                    data-icod-id="src_features_sheets_grid_gridcell_tsx_8c4b">
                    <Pill
                      label={opt.label}
                      color={opt.color}
                      data-icod-id="src_features_sheets_grid_gridcell_tsx_9b1a" />
                  </button>
                ))}
                {(column.options?.length ?? 0) === 0 && (
                  <div
                    className="px-3 py-2 text-xs text-muted-foreground"
                    data-icod-id="src_features_sheets_grid_gridcell_tsx_f4e7">No options</div>
                )}
              </div>
            )}
          </div>
        );
      case 'checkbox':
        // Checkbox doesn't have a separate edit mode
        return null;
      case 'contact': {
        const filteredMembers = workspaceMembers?.filter(
          (m) =>
            !contactQuery ||
            m.fullName.toLowerCase().includes(contactQuery.toLowerCase()) ||
            m.email.toLowerCase().includes(contactQuery.toLowerCase()),
        ) ?? [];

        // Compute portal position based on cell rect
        const cellRect = cellRef.current?.getBoundingClientRect();
        const gap = 4;
        const listHeight = Math.min(filteredMembers.length * 40 + 48, 220);
        let portalTop = cellRect ? cellRect.bottom + gap : 0;
        let portalLeft = cellRect ? cellRect.left : 0;
        const portalWidth = Math.max(cellRect?.width ?? 180, 220);

        // Flip upward if near bottom of viewport
        if (cellRect && portalTop + listHeight > window.innerHeight) {
          portalTop = cellRect.top - gap - listHeight;
        }

        return (
          <div
            className="relative h-full w-full"
            data-icod-id="src_features_sheets_grid_gridcell_tsx_48c1">
            <input
              ref={inputRef}
              className="h-full w-full bg-transparent px-1 text-sm outline-none"
              value={contactQuery}
              placeholder="Search members..."
              onChange={(e) => setContactQuery(e.target.value)}
              onFocus={() => setContactOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setContactOpen(false);
                  cancelEdit();
                } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                  e.preventDefault();
                  // Keyboard navigation handled by portal list
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  // Select first filtered result
                  if (filteredMembers.length > 0) {
                    if (!committedRef.current) {
                      committedRef.current = true;
                      onCommit(filteredMembers[0].id);
                      setContactOpen(false);
                      onStopEdit();
                    }
                  }
                }
              }}
              onBlur={() => {
                setTimeout(() => {
                  if (!committedRef.current) {
                    committedRef.current = true;
                    setContactOpen(false);
                    onStopEdit();
                  }
                }, 200);
              }}
              data-icod-id="src_features_sheets_grid_gridcell_tsx_0847" />
            {contactOpen && ReactDOM.createPortal(
              <div
                className="fixed z-[9999] overflow-hidden rounded-md border border-border bg-card shadow-md"
                style={{ top: portalTop, left: portalLeft, width: portalWidth }}
                onMouseDown={(e) => e.preventDefault()}
                data-icod-id="src_features_sheets_grid_gridcell_tsx_portal">
                {/* Clear option */}
                {value != null && value !== '' && (
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
                    data-icod-id="src_features_sheets_grid_gridcell_tsx_clear">
                    <X
                      className="h-3 w-3 text-muted-foreground"
                      data-icod-id="src_features_sheets_grid_gridcell_tsx_fd3f" />
                    <span
                      className="text-muted-foreground"
                      data-icod-id="src_features_sheets_grid_gridcell_tsx_33d5">Clear</span>
                  </button>
                )}
                {/* Filtered member list */}
                <div
                  className="max-h-48 overflow-y-auto"
                  data-icod-id="src_features_sheets_grid_gridcell_tsx_5efc">
                  {filteredMembers.map((member) => (
                    <button
                      key={member.id}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-muted"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        if (!committedRef.current) {
                          committedRef.current = true;
                          onCommit(member.id);
                          setContactOpen(false);
                          onStopEdit();
                        }
                      }}
                      data-icod-id={`src_features_sheets_grid_gridcell_tsx_c630_${member.id}`}>
                      <Avatar
                        name={member.fullName}
                        size="sm"
                        className="!h-5 !w-5"
                        data-icod-id={`src_features_sheets_grid_gridcell_tsx_2acf_${member.id}`} />
                      <div
                        className="min-w-0 flex-1"
                        data-icod-id={`src_features_sheets_grid_gridcell_tsx_c2c3_${member.id}`}>
                        <div
                          className="truncate font-medium"
                          data-icod-id={`src_features_sheets_grid_gridcell_tsx_a0ea_${member.id}`}>{member.fullName}</div>
                        <div
                          className="truncate text-muted-foreground"
                          data-icod-id={`src_features_sheets_grid_gridcell_tsx_2509_${member.id}`}>{member.email}</div>
                      </div>
                    </button>
                  ))}
                  {filteredMembers.length === 0 && (
                    <div
                      className="px-3 py-2 text-xs text-muted-foreground"
                      data-icod-id="src_features_sheets_grid_gridcell_tsx_no_match">No matching people</div>
                  )}
                </div>
              </div>,
              document.body,
            )}
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div
      ref={cellRef}
      className={cn(
        'group relative flex items-center border-b border-r overflow-hidden',
        'h-[var(--grid-row-height)] px-[var(--grid-cell-padding-x)]',
        'text-sm text-foreground cursor-cell',
        isActive && 'ring-2 ring-inset ring-[var(--grid-selected-border)] z-10',
        isSelected && !isActive && 'bg-[var(--grid-range-bg)]',
        !isSelected && !isActive && 'hover:bg-[var(--grid-row-hover)]',
      )}
      style={{ borderColor: 'var(--grid-line-color)' }}
      onClick={() => {
        if (column.type === 'checkbox' && !readOnly) {
          handleCheckboxClick();
        }
      }}
      onDoubleClick={handleDoubleClick}
      data-icod-id="src_features_sheets_grid_gridcell_tsx_fd40">
      {isEditing && column.type !== 'checkbox' ? (
        renderEditMode()
      ) : (
        <div
          className="flex w-full items-center overflow-hidden"
          data-icod-id="src_features_sheets_grid_gridcell_tsx_0577">
          {renderDisplayValue()}
        </div>
      )}
    </div>
  );
}
