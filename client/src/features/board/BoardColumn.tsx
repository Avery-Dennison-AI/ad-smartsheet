import { useRef } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/utils/cn';
import type { WorkspaceRole } from '@/types';
import type { BoardCardData, OnOpenCard } from './boardTypes';
import BoardCard from './BoardCard';

interface BoardColumnProps {
  columnId: string;
  label: string;
  color?: string;
  count: number;
  cards: BoardCardData[];
  isProject: boolean;
  userRole: WorkspaceRole;
  sheetId: string;
  onAddItem: () => void;
  groupByColumnId?: string;
  /** Column options for "Move to" menu in cards */
  columnOptions?: { id: string; label: string }[];
  /** Called when a card is moved to this column */
  onMoveCard?: (rowId: string, targetColumnId: string) => void;
  /** Drag handlers */
  onDragOver?: (e: React.DragEvent, columnId: string) => void;
  onDrop?: (e: React.DragEvent, columnId: string) => void;
  isDragOver?: boolean;
}

export default function BoardColumn({
  columnId,
  label,
  color,
  count,
  cards,
  isProject,
  userRole,
  sheetId,
  onAddItem,
  columnOptions,
  onMoveCard,
  onDragOver,
  onDrop,
  isDragOver,
}: BoardColumnProps) {
  const isViewer = userRole === 'viewer';
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={cn(
        'flex w-[280px] shrink-0 flex-col rounded-lg border border-border bg-muted/20',
        isDragOver && 'ring-2 ring-primary/40',
      )}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver?.(e, columnId);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop?.(e, columnId);
      }}
      data-icod-id={`board_col_${columnId}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2" data-icod-id={`board_col_header_${columnId}`}>
        {color && (
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
            data-icod-id={`board_col_dot_${columnId}`} />
        )}
        <span className="truncate text-sm font-medium text-foreground" data-icod-id={`board_col_label_${columnId}`}>
          {label}
        </span>
        <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground" data-icod-id={`board_col_count_${columnId}`}>
          {count}
        </span>
      </div>
      {/* Card list */}
      <div
        ref={scrollRef}
        className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 py-1"
        style={{ maxHeight: 'calc(100vh - 200px)' }}
        data-icod-id={`board_col_cards_${columnId}`}>
        {cards.map((card) => (
          <BoardCard
            key={card.rowId}
            card={card}
            isProject={isProject}
            userRole={userRole}
            onOpen={(rowId, tab) => {
              // Delegate to parent via custom event or direct callback
              const event = new CustomEvent('board:open-card', { detail: { rowId, tab } });
              window.dispatchEvent(event);
            }}
            columnOptions={columnOptions}
            onMoveTo={onMoveCard}
            data-icod-id={`src_features_board_boardcolumn_tsx_7cdb_${card.rowId}`} />
        ))}
        {cards.length === 0 && !isDragOver && (
          <div className="py-8 text-center text-xs text-muted-foreground" data-icod-id={`board_col_empty_${columnId}`}>
            No items
          </div>
        )}
        {isDragOver && (
          <div className="rounded-lg border-2 border-dashed border-primary/40 p-4" data-icod-id={`board_col_placeholder_${columnId}`} />
        )}
      </div>
      {/* Add item button */}
      {!isViewer && (
        <div className="px-2 pb-2" data-icod-id={`board_col_addwrap_${columnId}`}>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Plus
              className="h-3.5 w-3.5"
              data-icod-id="src_features_board_boardcolumn_tsx_71af" />}
            onClick={onAddItem}
            className="w-full justify-start"
            data-icod-id={`board_col_add_${columnId}`}>
            Add item
          </Button>
        </div>
      )}
    </div>
  );
}
