import { cn } from '@/utils/cn';

interface WorkspaceIconProps {
  name: string;
  color: string;
  size?: 'sm' | 'md';
  className?: string;
}

/** A small rounded square showing a workspace's first letter in its brand color. */
export default function WorkspaceIcon({ name, color, size = 'sm', className }: WorkspaceIconProps) {
  const letter = name.charAt(0).toUpperCase();

  const sizeClasses = size === 'sm' ? 'h-5 w-5 text-[10px]' : 'h-8 w-8 text-[var(--text-sm)]';

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-[var(--radius-sm)] font-medium',
        sizeClasses,
        className,
      )}
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
        color,
      }}
      data-icod-id="src_components_ui_workspaceicon_tsx_1188">
      {letter}
    </div>
  );
}
