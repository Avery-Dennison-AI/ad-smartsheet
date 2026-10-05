import { useRef, useState } from 'react';
import { Type, PaintBucket } from 'lucide-react';
import { IconButton, ColorSwatchPicker } from '@/components/ui';
import { cn } from '@/utils/cn';
import type { CellFormatting } from '@/types';

interface ColorGroupProps {
  aggregated: CellFormatting & { _mixedTextColor?: boolean; _mixedFillColor?: boolean };
  onApply: (patch: CellFormatting) => void;
}

export default function ColorGroup({ aggregated, onApply }: ColorGroupProps) {
  const textColorBtnRef = useRef<HTMLButtonElement>(null);
  const fillColorBtnRef = useRef<HTMLButtonElement>(null);
  const [textColorOpen, setTextColorOpen] = useState(false);
  const [fillColorOpen, setFillColorOpen] = useState(false);

  return (
    <>
      {/* Text Color button */}
      <div
        className="relative"
        data-icod-id="src_features_sheets_grid_toolbar_colorgroup_tsx_aeb7">
        <IconButton
          ref={textColorBtnRef}
          size="sm"
          tooltip="Text color"
          onClick={() => setTextColorOpen(!textColorOpen)}
          onMouseDown={(e) => e.preventDefault()}
          data-icod-id="src_features_sheets_grid_toolbar_colorgroup_tsx_b495">
          <span
            className="relative"
            data-icod-id="src_features_sheets_grid_toolbar_colorgroup_tsx_f4ac">
            <Type
              className="h-3.5 w-3.5"
              data-icod-id="src_features_sheets_grid_toolbar_colorgroup_tsx_e6d6" />
            <span
              className={cn(
                'absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full',
                !aggregated._mixedTextColor && aggregated.textColor ? '' : 'bg-border',
              )}
              style={!aggregated._mixedTextColor && aggregated.textColor ? { backgroundColor: aggregated.textColor } : undefined}
              data-icod-id="src_features_sheets_grid_toolbar_colorgroup_tsx_4dd8" />
          </span>
        </IconButton>
        {textColorOpen && (
          <ColorSwatchPicker
            anchorRef={textColorBtnRef}
            value={aggregated._mixedTextColor ? null : (aggregated.textColor ?? null)}
            onChange={(hex) => onApply({ textColor: hex })}
            onClose={() => setTextColorOpen(false)}
            data-icod-id="src_features_sheets_grid_toolbar_colorgroup_tsx_36c3" />
        )}
      </div>
      {/* Fill Color button */}
      <div
        className="relative"
        data-icod-id="src_features_sheets_grid_toolbar_colorgroup_tsx_def4">
        <IconButton
          ref={fillColorBtnRef}
          size="sm"
          tooltip="Fill color"
          onClick={() => setFillColorOpen(!fillColorOpen)}
          onMouseDown={(e) => e.preventDefault()}
          data-icod-id="src_features_sheets_grid_toolbar_colorgroup_tsx_0645">
          <span
            className="relative"
            data-icod-id="src_features_sheets_grid_toolbar_colorgroup_tsx_adca">
            <PaintBucket
              className="h-3.5 w-3.5"
              data-icod-id="src_features_sheets_grid_toolbar_colorgroup_tsx_aae9" />
            <span
              className={cn(
                'absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full',
                !aggregated._mixedFillColor && aggregated.fillColor ? '' : 'bg-border',
              )}
              style={!aggregated._mixedFillColor && aggregated.fillColor ? { backgroundColor: aggregated.fillColor } : undefined}
              data-icod-id="src_features_sheets_grid_toolbar_colorgroup_tsx_530c" />
          </span>
        </IconButton>
        {fillColorOpen && (
          <ColorSwatchPicker
            anchorRef={fillColorBtnRef}
            value={aggregated._mixedFillColor ? null : (aggregated.fillColor ?? null)}
            onChange={(hex) => onApply({ fillColor: hex })}
            onClose={() => setFillColorOpen(false)}
            data-icod-id="src_features_sheets_grid_toolbar_colorgroup_tsx_3b04" />
        )}
      </div>
    </>
  );
}
