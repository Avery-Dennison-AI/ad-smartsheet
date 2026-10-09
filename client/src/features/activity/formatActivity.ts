import type { ActivityEntry } from '@/types';
import {
  Pencil,
  ArrowRightLeft,
  Plus,
  Trash2,
  MessageSquare,
  Paperclip,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

export type ActivityIcon = LucideIcon;

export interface ActivityPart {
  type: 'text' | 'bold' | 'pill' | 'muted';
  content: string;
  color?: string; // for pills
}

export interface FormattedActivity {
  sentence: string;
  richParts: ActivityPart[];
  icon: ActivityIcon;
  isComment: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Format a date string to readable format: "Oct 9, 2026" */
function formatDate(value: unknown): string {
  if (!value) return '';
  const str = String(value);
  // Handle YYYY-MM-DD format
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    const date = new Date(Date.UTC(year, month, day));
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  // Try parsing as ISO or other format
  const date = new Date(str);
  if (!isNaN(date.getTime())) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  return str;
}

/** Truncate long text to 40 chars with ellipsis */
function truncateText(text: string, maxLen = 40): string {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '\u2026';
}

/** Get display value for a cell value */
function getDisplayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  return String(value);
}

// ─── Main Formatter ─────────────────────────────────────────────────────────

export function formatActivity(entry: ActivityEntry): FormattedActivity {
  const { action, details } = entry;
  const d = details ?? {};

  switch (action) {
    case 'row.created':
      return {
        sentence: 'created this item',
        richParts: [{ type: 'text', content: 'created this item' }],
        icon: Plus,
        isComment: false,
      };

    case 'row.deleted':
      return {
        sentence: 'deleted this item',
        richParts: [{ type: 'text', content: 'deleted this item' }],
        icon: Trash2,
        isComment: false,
      };

    case 'row.moved': {
      const newParentName = d.newParentName as string | undefined;
      if (newParentName) {
        return {
          sentence: `made this a sub-item of ${newParentName}`,
          richParts: [
            { type: 'text', content: 'made this a sub-item of ' },
            { type: 'bold', content: newParentName },
          ],
          icon: ArrowRightLeft,
          isComment: false,
        };
      }
      // Check if explicitly moved to top level (oldParentId was set, newParentId is null)
      if (d.oldParentId && !d.newParentId) {
        return {
          sentence: 'moved this item to the top level',
          richParts: [{ type: 'text', content: 'moved this item to the top level' }],
          icon: ArrowRightLeft,
          isComment: false,
        };
      }
      return {
        sentence: 'moved this item',
        richParts: [{ type: 'text', content: 'moved this item' }],
        icon: ArrowRightLeft,
        isComment: false,
      };
    }

    case 'row.indented': {
      const parentName = (d.newParentName || d.parentName) as string | undefined;
      if (parentName) {
        return {
          sentence: `made this a sub-item of ${parentName}`,
          richParts: [
            { type: 'text', content: 'made this a sub-item of ' },
            { type: 'bold', content: parentName },
          ],
          icon: ArrowRightLeft,
          isComment: false,
        };
      }
      return {
        sentence: 'made this a sub-item',
        richParts: [{ type: 'text', content: 'made this a sub-item' }],
        icon: ArrowRightLeft,
        isComment: false,
      };
    }

    case 'row.outdented':
      return {
        sentence: 'moved this item to the top level',
        richParts: [{ type: 'text', content: 'moved this item to the top level' }],
        icon: ArrowRightLeft,
        isComment: false,
      };

    case 'cell.updated': {
      const columnName = (d.columnName as string) || 'field';
      const columnType = d.columnType as string | undefined;
      const oldValue = d.oldValue;
      const newValue = d.newValue;
      const isPrimary = d.isPrimary as boolean | undefined;
      const oldStr = getDisplayValue(oldValue);
      const newStr = getDisplayValue(newValue);

      // Primary text column — treat as rename
      if (isPrimary && (columnType === 'text' || !columnType)) {
        return {
          sentence: `renamed the item to ${newStr}`,
          richParts: [
            { type: 'text', content: 'renamed the item to ' },
            { type: 'bold', content: truncateText(newStr) },
          ],
          icon: Pencil,
          isComment: false,
        };
      }

      // Checkbox
      if (columnType === 'checkbox') {
        const checked = newValue === true || newValue === 'true';
        const verb = checked ? 'checked' : 'unchecked';
        return {
          sentence: `${verb} ${columnName}`,
          richParts: [
            { type: 'text', content: `${verb} ` },
            { type: 'bold', content: columnName },
          ],
          icon: Pencil,
          isComment: false,
        };
      }

      // Contact
      if (columnType === 'contact') {
        const newPersonName = (d.newPersonName as string) || newStr;
        if (!newStr && !newValue) {
          return {
            sentence: `cleared ${columnName}`,
            richParts: [
              { type: 'text', content: 'cleared ' },
              { type: 'bold', content: columnName },
            ],
            icon: Pencil,
            isComment: false,
          };
        }
        return {
          sentence: `assigned ${newPersonName}`,
          richParts: [
            { type: 'text', content: 'assigned ' },
            { type: 'bold', content: newPersonName },
          ],
          icon: Pencil,
          isComment: false,
        };
      }

      // Date
      if (columnType === 'date') {
        const oldDate = formatDate(oldValue);
        const newDate = formatDate(newValue);
        if (!oldStr && newStr) {
          return {
            sentence: `set ${columnName} to ${newDate}`,
            richParts: [
              { type: 'text', content: 'set ' },
              { type: 'bold', content: columnName },
              { type: 'text', content: ` to ${newDate}` },
            ],
            icon: Pencil,
            isComment: false,
          };
        }
        if (oldStr && !newStr) {
          return {
            sentence: `cleared ${columnName}`,
            richParts: [
              { type: 'text', content: 'cleared ' },
              { type: 'bold', content: columnName },
            ],
            icon: Pencil,
            isComment: false,
          };
        }
        return {
          sentence: `changed ${columnName} from ${oldDate} to ${newDate}`,
          richParts: [
            { type: 'text', content: 'changed ' },
            { type: 'bold', content: columnName },
            { type: 'text', content: ` from ${oldDate} to ${newDate}` },
          ],
          icon: Pencil,
          isComment: false,
        };
      }

      // Dropdown
      if (columnType === 'dropdown') {
        const oldColor = (d.oldColor as string) || 'gray';
        const newColor = (d.newColor as string) || 'gray';
        if (!oldStr && newStr) {
          return {
            sentence: `set ${columnName} to ${newStr}`,
            richParts: [
              { type: 'text', content: 'set ' },
              { type: 'bold', content: columnName },
              { type: 'text', content: ' to ' },
              { type: 'pill', content: newStr, color: newColor },
            ],
            icon: Pencil,
            isComment: false,
          };
        }
        if (oldStr && !newStr) {
          return {
            sentence: `cleared ${columnName}`,
            richParts: [
              { type: 'text', content: 'cleared ' },
              { type: 'bold', content: columnName },
            ],
            icon: Pencil,
            isComment: false,
          };
        }
        return {
          sentence: `changed ${columnName} from ${oldStr} to ${newStr}`,
          richParts: [
            { type: 'text', content: 'changed ' },
            { type: 'bold', content: columnName },
            { type: 'text', content: ' from ' },
            { type: 'pill', content: oldStr, color: oldColor },
            { type: 'text', content: ' to ' },
            { type: 'pill', content: newStr, color: newColor },
          ],
          icon: Pencil,
          isComment: false,
        };
      }

      // Other column types (text, number, etc.)
      if (!oldStr && newStr) {
        return {
          sentence: `set ${columnName} to ${truncateText(newStr)}`,
          richParts: [
            { type: 'text', content: 'set ' },
            { type: 'bold', content: columnName },
            { type: 'text', content: ' to ' },
            { type: 'text', content: truncateText(newStr) },
          ],
          icon: Pencil,
          isComment: false,
        };
      }
      if (oldStr && !newStr) {
        return {
          sentence: `cleared ${columnName}`,
          richParts: [
            { type: 'text', content: 'cleared ' },
            { type: 'bold', content: columnName },
          ],
          icon: Pencil,
          isComment: false,
        };
      }
      return {
        sentence: `changed ${columnName} from ${truncateText(oldStr)} to ${truncateText(newStr)}`,
        richParts: [
          { type: 'text', content: 'changed ' },
          { type: 'bold', content: columnName },
          { type: 'text', content: ' from ' },
          { type: 'text', content: truncateText(oldStr) },
          { type: 'text', content: ' to ' },
          { type: 'text', content: truncateText(newStr) },
        ],
        icon: Pencil,
        isComment: false,
      };
    }

    case 'column.added': {
      const columnName = (d.columnName as string) || 'column';
      return {
        sentence: `added column ${columnName}`,
        richParts: [
          { type: 'text', content: 'added column ' },
          { type: 'bold', content: columnName },
        ],
        icon: Pencil,
        isComment: false,
      };
    }

    case 'column.renamed': {
      const oldName = (d.oldName as string) || 'column';
      const newName = (d.newName as string) || 'column';
      return {
        sentence: `renamed column ${oldName} to ${newName}`,
        richParts: [
          { type: 'text', content: 'renamed column ' },
          { type: 'bold', content: oldName },
          { type: 'text', content: ' to ' },
          { type: 'bold', content: newName },
        ],
        icon: Pencil,
        isComment: false,
      };
    }

    case 'column.deleted': {
      const columnName = (d.columnName as string) || 'column';
      return {
        sentence: `removed column ${columnName}`,
        richParts: [
          { type: 'text', content: 'removed column ' },
          { type: 'bold', content: columnName },
        ],
        icon: Pencil,
        isComment: false,
      };
    }

    case 'sheet.created':
      return {
        sentence: 'created this sheet',
        richParts: [{ type: 'text', content: 'created this sheet' }],
        icon: Plus,
        isComment: false,
      };

    case 'sheet.renamed': {
      const newName = (d.newName as string) || 'sheet';
      return {
        sentence: `renamed this sheet to ${newName}`,
        richParts: [
          { type: 'text', content: 'renamed this sheet to ' },
          { type: 'bold', content: newName },
        ],
        icon: Pencil,
        isComment: false,
      };
    }

    case 'comment.added':
      return {
        sentence: 'commented',
        richParts: [{ type: 'text', content: 'commented' }],
        icon: MessageSquare,
        isComment: true,
      };

    case 'comment.edited':
      return {
        sentence: 'edited a comment',
        richParts: [{ type: 'text', content: 'edited a comment' }],
        icon: MessageSquare,
        isComment: true,
      };

    case 'comment.deleted':
      return {
        sentence: 'deleted a comment',
        richParts: [{ type: 'text', content: 'deleted a comment' }],
        icon: MessageSquare,
        isComment: true,
      };

    case 'attachment.added': {
      const fileName = (d.fileName as string) || 'a file';
      return {
        sentence: `attached ${fileName}`,
        richParts: [
          { type: 'text', content: 'attached ' },
          { type: 'bold', content: truncateText(fileName) },
        ],
        icon: Paperclip,
        isComment: false,
      };
    }

    case 'attachment.deleted': {
      const fileName = (d.fileName as string) || 'a file';
      return {
        sentence: `removed ${fileName}`,
        richParts: [
          { type: 'text', content: 'removed ' },
          { type: 'bold', content: truncateText(fileName) },
        ],
        icon: Paperclip,
        isComment: false,
      };
    }

    default:
      return {
        sentence: 'made a change',
        richParts: [{ type: 'text', content: 'made a change' }],
        icon: Pencil,
        isComment: false,
      };
  }
}
