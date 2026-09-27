import { cn } from '@/utils/cn';
import { workspaceColorValue } from '@/utils/workspaceColors';

interface WorkspaceIconProps {
  name: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/** A small rounded square showing a workspace's first letter in its brand color. */
export default function WorkspaceIcon({ name, color, size = 'sm', className }: WorkspaceIconProps) {
  const letter = name.charAt(0).toUpperCase();
  const resolvedColor = workspaceColorValue(color);

  const sizeClasses = size === 'sm' ? 'h-5 w-5 text-2xs' : size === 'md' ? 'h-8 w-8 text-sm' : 'h-10 w-10 text-base';

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-[var(--radius-sm)] font-medium',
        sizeClasses,
        className,
      )}
      style={{
        backgroundColor: `color-mix(in srgb, ${resolvedColor} 15%, transparent)`,
        color: resolvedColor,
      }}
      data-icod-id="src_components_ui_workspaceicon_tsx_1188">
      {letter}
    </div>
  );
}
