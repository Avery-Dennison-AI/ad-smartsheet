import { cn } from '@/utils/cn';
import Avatar, { type AvatarSize } from './Avatar';

export interface AvatarGroupItem {
  src?: string | null;
  name: string;
}

export interface AvatarGroupProps {
  items: AvatarGroupItem[];
  max?: number;
  size?: AvatarSize;
  className?: string;
}

/** Overlapping avatars with +N overflow chip. */
export default function AvatarGroup({
  items,
  max = 3,
  size = 'md',
  className,
}: AvatarGroupProps) {
  const visible = items.slice(0, max);
  const overflow = items.length - max;

  return (
    <div
      className={cn('flex items-center -space-x-2', className)}
      data-icod-id="src_components_ui_avatargroup_tsx_935d">
      {visible.map((item, i) => (
        <div
          key={i}
          className="ring-2 ring-card rounded-full"
          data-icod-id={`src_components_ui_avatargroup_tsx_1046_${i}`}>
          <Avatar
            src={item.src}
            name={item.name}
            size={size}
            data-icod-id={`src_components_ui_avatargroup_tsx_7c54_${i}`} />
        </div>
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground ring-2 ring-card select-none',
            size === 'sm' ? 'h-6 w-6 text-2xs' : size === 'md' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm',
          )}
          data-icod-id="src_components_ui_avatargroup_tsx_4707">
          +{overflow}
        </div>
      )}
    </div>
  );
}
