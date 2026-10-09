import { useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Button, Input, Select } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setGroupBy, setSearch, clearFilters, selectBoardGroupBy, selectBoardFilters } from '@/store/slices/boardSlice';
import type { Column } from '@/types';

interface BoardToolbarProps {
  sheetId: string;
  isProject: boolean;
  columns: Column[];
}

export default function BoardToolbar({ sheetId, isProject, columns }: BoardToolbarProps) {
  const dispatch = useAppDispatch();
  const groupByColumnId = useAppSelector((s) => selectBoardGroupBy(s, sheetId));
  const filters = useAppSelector((s) => selectBoardFilters(s, sheetId));

  // Dropdown columns for grouping (plain sheets only)
  const dropdownColumns = columns.filter((c) => c.type === 'dropdown');

  const handleGroupByChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      dispatch(setGroupBy({ sheetId, columnId: e.target.value || null }));
    },
    [dispatch, sheetId],
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      dispatch(setSearch({ sheetId, search: e.target.value }));
    },
    [dispatch, sheetId],
  );

  const handleClearFilters = useCallback(() => {
    dispatch(clearFilters({ sheetId }));
  }, [dispatch, sheetId]);

  const hasActiveFilters = filters.search.length > 0 || filters.assigneeIds.length > 0 || filters.typeIds.length > 0;

  return (
    <div className="flex items-center gap-3 border-b border-border px-3 py-2" data-icod-id="board_toolbar">
      {/* Group by selector (plain sheets only) */}
      {!isProject && dropdownColumns.length > 0 && (
        <div className="flex items-center gap-1.5" data-icod-id="board_toolbar_groupby">
          <span
            className="text-xs text-muted-foreground"
            data-icod-id="src_features_board_boardtoolbar_tsx_a574">Group by</span>
          <Select
            size="sm"
            value={groupByColumnId ?? ''}
            onChange={handleGroupByChange}
            className="w-40"
            data-icod-id="board_toolbar_groupselect">
            <option value="" data-icod-id="src_features_board_boardtoolbar_tsx_2d1b">Select column...</option>
            {dropdownColumns.map((col) => (
              <option
                key={col.id}
                value={col.id}
                data-icod-id={`src_features_board_boardtoolbar_tsx_50ab_${col.id}`}>{col.name}</option>
            ))}
          </Select>
        </div>
      )}
      {/* Search */}
      <div className="relative ml-auto" data-icod-id="board_toolbar_search_wrap">
        <Search
          className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
          data-icod-id="src_features_board_boardtoolbar_tsx_7f20" />
        <Input
          size="sm"
          placeholder="Filter..."
          value={filters.search}
          onChange={handleSearchChange}
          className="w-48 pl-7"
          data-icod-id="board_toolbar_search" />
      </div>
      {/* Clear filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<X
            className="h-3.5 w-3.5"
            data-icod-id="src_features_board_boardtoolbar_tsx_9d44" />}
          onClick={handleClearFilters}
          data-icod-id="board_toolbar_clear">
          Clear
        </Button>
      )}
    </div>
  );
}
