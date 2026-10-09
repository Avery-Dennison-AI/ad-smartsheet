import type { ItemDetailTab } from '@/store/slices/itemDetailSlice';

export interface BoardCardData {
  rowId: string;
  title: string;
  // project fields
  key?: string;
  typeId?: string;
  typeName?: string;
  typeIcon?: string;
  priorityId?: string;
  priorityLabel?: string;
  assigneeId?: string;
  assigneeName?: string;
  assigneeAvatar?: string;
  dueDate?: string; // ISO
  // counts
  commentCount: number;
  attachmentCount: number;
  // hierarchy
  parentTitle?: string;
  subItemCount: number;
  // plain sheet extra fields
  extraFields?: { label: string; value: string; type: string }[];
}

export interface BoardColumnData {
  id: string;
  label: string;
  color?: string;
  category?: string;
  cards: BoardCardData[];
}

export interface BoardFilters {
  assigneeIds: string[];
  typeIds: string[];
  search: string;
}

export type OnOpenCard = (rowId: string, tab?: ItemDetailTab) => void;
