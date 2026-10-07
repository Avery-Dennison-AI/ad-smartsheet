import type { SystemField } from '../models/Sheet';

export type TemplateKey = 'waterfall' | 'scrum' | 'kanban' | 'tracker';

export interface TemplateStatus {
  name: string;
  color: string;
  category: 'todo' | 'in_progress' | 'done';
}

export interface TemplateColumnDef {
  name: string;
  type: 'text' | 'number' | 'dropdown' | 'contact' | 'date';
  systemField: SystemField;
  options?: Array<{ label: string; color?: string }>;
}

export interface ProjectTemplate {
  statuses: TemplateStatus[];
  itemTypes: string[];
  columns: TemplateColumnDef[];
}

const PRIORITY_OPTIONS: Array<{ label: string; color?: string }> = [
  { label: 'Highest' },
  { label: 'High' },
  { label: 'Medium' },
  { label: 'Low' },
  { label: 'Lowest' },
];

// ─── Waterfall ──────────────────────────────────────────────────────────────────

const waterfallStatuses: TemplateStatus[] = [
  { name: 'Not started', color: 'gray', category: 'todo' },
  { name: 'In progress', color: 'blue', category: 'in_progress' },
  { name: 'Blocked', color: 'red', category: 'in_progress' },
  { name: 'Complete', color: 'green', category: 'done' },
];

const waterfallItemTypes = ['Task', 'Milestone'];

const waterfallColumns: TemplateColumnDef[] = [
  { name: 'Key', type: 'text', systemField: 'key' },
  { name: 'Type', type: 'dropdown', systemField: 'type', options: [] },
  { name: 'Status', type: 'dropdown', systemField: 'status', options: [] },
  { name: 'Assignee', type: 'contact', systemField: 'assignee' },
  { name: 'Start', type: 'date', systemField: 'start' },
  { name: 'Due', type: 'date', systemField: 'due' },
  { name: 'Duration', type: 'number', systemField: 'duration' },
  { name: '% Complete', type: 'number', systemField: 'percentComplete' },
];

// ─── Scrum ──────────────────────────────────────────────────────────────────────

const scrumStatuses: TemplateStatus[] = [
  { name: 'Backlog', color: 'gray', category: 'todo' },
  { name: 'To do', color: 'gray', category: 'todo' },
  { name: 'In progress', color: 'blue', category: 'in_progress' },
  { name: 'In review', color: 'purple', category: 'in_progress' },
  { name: 'Done', color: 'green', category: 'done' },
];

const scrumItemTypes = ['Epic', 'Story', 'Task', 'Bug'];

const scrumColumns: TemplateColumnDef[] = [
  { name: 'Key', type: 'text', systemField: 'key' },
  { name: 'Type', type: 'dropdown', systemField: 'type', options: [] },
  { name: 'Status', type: 'dropdown', systemField: 'status', options: [] },
  { name: 'Assignee', type: 'contact', systemField: 'assignee' },
  { name: 'Story points', type: 'number', systemField: 'storyPoints' },
  { name: 'Priority', type: 'dropdown', systemField: 'priority', options: PRIORITY_OPTIONS },
  { name: 'Due', type: 'date', systemField: 'due' },
];

// ─── Kanban ─────────────────────────────────────────────────────────────────────

const kanbanStatuses: TemplateStatus[] = [
  { name: 'To do', color: 'gray', category: 'todo' },
  { name: 'In progress', color: 'blue', category: 'in_progress' },
  { name: 'Done', color: 'green', category: 'done' },
];

const kanbanItemTypes = ['Task', 'Bug'];

const kanbanColumns: TemplateColumnDef[] = [
  { name: 'Key', type: 'text', systemField: 'key' },
  { name: 'Type', type: 'dropdown', systemField: 'type', options: [] },
  { name: 'Status', type: 'dropdown', systemField: 'status', options: [] },
  { name: 'Assignee', type: 'contact', systemField: 'assignee' },
  { name: 'Priority', type: 'dropdown', systemField: 'priority', options: PRIORITY_OPTIONS },
  { name: 'Due', type: 'date', systemField: 'due' },
];

// ─── Tracker ────────────────────────────────────────────────────────────────────

const trackerStatuses: TemplateStatus[] = [
  { name: 'Open', color: 'gray', category: 'todo' },
  { name: 'In progress', color: 'blue', category: 'in_progress' },
  { name: 'Closed', color: 'green', category: 'done' },
];

const trackerItemTypes = ['Item'];

const trackerColumns: TemplateColumnDef[] = [
  { name: 'Key', type: 'text', systemField: 'key' },
  { name: 'Status', type: 'dropdown', systemField: 'status', options: [] },
  { name: 'Assignee', type: 'contact', systemField: 'assignee' },
  { name: 'Due', type: 'date', systemField: 'due' },
];

// ─── Template registry ──────────────────────────────────────────────────────────

export const PROJECT_TEMPLATES: Record<TemplateKey, ProjectTemplate> = {
  waterfall: { statuses: waterfallStatuses, itemTypes: waterfallItemTypes, columns: waterfallColumns },
  scrum:     { statuses: scrumStatuses,     itemTypes: scrumItemTypes,     columns: scrumColumns },
  kanban:    { statuses: kanbanStatuses,    itemTypes: kanbanItemTypes,    columns: kanbanColumns },
  tracker:   { statuses: trackerStatuses,   itemTypes: trackerItemTypes,   columns: trackerColumns },
};

/**
 * Resolve dynamic dropdown options for Status and Type columns from the
 * template's own statuses and itemTypes so they stay in sync.
 */
export function buildTemplateColumns(tpl: ProjectTemplate): TemplateColumnDef[] {
  return tpl.columns.map((col) => {
    if (col.systemField === 'status') {
      return {
        ...col,
        options: tpl.statuses.map((s) => ({ label: s.name, color: s.color })),
      };
    }
    if (col.systemField === 'type') {
      return {
        ...col,
        options: tpl.itemTypes.map((t) => ({ label: t })),
      };
    }
    return col;
  });
}

/**
 * Look up a template by key. Throws if the key is not valid.
 */
export function getTemplate(key: TemplateKey): ProjectTemplate {
  const tpl = PROJECT_TEMPLATES[key];
  if (!tpl) {
    throw new Error(`Unknown project template: ${key}`);
  }
  return tpl;
}
