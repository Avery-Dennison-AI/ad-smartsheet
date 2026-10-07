import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import Badge from '@/components/ui/Badge';
import type { MyWorkItem } from '@/types';
import MyWorkRow from './MyWorkRow';

interface MyWorkGroupProps {
  title: string;
  items: MyWorkItem[];
  total: number;
  defaultOpen?: boolean;
  titleClassName?: string;
  className?: string;
}

export default function MyWorkGroup({
  title,
  items,
  total,
  defaultOpen = false,
  titleClassName,
  className,
}: MyWorkGroupProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (total === 0) return null;

  return (
    <div className={cn('border-b border-border last:border-b-0', className)} data-icod-id="src_features_home_myworkgroup_tsx_root">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-1 py-2.5 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-[var(--radius-sm)]"
        aria-expanded={open}
        data-icod-id="src_features_home_myworkgroup_tsx_header"
      >
        <ChevronRight
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-90',
          )}
          data-icod-id="src_features_home_myworkgroup_tsx_b5ee" />
        <span
          className={cn('text-sm font-semibold text-foreground', titleClassName)}
          data-icod-id="src_features_home_myworkgroup_tsx_0f4f">
          {title}
        </span>
        <Badge
          variant="neutral"
          size="sm"
          data-icod-id="src_features_home_myworkgroup_tsx_4dc4">{total}</Badge>
      </button>
      {open && (
        <div className="pb-2 pl-3" data-icod-id="src_features_home_myworkgroup_tsx_body">
          {items.map((item) => (
            <MyWorkRow
              key={item.rowId}
              item={item}
              data-icod-id={`src_features_home_myworkgroup_tsx_5a0e_${item.rowId}`} />
          ))}
          {total > items.length && (
            <p
              className="px-3 py-1.5 text-xs text-muted-foreground"
              data-icod-id="src_features_home_myworkgroup_tsx_d170">
              +{total - items.length} more
            </p>
          )}
        </div>
      )}
    </div>
  );
}
