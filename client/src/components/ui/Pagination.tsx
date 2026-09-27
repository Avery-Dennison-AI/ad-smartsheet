import { ChevronLeft, ChevronRight } from 'lucide-react';
import IconButton from './IconButton';

export interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

/** Page navigation with "Showing X-Y of Z" text and prev/next buttons. */
export default function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
}: PaginationProps) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  if (totalPages <= 1) return null;

  return (
    <div
      className="flex items-center justify-between"
      data-icod-id="src_components_ui_pagination_tsx_root">
      <span
        className="text-token-sm text-[var(--color-gray-600)]"
        data-icod-id="src_components_ui_pagination_tsx_info">
        Showing {start}&ndash;{end} of {total}
      </span>
      <div
        className="flex items-center gap-1"
        data-icod-id="src_components_ui_pagination_tsx_controls">
        <IconButton
          size="sm"
          tooltip="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          data-icod-id="src_components_ui_pagination_tsx_prev">
          <ChevronLeft
            className="h-4 w-4"
            data-icod-id="src_components_ui_pagination_tsx_prev_icon" />
        </IconButton>
        <IconButton
          size="sm"
          tooltip="Next page"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          data-icod-id="src_components_ui_pagination_tsx_next">
          <ChevronRight
            className="h-4 w-4"
            data-icod-id="src_components_ui_pagination_tsx_next_icon" />
        </IconButton>
      </div>
    </div>
  );
}
