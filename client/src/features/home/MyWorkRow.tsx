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

  const handleNavigate = () => {
    navigate(`/sheets/${item.sheetId}?row=${item.rowId}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleNavigate();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleNavigate}
      onKeyDown={handleKeyDown}
      className={cn(
        'flex w-full cursor-pointer items-center gap-4 rounded px-2 py-1.5 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      data-icod-id={`src_features_home_myworkrow_tsx_${item.rowId}`}
    >
      {/* Column 1: Task name (grows, truncates) */}
      <div className="min-w-0 flex-1" data-icod-id="src_features_home_myworkrow_tsx_task">
        <span className="block truncate text-sm font-medium text-foreground" data-icod-id="src_features_home_myworkrow_tsx_8467">
          {item.key && (
            <span
              className="text-[--color-text-muted] text-xs font-mono mr-1"
              data-icod-id="src_features_home_myworkrow_tsx_a913">{item.key}</span>
          )}
          <span data-icod-id="src_features_home_myworkrow_tsx_e3f3">{item.taskName || 'Untitled'}</span>
        </span>
        {item.rowKey && !item.key && (
          <span className="block truncate text-xs text-muted-foreground" data-icod-id="src_features_home_myworkrow_tsx_key">
            {item.rowKey}
          </span>
        )}
      </div>
      {/* Column 2: Status pill (fixed ~100px) */}
      <div className="w-[100px] shrink-0" data-icod-id="src_features_home_myworkrow_tsx_status">
        {item.status && (
          <Pill
            label={item.status.label}
            color={item.status.color}
            data-icod-id="src_features_home_myworkrow_tsx_b83f" />
        )}
      </div>
      {/* Column 3: Due date (fixed ~80px) */}
      <div className="w-[80px] shrink-0" data-icod-id="src_features_home_myworkrow_tsx_due">
        {dueDateText && (
          <span
            className={cn(
              'text-xs font-medium',
              isOverdue ? 'text-destructive' : 'text-muted-foreground',
            )}
            data-icod-id="src_features_home_myworkrow_tsx_ccc7">
            {dueDateText}
          </span>
        )}
      </div>
      {/* Column 4: Sheet / workspace (fixed, right-aligned, muted) */}
      <div className="shrink-0 text-right" data-icod-id="src_features_home_myworkrow_tsx_context">
        <span className="block max-w-[140px] truncate text-xs text-muted-foreground" data-icod-id="src_features_home_myworkrow_tsx_ctx_text">
          {item.sheetName} &middot; {item.workspaceName}
        </span>
      </div>
    </div>
  );
}
