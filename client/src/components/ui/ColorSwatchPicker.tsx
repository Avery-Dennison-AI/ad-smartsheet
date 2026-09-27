import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import { Check, RotateCcw } from 'lucide-react';

interface ColorSwatchRow {
  label: string;
  colors: string[];
}

const SWATCH_ROWS: ColorSwatchRow[] = [
  {
    label: 'Neutrals',
    colors: ['#FFFFFF', '#F1F5F9', '#CBD5E1', '#64748B', '#1E293B', '#000000'],
  },
  {
    label: 'Accents',
    colors: ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#14B8A6', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899'],
  },
  {
    label: 'Tints',
    colors: ['#FEF2F2', '#FFF7ED', '#FEFCE8', '#F0FDF4', '#F0FDFA', '#EFF6FF', '#EEF2FF', '#F5F3FF', '#FDF4FF'],
  },
];

export interface ColorSwatchPickerProps {
  anchorRef: React.RefObject<HTMLElement | null>;
  value: string | null;
  onChange: (hex: string | null) => void;
  onClose: () => void;
}

/**
 * A portal-rendered floating color palette popover.
 * Renders above everything via z-index. Flips above anchor if near bottom of viewport.
 */
export default function ColorSwatchPicker({
  anchorRef,
  value,
  onChange,
  onClose,
}: ColorSwatchPickerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; placement: 'below' | 'above' } | null>(null);

  // Compute position
  useLayoutEffect(() => {
    if (!anchorRef.current) return;

    const rect = anchorRef.current.getBoundingClientRect();
    const gap = 4;
    const estimatedHeight = 260; // approximate panel height

    let placement: 'below' | 'above' = 'below';
    let top = rect.bottom + gap;

    if (top + estimatedHeight > window.innerHeight && rect.top - gap - estimatedHeight >= 0) {
      placement = 'above';
      top = rect.top - gap;
    }

    setPos({ top, left: rect.left, placement });
  }, [anchorRef]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(target)) {
        if (anchorRef.current && anchorRef.current.contains(target)) return;
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, anchorRef]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!pos) return null;

  const portalContent = (
    <div
      ref={panelRef}
      className="fixed w-64 rounded-md border border-border bg-card p-2 shadow-lg"
      style={{
        zIndex: 'var(--z-dropdown)',
        top: pos.placement === 'below' ? pos.top : undefined,
        bottom: pos.placement === 'above' ? window.innerHeight - pos.top : undefined,
        left: pos.left,
      }}
      onMouseDown={(e) => e.preventDefault()}
      data-icod-id="color_swatch_picker_root"
    >
      {/* Reset row */}
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-muted"
        onClick={() => {
          onChange(null);
          onClose();
        }}
        data-icod-id="color_swatch_picker_reset"
      >
        <RotateCcw
          className="h-3 w-3 text-muted-foreground"
          data-icod-id="src_components_ui_colorswatchpicker_tsx_fd8a" />
        <span
          className="text-foreground"
          data-icod-id="src_components_ui_colorswatchpicker_tsx_9942">Reset</span>
        {value === null && <Check
          className="ml-auto h-3 w-3 text-primary"
          data-icod-id="src_components_ui_colorswatchpicker_tsx_d6aa" />}
      </button>

      <div
        className="my-1 border-t border-border"
        data-icod-id="src_components_ui_colorswatchpicker_tsx_b847" />

      {/* Color rows */}
      {SWATCH_ROWS.map((row) => (
        <div key={row.label} className="mb-1.5" data-icod-id={`color_swatch_row_${row.label}`}>
          <span
            className="mb-1 block px-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
            data-icod-id={`src_components_ui_colorswatchpicker_tsx_a62b_${row.label}`}>
            {row.label}
          </span>
          <div
            className="flex flex-wrap gap-1 px-0.5"
            data-icod-id={`src_components_ui_colorswatchpicker_tsx_c859_${row.label}`}>
            {row.colors.map((hex) => {
              const isActive = value?.toUpperCase() === hex.toUpperCase();
              return (
                <button
                  key={hex}
                  type="button"
                  className="relative h-5 w-5 rounded-sm border border-border/60 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={{ backgroundColor: hex }}
                  title={hex}
                  aria-label={`Color ${hex}`}
                  onClick={() => {
                    onChange(hex);
                    onClose();
                  }}
                  data-icod-id={`color_swatch_${hex.replace('#', '')}`}
                >
                  {isActive && (
                    <Check
                      className="absolute inset-0 m-auto h-3 w-3 drop-shadow-sm"
                      style={{ color: hex === '#FFFFFF' || hex === '#F1F5F9' || hex === '#FEF2F2' || hex === '#FFF7ED' || hex === '#FEFCE8' || hex === '#F0FDF4' || hex === '#F0FDFA' || hex === '#EFF6FF' || hex === '#EEF2FF' || hex === '#F5F3FF' || hex === '#FDF4FF' || hex === '#CBD5E1' ? '#1E293B' : '#FFFFFF' }}
                      data-icod-id={`src_components_ui_colorswatchpicker_tsx_8988_${row.label}_${hex}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return ReactDOM.createPortal(portalContent, document.body);
}
