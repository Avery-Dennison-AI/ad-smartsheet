import { ArrowRight, ArrowLeft } from 'lucide-react';
import { IconButton } from '@/components/ui';

interface HierarchyGroupProps {
  canIndent: boolean;
  canOutdent: boolean;
  onIndent: () => void;
  onOutdent: () => void;
  disabled?: boolean;
}

export default function HierarchyGroup({
  canIndent,
  canOutdent,
  onIndent,
  onOutdent,
  disabled,
}: HierarchyGroupProps) {
  return (
    <>
      <IconButton
        size="sm"
        tooltip="Indent rows (Ctrl+])"
        onClick={onIndent}
        disabled={disabled || !canIndent}
        data-icod-id="src_features_sheets_grid_toolbar_hierarchygroup_tsx_indent">
        <ArrowRight
          className="h-4 w-4"
          data-icod-id="src_features_sheets_grid_toolbar_hierarchygroup_tsx_icon_indent" />
      </IconButton>
      <IconButton
        size="sm"
        tooltip="Outdent rows (Ctrl+[)"
        onClick={onOutdent}
        disabled={disabled || !canOutdent}
        data-icod-id="src_features_sheets_grid_toolbar_hierarchygroup_tsx_outdent">
        <ArrowLeft
          className="h-4 w-4"
          data-icod-id="src_features_sheets_grid_toolbar_hierarchygroup_tsx_icon_outdent" />
      </IconButton>
    </>
  );
}
