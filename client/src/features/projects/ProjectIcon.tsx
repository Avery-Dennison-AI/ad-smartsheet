import { KanbanSquare } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ProjectIconProps {
  size?: number;
  className?: string;
}

const SIZE_CLASSES: Record<number, string> = {
  12: 'h-3 w-3',
  14: 'h-3.5 w-3.5',
  16: 'h-4 w-4',
  20: 'h-5 w-5',
  24: 'h-6 w-6',
};

export default function ProjectIcon({ size = 16, className }: ProjectIconProps) {
  const sizeClass = SIZE_CLASSES[size] ?? 'h-4 w-4';
  return (
    <KanbanSquare
      className={cn(sizeClass, 'text-primary', className)}
      data-icod-id="src_features_projects_projecticon_tsx_icon" />
  );
}
