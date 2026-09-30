import { useRef, useCallback } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface ColorSwatchOption {
  value: string;
  label: string;
  primaryColor: string;
}

export interface ColorSwatchGroupProps {
  options: ColorSwatchOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/** Horizontal row of circular color swatches for accent/theme selection. */
export default function ColorSwatchGroup({
  options,
  value,
  onChange,
  className,
}: ColorSwatchGroupProps) {
  const swatchRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      let nextIndex = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextIndex = (index + 1) % options.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        nextIndex = (index - 1 + options.length) % options.length;
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        onChange(options[index].value);
        return;
      }
      if (nextIndex >= 0) {
        const opt = options[nextIndex];
        swatchRefs.current.get(opt.value)?.focus();
      }
    },
    [options, onChange],
  );

  return (
    <div
      className={cn('flex flex-wrap items-start gap-6', className)}
      role="radiogroup"
      aria-label="Accent color"
      data-icod-id="src_components_ui_colorswatchgroup_tsx_ccf8">
      {options.map((option, index) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              if (el) swatchRefs.current.set(option.value, el);
              else swatchRefs.current.delete(option.value);
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.label}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              'group flex flex-col items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full',
            )}
            data-icod-id={`color_swatch_${option.value}`}>
            {/* Swatch circle */}
            <span
              className={cn(
                'relative flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-150',
                selected && 'ring-2 ring-offset-2',
                !selected && 'group-hover:scale-110',
              )}
              style={{
                backgroundColor: option.primaryColor,
                ...(selected ? { ringColor: option.primaryColor, boxShadow: `0 0 0 2px #fff, 0 0 0 4px ${option.primaryColor}` } : {}),
              }}
              data-icod-id={`color_swatch_circle_${option.value}`}>
              {selected && (
                <Check
                  className="h-3 w-3 text-white drop-shadow-sm"
                  data-icod-id={`color_swatch_check_${option.value}`} />
              )}
            </span>
            {/* Label */}
            <span
              className={cn(
                'text-xs transition-colors duration-150',
                selected
                  ? 'font-medium text-foreground'
                  : 'text-muted-foreground group-hover:text-foreground',
              )}
              data-icod-id={`color_swatch_label_${option.value}`}>
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
