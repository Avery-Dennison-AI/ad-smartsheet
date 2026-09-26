import { useState, useRef, useEffect, type ReactNode, type KeyboardEvent } from 'react';
import { cn } from '@/utils/cn';

export interface DropdownMenuItem {
  type?: 'item' | 'divider';
  label?: string;
  icon?: ReactNode;
  shortcut?: string;
  danger?: boolean;
  onClick?: () => void;
}

export interface DropdownMenuProps {
  trigger: ReactNode;
  items: DropdownMenuItem[];
  className?: string;
  /** Non-interactive header rendered above the items list. Skipped in keyboard navigation. */
  header?: ReactNode;
}

/** Trigger + floating menu with keyboard navigation (arrow keys, Escape). */
export default function DropdownMenu({ trigger, items, className, header }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFocusIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setFocusIndex(-1);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open]);

  const actionableIndices = items
    .map((item, i) => (item.type !== 'divider' ? i : -1))
    .filter((i) => i >= 0);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
        setFocusIndex(actionableIndices[0] ?? 0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const currentActionIdx = actionableIndices.indexOf(focusIndex);
        const nextIdx = actionableIndices[(currentActionIdx + 1) % actionableIndices.length];
        setFocusIndex(nextIdx);
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const currentActionIdx = actionableIndices.indexOf(focusIndex);
        const prevIdx = actionableIndices[(currentActionIdx - 1 + actionableIndices.length) % actionableIndices.length];
        setFocusIndex(prevIdx);
        break;
      }
      case 'Enter':
      case ' ': {
        e.preventDefault();
        const item = items[focusIndex];
        if (item && item.type !== 'divider' && item.onClick) {
          item.onClick();
          setOpen(false);
          setFocusIndex(-1);
        }
        break;
      }
      case 'Escape':
        setOpen(false);
        setFocusIndex(-1);
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative inline-block', className)}
      data-icod-id="src_components_ui_dropdownmenu_tsx_76ca">
      <div
        role="button"
        tabIndex={0}
        onClick={() => { setOpen(!open); if (!open) setFocusIndex(actionableIndices[0] ?? 0); }}
        onKeyDown={handleKeyDown}
        aria-haspopup="true"
        aria-expanded={open}
        data-icod-id="src_components_ui_dropdownmenu_tsx_184c">
        {trigger}
      </div>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          className={cn(
            'absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-[var(--radius-md)] border border-border bg-card py-1 shadow-[var(--shadow-md)]',
          )}
          data-icod-id="src_components_ui_dropdownmenu_tsx_a5ea">
          {header && (
            <>
              <div
                role="none"
                className="px-3 py-3 text-[var(--text-sm)] font-medium text-[var(--color-gray-900)]"
                data-icod-id="src_components_ui_dropdownmenu_tsx_header">
                {header}
              </div>
              <div
                className="my-1 border-t border-border"
                data-icod-id="src_components_ui_dropdownmenu_tsx_header_divider" />
            </>
          )}
          {items.map((item, index) => {
            if (item.type === 'divider') {
              return (
                <div
                  key={`div-${index}`}
                  className="my-1 border-t border-border"
                  data-icod-id={`src_components_ui_dropdownmenu_tsx_2f4c_${index}`} />
              );
            }
            return (
              <button
                key={index}
                role="menuitem"
                type="button"
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors duration-150 ease-in-out',
                  'focus-visible:outline-none',
                  focusIndex === index && 'bg-muted',
                  item.danger ? 'text-destructive' : 'text-foreground',
                  item.danger && focusIndex === index && 'bg-destructive/10',
                )}
                onClick={() => {
                  item.onClick?.();
                  setOpen(false);
                  setFocusIndex(-1);
                }}
                onMouseEnter={() => setFocusIndex(index)}
                data-icod-id={`src_components_ui_dropdownmenu_tsx_0930_${index}`}>
                {item.icon && <span
                  className="h-4 w-4 shrink-0"
                  data-icod-id={`src_components_ui_dropdownmenu_tsx_3eb8_${index}`}>{item.icon}</span>}
                <span
                  className="flex-1 text-left"
                  data-icod-id={`src_components_ui_dropdownmenu_tsx_3e61_${index}`}>{item.label}</span>
                {item.shortcut && (
                  <span
                    className="text-xs text-muted-foreground"
                    data-icod-id={`src_components_ui_dropdownmenu_tsx_b701_${index}`}>{item.shortcut}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
