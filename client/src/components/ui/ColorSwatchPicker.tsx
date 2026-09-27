import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import { Check, RotateCcw } from 'lucide-react';

interface SwatchDef {
  varName: string;
  /** Fallback hex for comparison logic (must match the CSS variable value). */
  hex: string;
}

interface ColorSwatchRow {
  label: string;
  colors: SwatchDef[];
}

const SWATCH_ROWS: ColorSwatchRow[] = [
  {
    label: 'Neutrals',
    colors: [
      { varName: '--palette-neutral-0', hex: '#FFFFFF' },
      { varName: '--palette-neutral-100', hex: '#F1F5F9' },
      { varName: '--palette-neutral-300', hex: '#CBD5E1' },
      { varName: '--palette-neutral-500', hex: '#64748B' },
      { varName: '--palette-neutral-800', hex: '#1E293B' },
      { varName: '--palette-neutral-900', hex: '#000000' },
    ],
  },
  {
    label: 'Accents',
    colors: [
      { varName: '--palette-red', hex: '#EF4444' },
      { varName: '--palette-orange', hex: '#F97316' },
      { varName: '--palette-yellow', hex: '#EAB308' },
      { varName: '--palette-green', hex: '#22C55E' },
      { varName: '--palette-teal', hex: '#14B8A6' },
      { varName: '--palette-blue', hex: '#3B82F6' },
      { varName: '--palette-indigo', hex: '#6366F1' },
      { varName: '--palette-violet', hex: '#8B5CF6' },
      { varName: '--palette-pink', hex: '#EC4899' },
    ],
  },
  {
    label: 'Tints',
    colors: [
      { varName: '--palette-red-light', hex: '#FEF2F2' },
      { varName: '--palette-orange-light', hex: '#FFF7ED' },
      { varName: '--palette-yellow-light', hex: '#FEFCE8' },
      { varName: '--palette-green-light', hex: '#F0FDF4' },
      { varName: '--palette-teal-light', hex: '#F0FDFA' },
      { varName: '--palette-blue-light', hex: '#EFF6FF' },
      { varName: '--palette-indigo-light', hex: '#EEF2FF' },
      { varName: '--palette-violet-light', hex: '#F5F3FF' },
      { varName: '--palette-pink-light', hex: '#FDF4FF' },
    ],
  },
];

/** Light-background hex values where the check icon should be dark. */
const LIGHT_HEXES = new Set([
  '#FFFFFF', '#F1F5F9', '#FEF2F2', '#FFF7ED', '#FEFCE8',
  '#F0FDF4', '#F0FDFA', '#EFF6FF', '#EEF2FF', '#F5F3FF',
  '#FDF4FF', '#CBD5E1',
]);

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
            {row.colors.map((swatch) => {
              const isActive = value?.toUpperCase() === swatch.hex.toUpperCase();
              return (
                <button
                  key={swatch.hex}
                  type="button"
                  className="relative h-5 w-5 rounded-sm border border-border/60 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={{ backgroundColor: `var(${swatch.varName})` }}
                  title={swatch.hex}
                  aria-label={`Color ${swatch.hex}`}
                  onClick={() => {
                    onChange(swatch.hex);
                    onClose();
                  }}
                  data-icod-id={`color_swatch_${swatch.hex.replace('#', '')}`}
                >
                  {isActive && (
                    <Check
                      className="absolute inset-0 m-auto h-3 w-3 drop-shadow-sm"
                      style={{ color: LIGHT_HEXES.has(swatch.hex) ? '#1E293B' : '#FFFFFF' }}
                      data-icod-id={`src_components_ui_colorswatchpicker_tsx_8988_${row.label}_${swatch.hex}`} />
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
