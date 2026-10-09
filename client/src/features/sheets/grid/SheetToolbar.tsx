import { useState, useEffect } from 'react';
import { Share2, LayoutGrid, Kanban } from 'lucide-react';
import { SheetIcon, FavoritesStar, SaveIndicator, IconButton, SegmentedControl } from '@/components/ui';
import ProjectIcon from '../../projects/ProjectIcon';
import SheetActionsMenu from '../components/SheetActionsMenu';
import ShareSheetModal from '../components/ShareSheetModal';
import type { WorkspaceRole } from '@/types';

type SheetView = 'grid' | 'board';

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
  sheetKind?: 'sheet' | 'project';
  /** Whether the sheet has dropdown columns (enables board view for plain sheets) */
  hasDropdownColumns?: boolean;
  /** Current view mode */
  view?: SheetView;
  /** Callback when view changes */
  onViewChange?: (view: SheetView) => void;
}

const VIEW_STORAGE_PREFIX = 'view_pref_';

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
  sheetKind,
  hasDropdownColumns = false,
  view = 'grid',
  onViewChange,
}: SheetToolbarProps) {
  const [shareOpen, setShareOpen] = useState(false);

  // Read persisted view preference on mount
  useEffect(() => {
    if (!onViewChange) return;
    const stored = localStorage.getItem(`${VIEW_STORAGE_PREFIX}${sheetId}`);
    if (stored === 'board' || stored === 'grid') {
      onViewChange(stored as SheetView);
    }
  }, [sheetId, onViewChange]);

  const handleViewChange = (newView: SheetView) => {
    localStorage.setItem(`${VIEW_STORAGE_PREFIX}${sheetId}`, newView);
    onViewChange?.(newView);
  };

  const isProject = sheetKind === 'project';
  const boardDisabled = !isProject && !hasDropdownColumns;

  return (
    <>
      <div
        className="flex h-10 shrink-0 items-center justify-between border-b border-border px-3"
        data-icod-id="src_features_sheets_grid_sheettoolbar_tsx_root">
        {/* Left: icon + name + description */}
        <div
          className="flex min-w-0 items-center gap-2"
          data-icod-id="src_features_sheets_grid_sheettoolbar_tsx_left">
          {sheetKind === 'project' ? (
            <ProjectIcon
              className="h-4 w-4 shrink-0"
              data-icod-id="src_features_sheets_grid_sheettoolbar_tsx_5621" />
          ) : (
            <SheetIcon
              className="h-4 w-4 shrink-0"
              data-icod-id="src_features_sheets_grid_sheettoolbar_tsx_icon" />
          )}
          <span
            className="truncate text-sm font-medium text-foreground"
            data-icod-id="src_features_sheets_grid_sheettoolbar_tsx_name">{sheetName}</span>
          {description && (
            <span
              className="hidden truncate text-xs text-muted-foreground sm:inline max-w-xs"
              data-icod-id="src_features_sheets_grid_sheettoolbar_tsx_desc">{description}</span>
          )}
        </div>

        {/* Right: view switcher + save indicator + share + favorite + actions */}
        <div
          className="flex shrink-0 items-center gap-2"
          data-icod-id="src_features_sheets_grid_sheettoolbar_tsx_right">
          <SegmentedControl
            options={[
              { value: 'grid', label: 'Grid', icon: <LayoutGrid
                className="h-3.5 w-3.5"
                data-icod-id="src_features_sheets_grid_sheettoolbar_tsx_7adf" /> },
              {
                value: 'board',
                label: 'Board',
                icon: <Kanban
                  className="h-3.5 w-3.5"
                  data-icod-id="src_features_sheets_grid_sheettoolbar_tsx_7ec7" />,
                disabled: boardDisabled,
                disabledTooltip: 'This sheet has no dropdown columns',
              },
            ]}
            value={view}
            onChange={handleViewChange}
            data-icod-id="src_features_sheets_grid_sheettoolbar_tsx_viewswitcher" />
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
            sheetKind={sheetKind}
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
