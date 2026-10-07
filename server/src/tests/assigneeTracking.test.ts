import { describe, it, expect } from 'vitest';
import { computeAssigneeIds } from '../services/rowService';
import type { ColumnDef } from '../models/Sheet';

// ─── Test helpers ────────────────────────────────────────────────────────────────

function makeCol(id: string, type: ColumnDef['type'], name?: string): ColumnDef {
  return { id, name: name ?? `Col ${id}`, type, order: 0, isPrimary: false };
}

const USER_A = '507f1f77bcf86cd799439001';
const USER_B = '507f1f77bcf86cd799439002';
const USER_C = '507f1f77bcf86cd799439003';

function idsToStrings(oids: ReturnType<typeof computeAssigneeIds>): string[] {
  return oids.map((oid) => oid.toString()).sort();
}

// ─── computeAssigneeIds with column removal scenarios ────────────────────────────

describe('assigneeTracking — computeAssigneeIds after column changes', () => {
  describe('contact column deleted → assigneeIds updated', () => {
    it('removes users from deleted contact column while preserving remaining contact column users', () => {
      const col1 = makeCol('col1', 'contact');
      const col2 = makeCol('col2', 'contact');
      const allColumns = [col1, col2];

      // Before deletion: both contact columns have values
      const cells = {
        col1: [USER_A, USER_B],
        col2: [USER_C],
      };

      const beforeIds = idsToStrings(computeAssigneeIds(cells, allColumns));
      expect(beforeIds).toEqual([USER_A, USER_B, USER_C].sort());

      // After deleting col1: only col2 remains as a contact column
      const remainingColumns = [col2];
      const afterIds = idsToStrings(computeAssigneeIds(cells, remainingColumns));
      expect(afterIds).toEqual([USER_C]);
    });

    it('produces empty assigneeIds when the last contact column is deleted', () => {
      const col1 = makeCol('col1', 'contact');
      const cells = { col1: [USER_A] };

      const afterIds = idsToStrings(computeAssigneeIds(cells, []));
      expect(afterIds).toEqual([]);
    });

    it('handles rows where the deleted column was the only one with contact data', () => {
      const col1 = makeCol('col1', 'contact');
      const col2 = makeCol('col2', 'contact');
      const cells = {
        col1: [USER_A],
        col2: null,
      };

      // After deleting col1
      const remainingColumns = [col2];
      const afterIds = idsToStrings(computeAssigneeIds(cells, remainingColumns));
      expect(afterIds).toEqual([]);
    });
  });

  describe('column type changed from contact → assigneeIds recalculated', () => {
    it('removes users from column that lost contact type while preserving other contact columns', () => {
      const col1 = makeCol('col1', 'contact');
      const col2 = makeCol('col2', 'contact');
      const cells = {
        col1: [USER_A],
        col2: [USER_B],
      };

      // Change col1 from contact to text
      const updatedColumns = [makeCol('col1', 'text'), col2];
      const afterIds = idsToStrings(computeAssigneeIds(cells, updatedColumns));
      expect(afterIds).toEqual([USER_B]);
    });

    it('clears all assigneeIds when the only contact column changes type', () => {
      const col1 = makeCol('col1', 'contact');
      const cells = { col1: [USER_A, USER_B] };

      const updatedColumns = [makeCol('col1', 'text')];
      const afterIds = idsToStrings(computeAssigneeIds(cells, updatedColumns));
      expect(afterIds).toEqual([]);
    });
  });

  describe('column type changed to contact → assigneeIds recalculated', () => {
    it('includes valid user IDs from newly-typed contact column', () => {
      const col1 = makeCol('col1', 'text');
      const col2 = makeCol('col2', 'contact');
      const cells = {
        col1: USER_A,  // This was text before, now will be contact
        col2: [USER_B],
      };

      // Change col1 from text to contact
      const updatedColumns = [makeCol('col1', 'contact'), col2];
      const afterIds = idsToStrings(computeAssigneeIds(cells, updatedColumns));
      expect(afterIds).toEqual([USER_A, USER_B].sort());
    });

    it('ignores non-ObjectId values in newly-typed contact column', () => {
      const col1 = makeCol('col1', 'text');
      const cells = {
        col1: 'not-a-valid-objectid',
      };

      const updatedColumns = [makeCol('col1', 'contact')];
      const afterIds = idsToStrings(computeAssigneeIds(cells, updatedColumns));
      expect(afterIds).toEqual([]);
    });

    it('picks up existing cell data when a column becomes contact type', () => {
      const col1 = makeCol('col1', 'dropdown');
      const col2 = makeCol('col2', 'contact');
      const cells = {
        col1: USER_C,  // Was a dropdown value that happens to be a valid ObjectId
        col2: [USER_A],
      };

      // Change col1 to contact
      const updatedColumns = [makeCol('col1', 'contact'), col2];
      const afterIds = idsToStrings(computeAssigneeIds(cells, updatedColumns));
      expect(afterIds).toEqual([USER_A, USER_C].sort());
    });
  });

  describe('computeAssigneeIds ignores non-contact columns', () => {
    it('changing a non-contact column type does not affect assigneeIds', () => {
      const contactCol = makeCol('col1', 'contact');
      const textCol = makeCol('col2', 'text');
      const cells = {
        col1: [USER_A],
        col2: 'some text',
      };

      const beforeIds = idsToStrings(computeAssigneeIds(cells, [contactCol, textCol]));

      // Change text column to number
      const numberCol = makeCol('col2', 'number');
      const afterIds = idsToStrings(computeAssigneeIds(cells, [contactCol, numberCol]));

      expect(beforeIds).toEqual(afterIds);
      expect(afterIds).toEqual([USER_A]);
    });

    it('non-contact column values are never included in assigneeIds', () => {
      const columns = [
        makeCol('col1', 'contact'),
        makeCol('col2', 'text'),
        makeCol('col3', 'number'),
        makeCol('col4', 'dropdown'),
      ];
      const cells = {
        col1: [USER_A],
        col2: USER_B,  // text column with a valid ObjectId string — should be ignored
        col3: USER_C,  // number column — should be ignored
        col4: USER_B,  // dropdown column — should be ignored
      };

      const result = idsToStrings(computeAssigneeIds(cells, columns));
      expect(result).toEqual([USER_A]);
    });
  });
});
