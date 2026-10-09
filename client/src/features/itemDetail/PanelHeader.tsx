import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Link2, X } from 'lucide-react';
import { IconButton, Pill, Input } from '@/components/ui';
import { cn } from '@/utils/cn';
import type { Column, GridRow as GridRowType } from '@/types';

interface PanelHeaderProps {
  row: GridRowType;
  columns: Column[];
  primaryCol?: Column;
  isViewer: boolean;
  onTitleChange: (value: string) => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  onCopyLink: () => void;
  onClose: () => void;
}

export default function PanelHeader({
  row,
  columns,
  primaryCol,
  isViewer,
  onTitleChange,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  onCopyLink,
  onClose,
}: PanelHeaderProps) {
  const [titleValue, setTitleValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Key column for project sheets
  const keyCol = columns.find((c) => c.systemField === 'key');
  const keyValue = keyCol ? row.cells[keyCol.id] : null;

  // Status column for projects
  const statusCol = columns.find((c) => c.systemField === 'status');
  const statusValue = statusCol ? row.cells[statusCol.id] : null;
  const statusOption = statusCol?.options?.find((o) => o.label === String(statusValue));

  // Sync title value when row changes
  useEffect(() => {
    if (primaryCol) {
      setTitleValue(row.cells[primaryCol.id] != null ? String(row.cells[primaryCol.id]) : '');
    }
  }, [row, primaryCol]);

  const handleBlur = () => {
    if (primaryCol && titleValue !== String(row.cells[primaryCol.id] ?? '')) {
      onTitleChange(titleValue || '');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
  };

  return (
    <div
      className="flex items-center gap-2 border-b border-border px-4 py-3"
      data-icod-id="src_features_itemdetail_panelheader_tsx_header">
      {/* Left: key badge + status pill */}
      <div className="flex items-center gap-2 min-w-0 shrink-0" data-icod-id="src_features_itemdetail_panelheader_tsx_left">
        {keyValue && (
          <span
            className="font-mono text-xs text-muted-foreground"
            data-icod-id="src_features_itemdetail_panelheader_tsx_key">{String(keyValue)}</span>
        )}
        {statusOption && (
          <Pill
            label={statusOption.label}
            color={statusOption.color}
            data-icod-id="src_features_itemdetail_panelheader_tsx_status" />
        )}
      </div>
      {/* Center: editable title */}
      <div className="flex-1 min-w-0 mx-2" data-icod-id="src_features_itemdetail_panelheader_tsx_center">
        {isViewer ? (
          <span
            className="block truncate text-sm font-semibold text-foreground"
            data-icod-id="src_features_itemdetail_panelheader_tsx_title_readonly">
            {titleValue || 'Untitled'}
          </span>
        ) : (
          <Input
            ref={inputRef}
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full truncate bg-transparent text-sm font-semibold text-foreground border-transparent focus:border-primary focus:shadow-[var(--focus-ring)]"
            placeholder="Untitled"
            data-icod-id="src_features_itemdetail_panelheader_tsx_title_input" />
        )}
      </div>
      {/* Right: navigation + actions */}
      <div className="flex items-center gap-1 shrink-0" data-icod-id="src_features_itemdetail_panelheader_tsx_right">
        <IconButton
          size="sm"
          tooltip="Previous item"
          onClick={onPrev}
          disabled={!hasPrev}
          data-icod-id="src_features_itemdetail_panelheader_tsx_prev">
          <ChevronLeft
            className="h-4 w-4"
            data-icod-id="src_features_itemdetail_panelheader_tsx_e9df" />
        </IconButton>
        <IconButton
          size="sm"
          tooltip="Next item"
          onClick={onNext}
          disabled={!hasNext}
          data-icod-id="src_features_itemdetail_panelheader_tsx_next">
          <ChevronRight
            className="h-4 w-4"
            data-icod-id="src_features_itemdetail_panelheader_tsx_b1a0" />
        </IconButton>
        <IconButton
          size="sm"
          tooltip="Copy link"
          onClick={onCopyLink}
          data-icod-id="src_features_itemdetail_panelheader_tsx_copy">
          <Link2
            className="h-4 w-4"
            data-icod-id="src_features_itemdetail_panelheader_tsx_7e07" />
        </IconButton>
        <IconButton
          size="sm"
          tooltip="Close"
          onClick={onClose}
          data-icod-id="src_features_itemdetail_panelheader_tsx_close">
          <X
            className="h-4 w-4"
            data-icod-id="src_features_itemdetail_panelheader_tsx_d639" />
        </IconButton>
      </div>
    </div>
  );
}
