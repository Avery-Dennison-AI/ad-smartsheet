import { KanbanSquare } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ProjectIconProps {
  size?: number;
  className?: string;
}

export default function ProjectIcon({ size = 16, className }: ProjectIconProps) {
  return (
    <KanbanSquare
      className={cn('text-foreground', className)}
      style={{ width: size, height: size }}
      data-icod-id="src_features_projects_projecticon_tsx_icon" />
  );
}
