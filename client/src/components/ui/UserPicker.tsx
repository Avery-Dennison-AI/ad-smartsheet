import { useState, useRef, useEffect, useLayoutEffect, useCallback, type KeyboardEvent } from 'react';
import ReactDOM from 'react-dom';
import { Search, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { inputClass } from './Input';
import Avatar from './Avatar';
import Spinner from './Spinner';

export interface UserOption {
  id: string;
  fullName: string;
  email: string;
  avatarSrc?: string;
}

export interface UserPickerProps {
  placeholder?: string;
  onSearch: (query: string) => Promise<UserOption[]>;
  value: UserOption | null;
  onChange: (user: UserOption | null) => void;
  disabled?: boolean;
  containerClassName?: string;
}

/** Combobox-style user picker with debounced async search and portal dropdown. */
export default function UserPicker({
  placeholder = 'Search by name or email\u2026',
  onSearch,
  value,
  onChange,
  disabled = false,
  containerClassName,
}: UserPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search — fires when query >= 2 chars after 300ms idle
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!open || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let cancelled = false;

    debounceTimer.current = setTimeout(() => {
      onSearch(query.trim())
        .then((res) => {
          if (!cancelled) {
            setResults(res);
            setLoading(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setResults([]);
            setLoading(false);
          }
        });
    }, 300);

    return () => {
      cancelled = true;
    };
  }, [query, open, onSearch]);

  // Position the floating panel
  useLayoutEffect(() => {
    if (!open || !wrapperRef.current) return;

    const rect = wrapperRef.current.getBoundingClientRect();
    const gap = 4;
    const panelHeight = panelRef.current?.offsetHeight ?? 200;

    let top = rect.bottom + gap;
    // Flip upward if not enough space below
    if (top + panelHeight > window.innerHeight) {
      top = rect.top - gap - panelHeight;
    }

    setPanelPos({ top, left: rect.left, width: rect.width });
  }, [open, results, loading]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        wrapperRef.current && !wrapperRef.current.contains(target) &&
        panelRef.current && !panelRef.current.contains(target)
      ) {
        close();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Close on scroll / resize
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

  const close = useCallback(() => {
    setOpen(false);
    setFocusIndex(-1);
    setPanelPos(null);
  }, []);

  const selectUser = useCallback(
    (user: UserOption) => {
      onChange(user);
      setQuery(user.fullName);
      close();
    },
    [onChange, close],
  );

  const clearSelection = useCallback(() => {
    onChange(null);
    setQuery('');
    setResults([]);
  }, [onChange]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        setFocusIndex((prev) => (prev + 1) % Math.max(results.length, 1));
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        setFocusIndex((prev) => (prev - 1 + results.length) % Math.max(results.length, 1));
        break;
      }
      case 'Enter': {
        e.preventDefault();
        if (focusIndex >= 0 && focusIndex < results.length) {
          selectUser(results[focusIndex]);
        }
        break;
      }
      case 'Escape': {
        e.preventDefault();
        close();
        break;
      }
    }
  };

  const isReadOnly = value !== null;

  // Panel content
  const panelContent = open && panelPos
    ? ReactDOM.createPortal(
        <div
          ref={panelRef}
          className="fixed z-[9999] rounded-[var(--radius-md)] border border-border bg-card shadow-[var(--shadow-md)]"
          style={{ top: panelPos.top, left: panelPos.left, width: panelPos.width }}
          data-icod-id="src_components_ui_userpicker_tsx_panel">
          {query.trim().length < 2 ? (
            <div
              className="px-3 py-3 text-xs text-muted-foreground"
              data-icod-id="src_components_ui_userpicker_tsx_hint">
              Type at least 2 characters to search
            </div>
          ) : loading ? (
            <div
              className="flex items-center gap-2 px-3 py-3 text-xs text-muted-foreground"
              data-icod-id="src_components_ui_userpicker_tsx_loading">
              <Spinner size="sm" data-icod-id="src_components_ui_userpicker_tsx_7e54" />
              Searching&hellip;
            </div>
          ) : results.length === 0 ? (
            <div
              className="px-3 py-3 text-xs text-muted-foreground"
              data-icod-id="src_components_ui_userpicker_tsx_empty">
              No matching people found
            </div>
          ) : (
            <div
              className="max-h-60 overflow-y-auto py-1"
              data-icod-id="src_components_ui_userpicker_tsx_list">
              {results.map((user, index) => (
                <button
                  key={user.id}
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-left transition-colors duration-150 ease-in-out',
                    focusIndex === index && 'bg-muted',
                  )}
                  onClick={() => selectUser(user)}
                  onMouseEnter={() => setFocusIndex(index)}
                  data-icod-id={`src_components_ui_userpicker_tsx_row_${index}`}>
                  <Avatar
                    name={user.fullName}
                    src={user.avatarSrc}
                    size="sm"
                    data-icod-id={`src_components_ui_userpicker_tsx_97c8_${user.id}`} />
                  <div
                    className="min-w-0 flex-1"
                    data-icod-id={`src_components_ui_userpicker_tsx_73c4_${user.id}`}>
                    <div
                      className="truncate text-sm font-medium text-foreground"
                      data-icod-id={`src_components_ui_userpicker_tsx_500e_${user.id}`}>{user.fullName}</div>
                    <div
                      className="truncate text-xs text-muted-foreground"
                      data-icod-id={`src_components_ui_userpicker_tsx_1a3c_${user.id}`}>{user.email}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>,
        document.body,
      )
    : null;

  return (
    <div
      ref={wrapperRef}
      className={cn('relative', containerClassName)}
      data-icod-id="src_components_ui_userpicker_tsx_wrapper">
      <div className="relative" data-icod-id="src_components_ui_userpicker_tsx_input_wrap">
        <span
          className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
          data-icod-id="src_components_ui_userpicker_tsx_search_icon">
          <Search className="h-4 w-4" data-icod-id="src_components_ui_userpicker_tsx_8f34" />
        </span>
        <input
          type="text"
          className={cn(
            inputClass(undefined, 'md'),
            'pl-8 pr-8',
            isReadOnly && 'cursor-default',
          )}
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            if (!isReadOnly) {
              setQuery(e.target.value);
              if (!open) setOpen(true);
            }
          }}
          onFocus={() => {
            if (!isReadOnly && !open) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          readOnly={isReadOnly}
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup="listbox"
          data-icod-id="src_components_ui_userpicker_tsx_input"
        />
        {value && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
            onClick={clearSelection}
            aria-label="Clear selection"
            data-icod-id="src_components_ui_userpicker_tsx_clear">
            <X className="h-4 w-4" data-icod-id="src_components_ui_userpicker_tsx_7e87" />
          </button>
        )}
      </div>
      {panelContent}
    </div>
  );
}
