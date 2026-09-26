import { cn } from '@/utils/cn';

export type BadgeVariant =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'status-red'
  | 'status-yellow'
  | 'status-green'
  | 'status-blue'
  | 'status-gray';

export type BadgeSize = 'sm' | 'md';

const variantClass: Record<BadgeVariant, string> = {
  neutral: 'bg-muted text-muted-foreground',
  success: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
  warning: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
  danger: 'bg-[var(--color-danger-bg)] text-destructive',
  info: 'bg-[var(--color-info-bg)] text-[var(--color-info)]',
  'status-red': 'bg-[var(--status-red-bg)] text-[var(--status-red)]',
  'status-yellow': 'bg-[var(--status-yellow-bg)] text-[var(--status-yellow)]',
  'status-green': 'bg-[var(--status-green-bg)] text-[var(--status-green)]',
  'status-blue': 'bg-[var(--status-blue-bg)] text-[var(--status-blue)]',
  'status-gray': 'bg-[var(--status-gray-bg)] text-[var(--status-gray)]',
};

const sizeClass: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5',
  md: 'px-2 py-0.5 text-xs',
};

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  className?: string;
}

/** Inline label for statuses, categories, and counts. */
export default function Badge({
  variant = 'neutral',
  size = 'md',
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium leading-none',
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      style={size === 'sm' ? { fontSize: 'var(--text-2xs)' } : undefined}
      data-icod-id="src_components_ui_badge_tsx_9c6c">
      {children}
    </span>
  );
}
