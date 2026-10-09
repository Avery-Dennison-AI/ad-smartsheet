import { useEffect, useCallback, useRef } from 'react';
import { Tabs } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectOpenRowId, selectActiveTab, closeItem, setTab, openItem } from '@/store/slices/itemDetailSlice';
import type { ItemDetailTab } from '@/store/slices/itemDetailSlice';
import { selectGridColumns, selectGridRows, selectGridMembers, updateCell } from '@/store/slices/gridSlice';
import { selectCommentsForRow } from '@/store/slices/commentsSlice';
import { selectAttachmentCount } from '@/store/slices/attachmentsSlice';
import { cn } from '@/utils/cn';
import type { WorkspaceRole } from '@/types';
import PanelHeader from './PanelHeader';
import PanelFields from './PanelFields';
import PanelSubItems from './PanelSubItems';
import CommentsTab from './CommentsTab';
import ActivityTab from './ActivityTab';
import AttachmentsTab from './AttachmentsTab';

interface ItemDetailPanelProps {
  sheetId: string;
  userRole: WorkspaceRole;
}

export default function ItemDetailPanel({ sheetId, userRole }: ItemDetailPanelProps) {
  const dispatch = useAppDispatch();
  const openRowId = useAppSelector(selectOpenRowId);
  const activeTab = useAppSelector(selectActiveTab);
  const columns = useAppSelector(selectGridColumns);
  const rows = useAppSelector(selectGridRows);
  const workspaceMembers = useAppSelector(selectGridMembers);
  const panelRef = useRef<HTMLDivElement>(null);

  // Badge counts — hooks must be called unconditionally (before any early return)
  const commentState = useAppSelector((state) =>
    openRowId ? selectCommentsForRow(state, openRowId) : { comments: [] },
  );
  const commentCount = commentState.comments?.length ?? 0;
  const attachmentCount = useAppSelector((state) =>
    openRowId ? selectAttachmentCount(state, openRowId) : 0,
  );

  // Find current row and compute prev/next
  const rowIndex = openRowId ? rows.findIndex((r) => r.id === openRowId) : -1;
  const currentRow = rowIndex >= 0 ? rows[rowIndex] : null;
  const hasPrev = rowIndex > 0;
  const hasNext = rowIndex >= 0 && rowIndex < rows.length - 1;

  const handleClose = useCallback(() => {
    dispatch(closeItem());
  }, [dispatch]);

  const handlePrev = useCallback(() => {
    if (hasPrev && rowIndex > 0) {
      dispatch(openItem({ rowId: rows[rowIndex - 1].id }));
    }
  }, [dispatch, hasPrev, rowIndex, rows]);

  const handleNext = useCallback(() => {
    if (hasNext && rowIndex < rows.length - 1) {
      dispatch(openItem({ rowId: rows[rowIndex + 1].id }));
    }
  }, [dispatch, hasNext, rowIndex, rows]);

  const handleCopyLink = useCallback(() => {
    if (!openRowId) return;
    const url = new URL(window.location.href);
    url.searchParams.set('item', openRowId);
    navigator.clipboard.writeText(url.toString());
  }, [openRowId]);

  // Escape key closes panel
  useEffect(() => {
    if (!openRowId) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [openRowId, handleClose]);

  const handleCellChange = useCallback(
    (columnId: string, value: unknown) => {
      if (!openRowId) return;
      dispatch(updateCell({ sheetId, rowId: openRowId, columnId, value }));
    },
    [dispatch, sheetId, openRowId],
  );

  if (!openRowId || !currentRow) return null;

  const primaryCol = columns.find((c) => c.isPrimary);
  const isViewer = userRole === 'viewer';

  const tabs = [
    { id: 'comments', label: 'Comments', badge: commentCount > 0 ? commentCount : undefined },
    { id: 'activity', label: 'Activity' },
    { id: 'attachments', label: 'Attachments', badge: attachmentCount > 0 ? attachmentCount : undefined },
  ];

  return (
    <div
      ref={panelRef}
      className={cn(
        'fixed right-0 top-0 bottom-0 z-30 flex flex-col bg-card shadow-xl border-l border-border',
        'w-full md:w-[560px]',
      )}
      data-icod-id="src_features_itemdetail_itemdetailpanel_tsx_panel">
      {/* Header */}
      <PanelHeader
        row={currentRow}
        columns={columns}
        primaryCol={primaryCol}
        isViewer={isViewer}
        onTitleChange={(val) => primaryCol && handleCellChange(primaryCol.id, val)}
        onPrev={handlePrev}
        onNext={handleNext}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onCopyLink={handleCopyLink}
        onClose={handleClose}
        data-icod-id="src_features_itemdetail_itemdetailpanel_tsx_fcc4" />
      {/* Fields section */}
      <div className="flex-1 overflow-y-auto" data-icod-id="src_features_itemdetail_itemdetailpanel_tsx_content">
        <PanelFields
          row={currentRow}
          columns={columns}
          primaryCol={primaryCol}
          isViewer={isViewer}
          onCellChange={handleCellChange}
          sheetKind={undefined}
          workspaceMembers={workspaceMembers}
          data-icod-id="src_features_itemdetail_itemdetailpanel_tsx_0cd0" />

        {/* Sub-items */}
        <PanelSubItems
          parentId={openRowId}
          rows={rows}
          columns={columns}
          sheetId={sheetId}
          data-icod-id="src_features_itemdetail_itemdetailpanel_tsx_5757" />

        {/* Tabs */}
        <div className="border-t border-border" data-icod-id="src_features_itemdetail_itemdetailpanel_tsx_tabs_wrap">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={(id) => dispatch(setTab(id as ItemDetailTab))}
            className="px-4"
            data-icod-id="src_features_itemdetail_itemdetailpanel_tsx_0f06" />
          <div className="p-4" data-icod-id="src_features_itemdetail_itemdetailpanel_tsx_tab_content">
            {activeTab === 'comments' ? (
              <CommentsTab
                sheetId={sheetId}
                rowId={openRowId}
                userRole={userRole}
                data-icod-id="src_features_itemdetail_itemdetailpanel_tsx_b620" />
            ) : activeTab === 'attachments' ? (
              <AttachmentsTab
                sheetId={sheetId}
                rowId={openRowId}
                userRole={userRole}
                data-icod-id="src_features_itemdetail_itemdetailpanel_tsx_attachments" />
            ) : (
              <ActivityTab
                sheetId={sheetId}
                rowId={openRowId}
                onTabChange={(tab) => dispatch(setTab(tab))}
                data-icod-id="src_features_itemdetail_itemdetailpanel_tsx_1615" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
