import { Bold, Italic, Underline, Strikethrough } from 'lucide-react';
import { ToggleButton } from '@/components/ui';
import type { CellFormatting } from '@/types';

interface TextStyleGroupProps {
  aggregated: CellFormatting;
  onToggle: (prop: 'bold' | 'italic' | 'underline' | 'strikethrough') => void;
}

export default function TextStyleGroup({ aggregated, onToggle }: TextStyleGroupProps) {
  return (
    <>
      <ToggleButton
        pressed={!!aggregated.bold}
        onToggle={() => onToggle('bold')}
        tooltip="Bold (Ctrl+B)"
        icon={<Bold
          className="h-4 w-4"
          data-icod-id="src_features_sheets_grid_toolbar_textstylegroup_tsx_70ee" />}
        size="sm"
        data-icod-id="src_features_sheets_grid_toolbar_textstylegroup_tsx_cc72" />
      <ToggleButton
        pressed={!!aggregated.italic}
        onToggle={() => onToggle('italic')}
        tooltip="Italic (Ctrl+I)"
        icon={<Italic
          className="h-4 w-4"
          data-icod-id="src_features_sheets_grid_toolbar_textstylegroup_tsx_f8ce" />}
        size="sm"
        data-icod-id="src_features_sheets_grid_toolbar_textstylegroup_tsx_6c61" />
      <ToggleButton
        pressed={!!aggregated.underline}
        onToggle={() => onToggle('underline')}
        tooltip="Underline (Ctrl+U)"
        icon={<Underline
          className="h-4 w-4"
          data-icod-id="src_features_sheets_grid_toolbar_textstylegroup_tsx_dd18" />}
        size="sm"
        data-icod-id="src_features_sheets_grid_toolbar_textstylegroup_tsx_6dd2" />
      <ToggleButton
        pressed={!!aggregated.strikethrough}
        onToggle={() => onToggle('strikethrough')}
        tooltip="Strikethrough"
        icon={<Strikethrough
          className="h-4 w-4"
          data-icod-id="src_features_sheets_grid_toolbar_textstylegroup_tsx_a24f" />}
        size="sm"
        data-icod-id="src_features_sheets_grid_toolbar_textstylegroup_tsx_dd4e" />
    </>
  );
}
