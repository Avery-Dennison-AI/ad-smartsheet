import { describe, it, expect } from 'vitest';
import { PROJECT_TEMPLATES, buildTemplateColumns } from '../services/projectTemplates';
import type { TemplateKey } from '../services/projectTemplates';

const TEMPLATE_KEYS: TemplateKey[] = ['waterfall', 'scrum', 'kanban', 'tracker'];

for (const key of TEMPLATE_KEYS) {
  describe(`Project template: ${key}`, () => {
    const tpl = PROJECT_TEMPLATES[key];
    const resolvedColumns = buildTemplateColumns(tpl);

    it('has at least one status in each category: todo, in_progress, done', () => {
      const categories = new Set(tpl.statuses.map((s) => s.category));
      expect(categories.has('todo')).toBe(true);
      expect(categories.has('in_progress')).toBe(true);
      expect(categories.has('done')).toBe(true);
    });

    it('has at least one item type', () => {
      expect(tpl.itemTypes.length).toBeGreaterThan(0);
    });

    it('includes a column with systemField === "key"', () => {
      const keyCol = resolvedColumns.find((c) => c.systemField === 'key');
      expect(keyCol).toBeDefined();
    });

    it('includes a column with systemField === "status"', () => {
      const statusCol = resolvedColumns.find((c) => c.systemField === 'status');
      expect(statusCol).toBeDefined();
    });

    it('status dropdown column has non-empty options with labels', () => {
      const statusCol = resolvedColumns.find((c) => c.systemField === 'status');
      expect(statusCol).toBeDefined();
      expect(statusCol!.options).toBeDefined();
      expect(statusCol!.options!.length).toBeGreaterThan(0);
      for (const opt of statusCol!.options!) {
        expect(opt.label).toBeTruthy();
      }
    });

    it('key column has type "text"', () => {
      const keyCol = resolvedColumns.find((c) => c.systemField === 'key');
      expect(keyCol!.type).toBe('text');
    });

    it('status column has type "dropdown"', () => {
      const statusCol = resolvedColumns.find((c) => c.systemField === 'status');
      expect(statusCol!.type).toBe('dropdown');
    });
  });
}
