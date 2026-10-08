import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
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
      <Button
        variant="ghost"
        onClick={() => setOpen(!open)}
        className="flex w-full justify-start gap-2 px-2 py-1.5"
        aria-expanded={open}
        data-icod-id="src_features_home_myworkgroup_tsx_header"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" data-icod-id="src_features_home_myworkgroup_tsx_chevron_open" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" data-icod-id="src_features_home_myworkgroup_tsx_chevron_closed" />
        )}
        <span
          className={cn('text-sm font-medium text-foreground', titleClassName)}
          data-icod-id="src_features_home_myworkgroup_tsx_0f4f">
          {title}
        </span>
        <Badge
          variant="neutral"
          size="sm"
          className={titleClassName}
          data-icod-id="src_features_home_myworkgroup_tsx_4dc4">{total}</Badge>
      </Button>
      {open && (
        <div className="pb-2 pl-6" data-icod-id="src_features_home_myworkgroup_tsx_body">
          {items.map((item) => (
            <MyWorkRow
              key={item.rowId}
              item={item}
              data-icod-id={`src_features_home_myworkgroup_tsx_5a0e_${item.rowId}`} />
          ))}
          {total > items.length && (
            <p
              className="px-2 py-1.5 text-xs text-muted-foreground"
              data-icod-id="src_features_home_myworkgroup_tsx_d170">
              +{total - items.length} more
            </p>
          )}
        </div>
      )}
    </div>
  );
}
