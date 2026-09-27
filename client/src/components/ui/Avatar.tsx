import { cn } from '@/utils/cn';

export type AvatarSize = 'sm' | 'md' | 'lg';

const sizeClass: Record<AvatarSize, string> = {
  sm: 'h-6 w-6 text-2xs',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
};

export interface AvatarProps {
  /** Image URL. If not provided, initials are rendered. */
  src?: string | null;
  /** Name used to derive initials and background colour. */
  name: string;
  size?: AvatarSize;
  className?: string;
}

/** Deterministic hue from a name string for the background colour. */
function nameToHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Shows image if src provided, else initials with deterministic background. */
export default function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover', sizeClass[size], className)}
        data-icod-id="src_components_ui_avatar_tsx_f2b0" />
    );
  }

  const hue = nameToHue(name);
  const initials = getInitials(name);

  return (
    <div
      aria-label={name}
      className={cn(
        'flex items-center justify-center rounded-full font-medium text-card select-none',
        sizeClass[size],
        className,
      )}
      style={{
        backgroundColor: `hsl(${hue}, 55%, 48%)`,
      }}
      data-icod-id="src_components_ui_avatar_tsx_9019">
      {initials}
    </div>
  );
}
