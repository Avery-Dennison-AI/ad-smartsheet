import { cn } from '@/utils/cn';

interface ResizeHandleProps {
  direction: 'column' | 'row';
  onDragStart: (e: React.MouseEvent) => void;
  disabled?: boolean;
}

export default function ResizeHandle({ direction, onDragStart, disabled }: ResizeHandleProps) {
  if (disabled) return null;

  const isColumn = direction === 'column';

  return (
    <div
      className={cn(
        'absolute z-30 transition-colors',
        isColumn
          ? 'right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/60'
          : 'bottom-0 left-0 right-0 h-1 cursor-row-resize hover:bg-primary/60',
      )}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDragStart(e);
      }}
      data-icod-id="resize_handle"
    />
  );
}
