import { type ReactNode } from 'react';
import { cn } from '@/utils/cn';
import Tooltip from './Tooltip';

export interface ToggleButtonProps {
  pressed: boolean | 'mixed';
  onToggle: () => void;
  tooltip: string;
  icon: ReactNode;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

const sizeClass: Record<string, string> = {
  sm: 'h-6 w-6',
  md: 'h-7 w-7',
};

const iconSizeClass: Record<string, string> = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
};

/** A button with a "pressed" visual state, used in toolbars. */
export default function ToggleButton({
  pressed,
  onToggle,
  tooltip,
  icon,
  disabled = false,
  size = 'md',
}: ToggleButtonProps) {
  const isPressed = pressed === true;
  const isMixed = pressed === 'mixed';

  return (
    <Tooltip content={tooltip} data-icod-id="src_components_ui_togglebutton_tsx_5896">
      <button
        type="button"
        role="button"
        aria-pressed={isMixed ? 'mixed' : isPressed}
        disabled={disabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={onToggle}
        className={cn(
          'inline-flex items-center justify-center rounded-[var(--radius-sm)] transition-colors duration-150 ease-in-out',
          'focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]',
          'disabled:pointer-events-none disabled:opacity-50',
          isPressed
            ? 'bg-primary/10 text-primary border border-primary/20'
            : isMixed
              ? 'bg-primary/5 text-primary/70 border border-primary/10 opacity-75'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          sizeClass[size],
        )}
        data-mixed={isMixed || undefined}
        data-icod-id="src_components_ui_togglebutton_tsx_91f4">
        <span
          className={iconSizeClass[size]}
          data-icod-id="src_components_ui_togglebutton_tsx_6d12">{icon}</span>
      </button>
    </Tooltip>
  );
}
