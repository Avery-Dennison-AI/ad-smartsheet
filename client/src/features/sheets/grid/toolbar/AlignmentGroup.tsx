import { AlignLeft, AlignCenter, AlignRight, ChevronDown } from 'lucide-react';
import { ToggleButton, IconButton, DropdownMenu } from '@/components/ui';
import type { DropdownMenuItem } from '@/components/ui/DropdownMenu';
import type { CellFormatting } from '@/types';

interface AggregatedWithAlign extends CellFormatting {
  _mixedTextAlign?: boolean;
  _mixedVerticalAlign?: boolean;
}

interface AlignmentGroupProps {
  aggregated: AggregatedWithAlign;
  onApply: (patch: CellFormatting) => void;
}

// Inline icon components for vertical alignment (not in lucide-react)
function AlignTop({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      data-icod-id="src_features_sheets_grid_toolbar_alignmentgroup_tsx_64a6">
      <rect
        width="16"
        height="12"
        x="4"
        y="6"
        rx="2"
        data-icod-id="src_features_sheets_grid_toolbar_alignmentgroup_tsx_5cbc" />
      <path
        d="M4 2v4"
        data-icod-id="src_features_sheets_grid_toolbar_alignmentgroup_tsx_6955" /><path
        d="M20 2v4"
        data-icod-id="src_features_sheets_grid_toolbar_alignmentgroup_tsx_8d71" />
    </svg>
  );
}

function AlignBottom({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      data-icod-id="src_features_sheets_grid_toolbar_alignmentgroup_tsx_5f2f">
      <rect
        width="16"
        height="12"
        x="4"
        y="6"
        rx="2"
        data-icod-id="src_features_sheets_grid_toolbar_alignmentgroup_tsx_07ce" />
      <path
        d="M4 22v-4"
        data-icod-id="src_features_sheets_grid_toolbar_alignmentgroup_tsx_698f" /><path
        d="M20 22v-4"
        data-icod-id="src_features_sheets_grid_toolbar_alignmentgroup_tsx_0311" />
    </svg>
  );
}

export default function AlignmentGroup({ aggregated, onApply }: AlignmentGroupProps) {
  const handleTextAlign = (align: 'left' | 'center' | 'right') => {
    if (!aggregated._mixedTextAlign && aggregated.textAlign === align) {
      onApply({ textAlign: null });
    } else {
      onApply({ textAlign: align });
    }
  };

  const handleVerticalAlign = (align: 'top' | 'middle' | 'bottom') => {
    if (!aggregated._mixedVerticalAlign && aggregated.verticalAlign === align) {
      onApply({ verticalAlign: null });
    } else {
      onApply({ verticalAlign: align });
    }
  };

  const currentVertAlignIcon = (() => {
    if (aggregated._mixedVerticalAlign) return (
      <AlignCenter
        className="h-3.5 w-3.5"
        data-icod-id="src_features_sheets_grid_toolbar_alignmentgroup_tsx_7409" />
    );
    switch (aggregated.verticalAlign) {
      case 'top': return (
        <AlignTop
          className="h-3.5 w-3.5"
          data-icod-id="src_features_sheets_grid_toolbar_alignmentgroup_tsx_2ed3" />
      );
      case 'bottom': return (
        <AlignBottom
          className="h-3.5 w-3.5"
          data-icod-id="src_features_sheets_grid_toolbar_alignmentgroup_tsx_4aa0" />
      );
      default: return (
        <AlignCenter
          className="h-3.5 w-3.5"
          data-icod-id="src_features_sheets_grid_toolbar_alignmentgroup_tsx_07fa" />
      );
    }
  })();

  return (
    <>
      {/* Horizontal alignment */}
      <ToggleButton
        pressed={!aggregated._mixedTextAlign && aggregated.textAlign === 'left'}
        onToggle={() => handleTextAlign('left')}
        tooltip="Align Left"
        icon={<AlignLeft
          className="h-3.5 w-3.5"
          data-icod-id="src_features_sheets_grid_toolbar_alignmentgroup_tsx_d079" />}
        size="sm"
        data-icod-id="src_features_sheets_grid_toolbar_alignmentgroup_tsx_b17c" />
      <ToggleButton
        pressed={!aggregated._mixedTextAlign && aggregated.textAlign === 'center'}
        onToggle={() => handleTextAlign('center')}
        tooltip="Align Center"
        icon={<AlignCenter
          className="h-3.5 w-3.5"
          data-icod-id="src_features_sheets_grid_toolbar_alignmentgroup_tsx_92f9" />}
        size="sm"
        data-icod-id="src_features_sheets_grid_toolbar_alignmentgroup_tsx_9572" />
      <ToggleButton
        pressed={!aggregated._mixedTextAlign && aggregated.textAlign === 'right'}
        onToggle={() => handleTextAlign('right')}
        tooltip="Align Right"
        icon={<AlignRight
          className="h-3.5 w-3.5"
          data-icod-id="src_features_sheets_grid_toolbar_alignmentgroup_tsx_f986" />}
        size="sm"
        data-icod-id="src_features_sheets_grid_toolbar_alignmentgroup_tsx_a61f" />
      {/* Vertical alignment dropdown */}
      <DropdownMenu
        skipRestoreFocus
        trigger={
          <IconButton
            size="sm"
            tooltip="Vertical alignment"
            onMouseDown={(e) => e.preventDefault()}
            data-icod-id="src_features_sheets_grid_toolbar_alignmentgroup_tsx_0e91">
            <span
              className="inline-flex items-center gap-0.5"
              data-icod-id="src_features_sheets_grid_toolbar_alignmentgroup_tsx_f2d0">
              {currentVertAlignIcon}
              <ChevronDown
                className="h-2.5 w-2.5 text-muted-foreground"
                data-icod-id="src_features_sheets_grid_toolbar_alignmentgroup_tsx_31f7" />
            </span>
          </IconButton>
        }
        items={[
          { label: 'Top', icon: <AlignTop
            className="h-3.5 w-3.5"
            data-icod-id="src_features_sheets_grid_toolbar_alignmentgroup_tsx_11d8" />, onClick: () => handleVerticalAlign('top') },
          { label: 'Middle', icon: <AlignCenter
            className="h-3.5 w-3.5"
            data-icod-id="src_features_sheets_grid_toolbar_alignmentgroup_tsx_2086" />, onClick: () => handleVerticalAlign('middle') },
          { label: 'Bottom', icon: <AlignBottom
            className="h-3.5 w-3.5"
            data-icod-id="src_features_sheets_grid_toolbar_alignmentgroup_tsx_f312" />, onClick: () => handleVerticalAlign('bottom') },
        ] as DropdownMenuItem[]}
        data-icod-id="src_features_sheets_grid_toolbar_alignmentgroup_tsx_9760" />
    </>
  );
}
