import { useState, useRef, useCallback } from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface DragHandleProps {
  draggable: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  className?: string;
  style?: React.CSSProperties;
}

export interface SortableListProps<T> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number, dragHandleProps: DragHandleProps) => React.ReactNode;
  keyExtractor: (item: T) => string;
  className?: string;
}

/**
 * A reusable, accessible drag-and-drop ordered list component.
 * Uses HTML5 drag events for reordering.
 */
export default function SortableList<T>({
  items,
  onReorder,
  renderItem,
  keyExtractor,
  className,
}: SortableListProps<T>) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  const handleDragStart = useCallback(
    (index: number) => (e: React.DragEvent) => {
      setDragIndex(index);
      dragNodeRef.current = e.currentTarget as HTMLDivElement;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
      // Make the drag image semi-transparent
      requestAnimationFrame(() => {
        if (dragNodeRef.current) {
          dragNodeRef.current.style.opacity = '0.4';
        }
      });
    },
    [],
  );

  const handleDragEnd = useCallback(
    () => (e: React.DragEvent) => {
      e.preventDefault();
      if (dragNodeRef.current) {
        dragNodeRef.current.style.opacity = '1';
      }
      dragNodeRef.current = null;
      setDragIndex(null);
      setOverIndex(null);
    },
    [],
  );

  const handleDragOver = useCallback(
    (index: number) => (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (dragIndex !== null && dragIndex !== index) {
        setOverIndex(index);
      }
    },
    [dragIndex],
  );

  const handleDrop = useCallback(
    (dropIndex: number) => (e: React.DragEvent) => {
      e.preventDefault();
      if (dragIndex === null || dragIndex === dropIndex) {
        setDragIndex(null);
        setOverIndex(null);
        return;
      }

      const newItems = [...items];
      const [movedItem] = newItems.splice(dragIndex, 1);
      newItems.splice(dropIndex, 0, movedItem);
      onReorder(newItems);
      setDragIndex(null);
      setOverIndex(null);
    },
    [dragIndex, items, onReorder],
  );

  return (
    <div
      className={cn('flex flex-col', className)}
      data-icod-id="src_components_ui_sortablelist_tsx_9bc4">
      {items.map((item, index) => {
        const key = keyExtractor(item);
        const isDragging = dragIndex === index;
        const isOver = overIndex === index;

        const dragHandleProps: DragHandleProps = {
          draggable: true,
          onDragStart: handleDragStart(index),
          onDragEnd: handleDragEnd(),
          className: 'cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing',
        };

        return (
          <div
            key={key}
            onDragOver={handleDragOver(index)}
            onDrop={handleDrop(index)}
            className={cn(
              'relative transition-all duration-150',
              isDragging && 'opacity-40',
              isOver && 'ring-2 ring-primary/40 rounded-[var(--radius-sm)]',
            )}
            data-icod-id={`src_components_ui_sortablelist_tsx_1130_${key}`}>
            {renderItem(item, index, dragHandleProps)}
          </div>
        );
      })}
    </div>
  );
}
