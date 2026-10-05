import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { SheetIcon, FavoritesStar, SaveIndicator, IconButton } from '@/components/ui';
import SheetActionsMenu from '../components/SheetActionsMenu';
import ShareSheetModal from '../components/ShareSheetModal';
import type { WorkspaceRole } from '@/types';

interface SheetToolbarProps {
  sheetId: string;
  sheetName: string;
  description?: string;
  userRole: WorkspaceRole;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  saving: boolean;
  saveError: string | null;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
}

export default function SheetToolbar({
  sheetId,
  sheetName,
  description,
  userRole,
  isFavorite,
  onToggleFavorite,
  saving,
  saveError,
  onExpandAll,
  onCollapseAll,
}: SheetToolbarProps) {
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <>
      <div
        className="flex h-10 shrink-0 items-center justify-between border-b border-border px-3"
        data-icod-id="src_features_sheets_grid_sheettoolbar_tsx_root">
        {/* Left: icon + name + description */}
        <div
          className="flex min-w-0 items-center gap-2"
          data-icod-id="src_features_sheets_grid_sheettoolbar_tsx_left">
          <SheetIcon
            className="h-4 w-4 shrink-0"
            data-icod-id="src_features_sheets_grid_sheettoolbar_tsx_icon" />
          <span
            className="truncate text-sm font-medium text-foreground"
            data-icod-id="src_features_sheets_grid_sheettoolbar_tsx_name">{sheetName}</span>
          {description && (
            <span
              className="hidden truncate text-xs text-muted-foreground sm:inline max-w-xs"
              data-icod-id="src_features_sheets_grid_sheettoolbar_tsx_desc">{description}</span>
          )}
        </div>

        {/* Right: save indicator + share + favorite + actions */}
        <div
          className="flex shrink-0 items-center gap-2"
          data-icod-id="src_features_sheets_grid_sheettoolbar_tsx_right">
          <SaveIndicator
            saving={saving}
            error={saveError}
            data-icod-id="src_features_sheets_grid_sheettoolbar_tsx_save" />
          <IconButton
            size="sm"
            tooltip="Share"
            onClick={() => setShareOpen(true)}
            data-icod-id="src_features_sheets_grid_sheettoolbar_tsx_share">
            <Share2
              className="h-4 w-4"
              data-icod-id="src_features_sheets_grid_sheettoolbar_tsx_7a2f" />
          </IconButton>
          <FavoritesStar
            isFavorite={isFavorite}
            onToggle={onToggleFavorite}
            data-icod-id="src_features_sheets_grid_sheettoolbar_tsx_fav" />
          <SheetActionsMenu
            sheetId={sheetId}
            sheetName={sheetName}
            sheetDescription={description}
            userRole={userRole}
            hideOpen
            onExpandAll={onExpandAll}
            onCollapseAll={onCollapseAll}
            data-icod-id="src_features_sheets_grid_sheettoolbar_tsx_actions" />
        </div>
      </div>
      <ShareSheetModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        sheetId={sheetId}
        sheetName={sheetName}
        userRole={userRole}
        data-icod-id="src_features_sheets_grid_sheettoolbar_tsx_cb27" />
    </>
  );
}
