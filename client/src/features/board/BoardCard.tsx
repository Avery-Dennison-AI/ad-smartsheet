import { useCallback, useRef } from 'react';
import { MessageSquare, Paperclip, MoreHorizontal, ChevronRight } from 'lucide-react';
import { Avatar, Button, DropdownMenu, IconButton } from '@/components/ui';
import type { DropdownMenuItem } from '@/components/ui';
import { cn } from '@/utils/cn';
import type { BoardCardData, OnOpenCard } from './boardTypes';
import type { WorkspaceRole } from '@/types';

interface BoardCardProps {
  card: BoardCardData;
  isProject: boolean;
  userRole: WorkspaceRole;
  onOpen: OnOpenCard;
  /** Column IDs available for "Move to" menu */
  columnOptions?: { id: string; label: string }[];
  onMoveTo?: (rowId: string, targetColumnId: string) => void;
  /** Drag start handler */
  onDragStart?: (e: React.PointerEvent, rowId: string) => void;
  className?: string;
}

/** Format ISO date as "Jan 15". Returns null if no date. */
function formatShortDate(iso: string | undefined): string | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return null;
  }
}

/** Check if a date is in the past. */
function isOverdue(iso: string | undefined): boolean {
  if (!iso) return false;
  try {
    return new Date(iso).getTime() < Date.now();
  } catch {
    return false;
  }
}

export default function BoardCard({
  card,
  isProject,
  userRole,
  onOpen,
  columnOptions,
  onMoveTo,
  onDragStart,
  className,
}: BoardCardProps) {
  const isViewer = userRole === 'viewer';
  const cardRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(() => {
    onOpen(card.rowId);
  }, [onOpen, card.rowId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onOpen(card.rowId);
      }
    },
    [onOpen, card.rowId],
  );

  // Move-to dropdown items
  const moveItems: DropdownMenuItem[] = (columnOptions ?? [])
    .filter((c) => c.id !== card.rowId) // filter out current column handled externally
    .map((c) => ({
      label: c.label,
      onClick: () => onMoveTo?.(card.rowId, c.id),
    }));

  const dueDateStr = formatShortDate(card.dueDate);
  const overdue = isOverdue(card.dueDate);

  return (
    <div
      ref={cardRef}
      tabIndex={0}
      role="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onPointerDown={(e) => {
        if (!isViewer && onDragStart) {
          // Only start drag from the drag handle area (top of card)
          onDragStart(e, card.rowId);
        }
      }}
      className={cn(
        'group relative cursor-pointer rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]',
        !isViewer && 'cursor-grab active:cursor-grabbing',
        className,
      )}
      data-icod-id={`board_card_${card.rowId}`}>
      {/* Project card layout */}
      {isProject && (
        <>
          {/* Top row: key + type icon */}
          {(card.key || card.typeName) && (
            <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground" data-icod-id={`board_card_top_${card.rowId}`}>
              {card.key && <span data-icod-id={`board_card_key_${card.rowId}`}>{card.key}</span>}
              {card.typeName && (
                <span className="flex items-center gap-0.5" data-icod-id={`board_card_type_${card.rowId}`}>
                  {card.typeIcon && <span data-icod-id={`board_card_typeicon_${card.rowId}`}>{card.typeIcon}</span>}
                  {card.typeName}
                </span>
              )}
            </div>
          )}
          {/* Title */}
          <p className="line-clamp-2 text-sm font-medium text-foreground" data-icod-id={`board_card_title_${card.rowId}`}>
            {card.title}
          </p>
          {/* Priority + assignee + due date */}
          <div className="mt-2 flex items-center gap-2" data-icod-id={`board_card_meta_${card.rowId}`}>
            {card.priorityLabel && (
              <span className="text-xs text-muted-foreground" data-icod-id={`board_card_priority_${card.rowId}`}>
                {card.priorityLabel}
              </span>
            )}
            {card.assigneeName && (
              <Avatar name={card.assigneeName} src={card.assigneeAvatar} size="sm" className="!h-5 !w-5 text-[10px]" data-icod-id={`board_card_avatar_${card.rowId}`} />
            )}
            {dueDateStr && (
              <span className={cn('ml-auto text-xs', overdue ? 'text-destructive' : 'text-muted-foreground')} data-icod-id={`board_card_due_${card.rowId}`}>
                {dueDateStr}
              </span>
            )}
          </div>
        </>
      )}
      {/* Plain sheet card layout */}
      {!isProject && (
        <>
          <p className="line-clamp-2 text-sm font-medium text-foreground" data-icod-id={`board_card_title_${card.rowId}`}>
            {card.title}
          </p>
          {card.extraFields && card.extraFields.length > 0 && (
            <div className="mt-2 flex flex-col gap-1" data-icod-id={`board_card_extra_${card.rowId}`}>
              {card.extraFields.slice(0, 3).map((f, i) => (
                <div key={i} className="flex items-baseline gap-1 text-xs" data-icod-id={`board_card_field_${card.rowId}_${i}`}>
                  <span className="text-muted-foreground" data-icod-id={`board_card_flabel_${card.rowId}_${i}`}>{f.label}:</span>
                  <span className="truncate text-foreground" data-icod-id={`board_card_fval_${card.rowId}_${i}`}>{f.value}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {/* Bottom row: badges + sub-items + move menu */}
      <div className="mt-2 flex items-center gap-1.5" data-icod-id={`board_card_bottom_${card.rowId}`}>
        {card.commentCount > 0 && (
          <IconButton
            size="sm"
            tooltip="View comments"
            onClick={(e) => { e.stopPropagation(); onOpen(card.rowId, 'comments'); }}
            className="!h-5 !w-auto gap-0.5 !px-1 text-[10px]"
            data-icod-id={`board_card_comments_${card.rowId}`}>
            <>
              <MessageSquare className="h-3 w-3" data-icod-id="src_features_board_boardcard_tsx_2ebd" />
              <span data-icod-id="src_features_board_boardcard_tsx_6df3">{card.commentCount}</span>
            </>
          </IconButton>
        )}
        {card.attachmentCount > 0 && (
          <IconButton
            size="sm"
            tooltip="View attachments"
            onClick={(e) => { e.stopPropagation(); onOpen(card.rowId, 'attachments'); }}
            className="!h-5 !w-auto gap-0.5 !px-1 text-[10px]"
            data-icod-id={`board_card_attach_${card.rowId}`}>
            <>
              <Paperclip className="h-3 w-3" data-icod-id="src_features_board_boardcard_tsx_ba36" />
              <span data-icod-id="src_features_board_boardcard_tsx_d52f">{card.attachmentCount}</span>
            </>
          </IconButton>
        )}
        {card.subItemCount > 0 && (
          <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground" data-icod-id={`board_card_sub_${card.rowId}`}>
            {card.subItemCount} sub-items
          </span>
        )}
        {card.parentTitle && (
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground" data-icod-id={`board_card_parent_${card.rowId}`}>
            <ChevronRight className="h-3 w-3" data-icod-id="src_features_board_boardcard_tsx_6496" />
            <span
              className="truncate max-w-[80px]"
              data-icod-id="src_features_board_boardcard_tsx_bc93">{card.parentTitle}</span>
          </span>
        )}
        {!isViewer && moveItems.length > 0 && (
          <div className="ml-auto opacity-0 group-hover:opacity-100 group-focus-within:opacity-100" data-icod-id={`board_card_move_${card.rowId}`}>
            <DropdownMenu
              trigger={
                <Button variant="ghost" size="sm" className="!h-6 !w-6 !p-0" data-icod-id={`board_card_movetrigger_${card.rowId}`}>
                  <MoreHorizontal
                    className="h-3.5 w-3.5"
                    data-icod-id="src_features_board_boardcard_tsx_1e35" />
                </Button>
              }
              items={moveItems}
              skipRestoreFocus
              data-icod-id={`board_card_movemenu_${card.rowId}`} />
          </div>
        )}
      </div>
    </div>
  );
}
