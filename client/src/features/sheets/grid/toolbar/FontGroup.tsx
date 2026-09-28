import { Select } from '@/components/ui';
import type { CellFormatting } from '@/types';

const FONT_FAMILIES = [
  { label: 'Default', value: 'default' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Courier New', value: 'Courier New' },
];

const FONT_SIZES = [10, 11, 12, 13, 14, 16, 18, 20];

interface FontGroupProps {
  aggregated: CellFormatting & { _mixedFontFamily?: boolean; _mixedFontSize?: boolean };
  onApply: (patch: CellFormatting) => void;
}

export default function FontGroup({ aggregated, onApply }: FontGroupProps) {
  const fontFamilyValue = aggregated._mixedFontFamily ? '' : (aggregated.fontFamily || 'default');
  const fontSizeValue = aggregated._mixedFontSize ? '' : (aggregated.fontSize ?? '');

  return (
    <>
      <Select
        size="sm"
        className="h-7 text-xs py-0"
        style={{ minWidth: '140px', width: '140px' }}
        value={fontFamilyValue}
        onChange={(e) => {
          const val = e.target.value;
          onApply({ fontFamily: val === 'default' ? null : val });
        }}
        onMouseDown={(e) => e.stopPropagation()}
        aria-label="Font family"
        data-icod-id="src_features_sheets_grid_toolbar_fontgroup_tsx_a6f3">
        {FONT_FAMILIES.map((f) => (
          <option
            key={f.value}
            value={f.value}
            data-icod-id={`src_features_sheets_grid_toolbar_fontgroup_tsx_c752_${f.value}`}>{f.label}</option>
        ))}
        {aggregated._mixedFontFamily && (
          <option
            value=""
            disabled
            data-icod-id="src_features_sheets_grid_toolbar_fontgroup_tsx_1f21">Mixed</option>
        )}
      </Select>
      <Select
        size="sm"
        className="h-7 text-xs py-0"
        style={{ minWidth: '72px', width: '72px' }}
        value={fontSizeValue}
        onChange={(e) => {
          const val = Number(e.target.value);
          onApply({ fontSize: isNaN(val) ? null : val });
        }}
        onMouseDown={(e) => e.stopPropagation()}
        aria-label="Font size"
        data-icod-id="src_features_sheets_grid_toolbar_fontgroup_tsx_4041">
        <option
          value=""
          data-icod-id="src_features_sheets_grid_toolbar_fontgroup_tsx_6a0d">{aggregated._mixedFontSize ? 'Mixed' : 'Auto'}</option>
        {FONT_SIZES.map((s) => (
          <option
            key={s}
            value={s}
            data-icod-id={`src_features_sheets_grid_toolbar_fontgroup_tsx_648e_${s}`}>{s}</option>
        ))}
      </Select>
    </>
  );
}
