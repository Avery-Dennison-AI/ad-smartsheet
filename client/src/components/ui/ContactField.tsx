import { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import { Avatar } from '@/components/ui';
import { cn } from '@/utils/cn';

export interface WorkspaceMember {
  id: string;
  fullName: string;
  email: string;
}

interface ContactFieldProps {
  value: string | null;
  workspaceMembers: WorkspaceMember[];
  onSelect: (id: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Shared contact picker — displays a searchable dropdown of workspace members.
 * Styled to match the Input component trigger.
 */
export default function ContactField({
  value,
  workspaceMembers,
  onSelect,
  disabled = false,
  placeholder = 'Unassigned',
  className,
}: ContactFieldProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const anchorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number; placement: 'below' | 'above' } | null>(null);

  const filteredMembers = workspaceMembers.filter(
    (m) =>
      !query ||
      m.fullName.toLowerCase().includes(query.toLowerCase()) ||
      m.email.toLowerCase().includes(query.toLowerCase()),
  );

  const selectedMember = workspaceMembers.find((m) => m.id === value);

  // Compute position when opened
  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const gap = 4;
    const panelHeight = 260;

    let placement: 'below' | 'above' = 'below';
    let top = rect.bottom + gap;

    if (top + panelHeight > window.innerHeight && rect.top - gap - panelHeight >= 0) {
      placement = 'above';
      top = rect.top - gap;
    }

    setPos({ top, left: rect.left, width: Math.max(rect.width, 220), placement });
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(target)) {
        if (anchorRef.current && anchorRef.current.contains(target)) return;
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const handleSelect = useCallback((memberId: string) => {
    onSelect(memberId);
    setOpen(false);
    setQuery('');
    setFocusedIndex(-1);
  }, [onSelect]);

  const handleClear = useCallback(() => {
    onSelect(null);
    setOpen(false);
    setQuery('');
    setFocusedIndex(-1);
  }, [onSelect]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const maxIdx = filteredMembers.length + (value != null ? 1 : 0) - 1;
        setFocusedIndex((prev) => Math.min(prev + 1, maxIdx));
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
        break;
      }
      case 'Enter': {
        e.preventDefault();
        if (focusedIndex === 0 && value != null) {
          handleClear();
        } else {
          const memberIdx = value != null ? focusedIndex - 1 : focusedIndex;
          if (filteredMembers[memberIdx]) {
            handleSelect(filteredMembers[memberIdx].id);
          }
        }
        break;
      }
      case 'Escape': {
        e.preventDefault();
        setOpen(false);
        setQuery('');
        setFocusedIndex(-1);
        break;
      }
    }
  }, [open, filteredMembers, focusedIndex, value, handleSelect, handleClear]);

  const handleTriggerClick = () => {
    if (disabled) return;
    setOpen((prev) => !prev);
    setQuery('');
    setFocusedIndex(-1);
  };

  return (
    <div
      ref={anchorRef}
      className={cn('relative', className)}
      data-icod-id="src_components_ui_contactfield_tsx_root">
      {/* Trigger — styled like Input */}
      <div
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        tabIndex={disabled ? -1 : 0}
        onClick={handleTriggerClick}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex w-full cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-card px-3 py-1.5 text-sm text-foreground transition-colors duration-150 ease-in-out',
          'hover:bg-muted',
          open && 'border-primary shadow-[var(--focus-ring)]',
          disabled && 'cursor-not-allowed bg-muted text-muted-foreground',
        )}
        data-icod-id="src_components_ui_contactfield_tsx_trigger">
        {selectedMember ? (
          <>
            <Avatar
              name={selectedMember.fullName}
              size="sm"
              className="!h-5 !w-5 shrink-0"
              data-icod-id="src_components_ui_contactfield_tsx_avatar" />
            <span className="truncate" data-icod-id="src_components_ui_contactfield_tsx_name">
              {selectedMember.fullName}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground" data-icod-id="src_components_ui_contactfield_tsx_placeholder">
            {placeholder}
          </span>
        )}
      </div>

      {/* Dropdown portal */}
      {open && pos && ReactDOM.createPortal(
        <div
          ref={panelRef}
          role="listbox"
          className="rounded-[var(--radius-sm)] border border-border bg-card shadow-lg"
          style={{
            position: 'fixed',
            zIndex: 'var(--z-dropdown)',
            top: pos.placement === 'below' ? pos.top : undefined,
            bottom: pos.placement === 'above' ? window.innerHeight - pos.top : undefined,
            left: pos.left,
            width: pos.width,
            maxHeight: 260,
          }}
          data-icod-id="src_components_ui_contactfield_tsx_panel">
          {/* Search input */}
          <div className="border-b border-border px-3 py-2" data-icod-id="src_components_ui_contactfield_tsx_search_wrap">
            <input
              ref={inputRef}
              type="text"
              className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
              placeholder="Search members..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setFocusedIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              data-icod-id="src_components_ui_contactfield_tsx_search" />
          </div>

          {/* Member list */}
          <div className="max-h-[200px] overflow-y-auto" data-icod-id="src_components_ui_contactfield_tsx_list">
            {/* Clear option */}
            {value != null && (
              <div
                role="option"
                aria-selected={focusedIndex === 0}
                className={cn(
                  'flex cursor-pointer items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted',
                  focusedIndex === 0 && 'bg-muted',
                )}
                onMouseEnter={() => setFocusedIndex(0)}
                onClick={handleClear}
                data-icod-id="src_components_ui_contactfield_tsx_clear">
                <X className="h-3 w-3 text-muted-foreground" data-icod-id="src_components_ui_contactfield_tsx_clear_icon" />
                <span className="text-muted-foreground" data-icod-id="src_components_ui_contactfield_tsx_clear_text">Clear</span>
              </div>
            )}

            {filteredMembers.map((member, idx) => {
              const actualIdx = value != null ? idx + 1 : idx;
              return (
                <div
                  key={member.id}
                  role="option"
                  aria-selected={actualIdx === focusedIndex}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-muted',
                    actualIdx === focusedIndex && 'bg-muted',
                  )}
                  onMouseEnter={() => setFocusedIndex(actualIdx)}
                  onClick={() => handleSelect(member.id)}
                  data-icod-id={`src_components_ui_contactfield_tsx_member_${member.id}`}>
                  <Avatar
                    name={member.fullName}
                    size="sm"
                    className="!h-5 !w-5 shrink-0"
                    data-icod-id={`src_components_ui_contactfield_tsx_member_avatar_${member.id}`} />
                  <div className="min-w-0 flex-1" data-icod-id={`src_components_ui_contactfield_tsx_member_info_${member.id}`}>
                    <div className="truncate font-medium" data-icod-id={`src_components_ui_contactfield_tsx_member_name_${member.id}`}>
                      {member.fullName}
                    </div>
                    <div className="truncate text-muted-foreground" data-icod-id={`src_components_ui_contactfield_tsx_member_email_${member.id}`}>
                      {member.email}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredMembers.length === 0 && (
              <div className="px-3 py-2 text-xs text-muted-foreground" data-icod-id="src_components_ui_contactfield_tsx_no_results">
                No members found
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
