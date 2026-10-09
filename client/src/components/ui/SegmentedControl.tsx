import { type ReactNode } from 'react';
import { cn } from '@/utils/cn';
import Tooltip from './Tooltip';

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  disabledTooltip?: string;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** Pill-shaped segmented control with raised active chip. */
function SegmentedControlInner<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      className={cn(
        'inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5',
        className,
      )}
      data-icod-id="src_components_ui_segmentedcontrol_tsx_root">
      {options.map((opt, __icodIdx0) => {
        const isActive = opt.value === value;
        const isDisabled = !!opt.disabled;

        const buttonEl = (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            disabled={isDisabled}
            onClick={() => !isDisabled && onChange(opt.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all duration-150',
              'focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
              isDisabled && 'cursor-not-allowed opacity-40',
            )}
            data-icod-id={`src_components_ui_segmentedcontrol_tsx_opt_${opt.value}`}>
            {opt.icon && (
              <span className="shrink-0" data-icod-id={`src_components_ui_segmentedcontrol_tsx_icon_${opt.value}`}>
                {opt.icon}
              </span>
            )}
            <span data-icod-id={`src_components_ui_segmentedcontrol_tsx_label_${opt.value}`}>
              {opt.label}
            </span>
          </button>
        );

        if (isDisabled && opt.disabledTooltip) {
          return (
            <Tooltip
              key={opt.value}
              content={opt.disabledTooltip}
              data-icod-id={`src_components_ui_segmentedcontrol_tsx_8390_${__icodIdx0}`}>
              {buttonEl}
            </Tooltip>
          );
        }

        return buttonEl;
      })}
    </div>
  );
}

// Type wrapper to allow generic usage without explicit type annotation at call site
const SegmentedControl = SegmentedControlInner as <T extends string>(
  props: SegmentedControlProps<T>,
) => JSX.Element;

export default SegmentedControl;
