import type { ComponentType, ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface EmptyStateProps {
  /** A lucide-react icon component. */
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  /** Primary call to action, usually a <Button>. */
  action?: ReactNode;
  className?: string;
}

/** "Nothing here yet" placeholder for empty lists, grids, and search results. */
export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-4 py-20 text-center',
        className,
      )}
      data-icod-id="src_components_ui_emptystate_tsx_6ea6">
      <div
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-accent"
        data-icod-id="src_components_ui_emptystate_tsx_a792">
        <Icon
          className="h-5 w-5 text-accent-foreground"
          data-icod-id="src_components_ui_emptystate_tsx_c1bd" />
      </div>
      <h3
        className="font-semibold text-foreground text-[var(--text-md)]"
        data-icod-id="src_components_ui_emptystate_tsx_67d7">{title}</h3>
      {description && (
        <p
          className="mt-1 max-w-sm text-sm text-muted-foreground"
          data-icod-id="src_components_ui_emptystate_tsx_d55a">{description}</p>
      )}
      {action && <div className="mt-5" data-icod-id="src_components_ui_emptystate_tsx_0732">{action}</div>}
    </div>
  );
}
