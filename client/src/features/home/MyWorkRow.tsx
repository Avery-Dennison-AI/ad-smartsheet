import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import Pill from '@/components/ui/Pill';
import type { MyWorkItem } from '@/types';

interface MyWorkRowProps {
  item: MyWorkItem;
  className?: string;
}

/** Formats a due date into human-friendly relative text. */
function formatDueDate(isoString: string | null): string | null {
  if (!isoString) return null;

  const due = new Date(isoString);
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dueDay = new Date(Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate()));
  const diffMs = dueDay.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays < -1) {
    const absDays = Math.abs(diffDays);
    return `${absDays}d overdue`;
  }
  if (diffDays === -1) return 'Yesterday';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `In ${diffDays} days`;

  // Format as month + day
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[due.getUTCMonth()]} ${due.getUTCDate()}`;
}

export default function MyWorkRow({ item, className }: MyWorkRowProps) {
  const navigate = useNavigate();
  const dueDateText = formatDueDate(item.dueDate);
  const isOverdue = item.dueDate != null && dueDateText?.includes('overdue');

  return (
    <button
      type="button"
      onClick={() => navigate(`/sheets/${item.sheetId}?row=${item.rowId}`)}
      className={cn(
        'flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      data-icod-id={`src_features_home_myworkrow_tsx_${item.rowId}`}
    >
      <div
        className="min-w-0 flex-1"
        data-icod-id="src_features_home_myworkrow_tsx_28f7">
        <div
          className="flex items-center gap-2"
          data-icod-id="src_features_home_myworkrow_tsx_bfc7">
          <span
            className="truncate text-sm font-medium text-foreground"
            data-icod-id="src_features_home_myworkrow_tsx_8467">
            {item.taskName || 'Untitled'}
          </span>
          {item.status && (
            <Pill
              label={item.status.label}
              color={item.status.color}
              data-icod-id="src_features_home_myworkrow_tsx_b83f" />
          )}
        </div>
        <div
          className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground"
          data-icod-id="src_features_home_myworkrow_tsx_7c5a">
          <span className="truncate" data-icod-id="src_features_home_myworkrow_tsx_4a97">{item.sheetName}</span>
          <span aria-hidden="true" data-icod-id="src_features_home_myworkrow_tsx_0053">&middot;</span>
          <span className="truncate" data-icod-id="src_features_home_myworkrow_tsx_06d0">{item.workspaceName}</span>
        </div>
      </div>
      {dueDateText && (
        <span
          className={cn(
            'shrink-0 text-xs font-medium',
            isOverdue ? 'text-destructive' : 'text-muted-foreground',
          )}
          data-icod-id="src_features_home_myworkrow_tsx_ccc7">
          {dueDateText}
        </span>
      )}
    </button>
  );
}
