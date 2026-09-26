import { cn } from '@/utils/cn';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClass = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-[3px]',
} as const;

/**
 * Indeterminate loading spinner. Color follows --color-primary by default.
 * On a coloured surface, inherit the text colour instead:
 *   <Spinner size="sm" className="border-current border-t-transparent" />
 */
export default function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block animate-spin rounded-full border-primary/30 border-t-primary',
        sizeClass[size],
        className,
      )}
      data-icod-id="src_components_ui_spinner_tsx_f8fc" />
  );
}
