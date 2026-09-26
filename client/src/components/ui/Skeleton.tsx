import { cn } from '@/utils/cn';

export type SkeletonVariant = 'line' | 'card' | 'tableRow';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  /** Width for line variant (CSS value). Defaults to 100%. */
  width?: string;
  className?: string;
}

const shimmerBase =
  'animate-[shimmer_2s_ease-in-out_infinite] bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]';

/** Loading placeholder with shimmer animation. */
export default function Skeleton({ variant = 'line', width, className }: SkeletonProps) {
  switch (variant) {
    case 'line':
      return (
        <div
          className={cn('h-4 rounded-[var(--radius-sm)]', shimmerBase, className)}
          style={{ width: width || '100%' }}
          data-icod-id="src_components_ui_skeleton_tsx_6a2a" />
      );
    case 'card':
      return (
        <div
          className={cn('flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border p-4', className)}
          data-icod-id="src_components_ui_skeleton_tsx_6211">
          <div
            className={cn('h-4 w-1/3 rounded-[var(--radius-sm)]', shimmerBase)}
            data-icod-id="src_components_ui_skeleton_tsx_b388" />
          <div
            className={cn('h-4 w-full rounded-[var(--radius-sm)]', shimmerBase)}
            data-icod-id="src_components_ui_skeleton_tsx_b785" />
          <div
            className={cn('h-4 w-2/3 rounded-[var(--radius-sm)]', shimmerBase)}
            data-icod-id="src_components_ui_skeleton_tsx_7d0a" />
        </div>
      );
    case 'tableRow':
      return (
        <div
          className={cn('flex items-center gap-4 border-b border-border px-4 py-3', className)}
          data-icod-id="src_components_ui_skeleton_tsx_0ea9">
          <div
            className={cn('h-4 w-8 rounded-[var(--radius-sm)]', shimmerBase)}
            data-icod-id="src_components_ui_skeleton_tsx_012a" />
          <div
            className={cn('h-4 flex-1 rounded-[var(--radius-sm)]', shimmerBase)}
            data-icod-id="src_components_ui_skeleton_tsx_88d2" />
          <div
            className={cn('h-4 w-16 rounded-[var(--radius-sm)]', shimmerBase)}
            data-icod-id="src_components_ui_skeleton_tsx_aa05" />
          <div
            className={cn('h-4 w-24 rounded-[var(--radius-sm)]', shimmerBase)}
            data-icod-id="src_components_ui_skeleton_tsx_72c2" />
        </div>
      );
  }
}
