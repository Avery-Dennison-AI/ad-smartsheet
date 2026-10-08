import { GanttChart, LayoutList, Columns, ClipboardList } from 'lucide-react';

export type TemplateId = 'waterfall' | 'scrum' | 'kanban' | 'tracker';

export interface ProjectTemplate {
  id: TemplateId;
  name: string;
  description: string;
  icon: React.FC<{ className?: string }>;
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  { id: 'waterfall', icon: GanttChart, name: 'Waterfall', description: 'Plan with dates, durations, and milestones' },
  { id: 'scrum', icon: LayoutList, name: 'Scrum', description: 'Backlog, story points, and sprints' },
  { id: 'kanban', icon: Columns, name: 'Kanban', description: 'Simple flow from to do to done' },
  { id: 'tracker', icon: ClipboardList, name: 'Tracker', description: 'Track records and requests' },
];
