import { useState, useRef, useEffect, useLayoutEffect, type ReactNode, type KeyboardEvent } from 'react';
import ReactDOM from 'react-dom';
import { cn } from '@/utils/cn';

export interface DropdownMenuItem {
  type?: 'item' | 'divider';
  label?: string | ReactNode;
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
  /** When true, suppresses restoring focus to the trigger element when the menu closes. */
  skipRestoreFocus?: boolean;
}

/** Trigger + floating menu with keyboard navigation (arrow keys, Escape).
 *  Renders the menu via a portal into document.body so it is never clipped
 *  by overflow-hidden or scrollable parent containers. */
export default function DropdownMenu({ trigger, items, className, header, skipRestoreFocus }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  // Compute position whenever the menu opens
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const gap = 4;

    // Default: below trigger, right-aligned
    let top = rect.bottom + gap;
    let left = rect.right;

    // Measure menu height after render — use a rough estimate first,
    // then adjust on next layout if needed.
    const menuHeight = menuRef.current?.offsetHeight ?? 200;
    const menuWidth = menuRef.current?.offsetWidth ?? 180;

    // Flip upward if not enough space below
    if (top + menuHeight > window.innerHeight) {
      top = rect.top - gap - menuHeight;
    }

    // Prevent overflow on the left
    if (left - menuWidth < 0) {
      left = rect.left + menuWidth;
    }

    setMenuPos({ top, left });
  }, [open]);

  // Close helper
  const close = () => {
    setOpen(false);
    setFocusIndex(-1);
    setMenuPos(null);
    if (skipRestoreFocus) {
      // Blur the trigger so it doesn't steal focus from whatever should be focused next
      triggerRef.current?.blur();
    }
  };

  // Close on click outside (both trigger and portal menu)
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        menuRef.current && !menuRef.current.contains(target)
      ) {
        close();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open]);

  // Close on scroll or resize
  useEffect(() => {
    if (!open) return;
    const handleScrollOrResize = () => close();
    window.addEventListener('scroll', handleScrollOrResize, { capture: true, passive: true });
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, { capture: true });
      window.removeEventListener('resize', handleScrollOrResize);
    };
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
          close();
        }
        break;
      }
      case 'Escape':
        close();
        break;
    }
  };

  const menuPortal = open && menuPos
    ? ReactDOM.createPortal(
        <div
          ref={menuRef}
          role="menu"
          className="fixed min-w-[180px] rounded-[var(--radius-md)] border border-border bg-card py-1 shadow-[var(--shadow-md)]"
          style={{ zIndex: 'var(--z-dropdown)', top: menuPos.top, left: menuPos.left, transform: 'translateX(-100%)' }}
          data-icod-id="src_components_ui_dropdownmenu_tsx_a5ea">
          {header && (
            <>
              <div
                role="none"
                className="px-3 py-3 text-sm font-medium text-[var(--color-gray-900)]"
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
                  close();
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
        </div>,
        document.body,
      )
    : null;

  return (
    <div
      className={cn('relative inline-block', className)}
      data-icod-id="src_components_ui_dropdownmenu_tsx_76ca">
      <div
        ref={triggerRef}
        role="button"
        tabIndex={0}
        onClick={() => { setOpen(!open); if (!open) setFocusIndex(actionableIndices[0] ?? 0); }}
        onKeyDown={handleKeyDown}
        aria-haspopup="true"
        aria-expanded={open}
        data-icod-id="src_components_ui_dropdownmenu_tsx_184c">
        {trigger}
      </div>
      {menuPortal}
    </div>
  );
}
