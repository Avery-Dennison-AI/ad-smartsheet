import { useState } from 'react';
import { X } from 'lucide-react';
import { Avatar } from '@/components/ui';
import { cn } from '@/utils/cn';
import FloatingCellList, { type FloatingCellListItem } from './FloatingCellList';
import ContactCellEditor from './editors/ContactCellEditor';

interface GridMember {
  id: string;
  fullName: string;
  email: string;
}

interface ContactCellEditOverlayProps {
  cellRef: React.RefObject<HTMLDivElement | null>;
  value: string | number | boolean | null;
  workspaceMembers?: GridMember[];
  onCommit: (value: unknown) => void;
  onStopEdit: () => void;
  committedRef: React.MutableRefObject<boolean>;
}

export default function ContactCellEditOverlay({
  cellRef,
  value,
  workspaceMembers,
  onCommit,
  onStopEdit,
  committedRef,
}: ContactCellEditOverlayProps) {
  const [contactQuery, setContactQuery] = useState('');

  const filteredMembers = workspaceMembers?.filter(
    (m) =>
      !contactQuery ||
      m.fullName.toLowerCase().includes(contactQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(contactQuery.toLowerCase()),
  ) ?? [];

  const listItems: FloatingCellListItem<GridMember>[] = filteredMembers.map((m) => ({
    id: m.id,
    data: m,
  }));

  const handleSelectMember = (item: FloatingCellListItem<GridMember>) => {
    if (!committedRef.current) {
      committedRef.current = true;
      onCommit(item.data.id);
      onStopEdit();
    }
  };

  return (
    <div
      className="relative h-full w-full flex items-center px-1"
      data-icod-id="src_features_sheets_grid_contactcelleditoverlay_tsx_42d9">
      <span
        className="truncate text-sm text-muted-foreground/60"
        data-icod-id="src_features_sheets_grid_contactcelleditoverlay_tsx_44b4">
        {(() => {
          const member = workspaceMembers?.find((m) => m.id === String(value));
          return member ? member.fullName : 'Search members...';
        })()}
      </span>
      <FloatingCellList
        anchorRef={cellRef}
        additionalCloseTarget={cellRef}
        open={true}
        onClose={() => {
          if (!committedRef.current) {
            committedRef.current = true;
            onStopEdit();
          }
        }}
        items={listItems}
        minWidth={220}
        renderItem={(item, _idx, isFocused) => (
          <div
            className={cn('flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs', isFocused && 'bg-muted')}
            data-icod-id="src_features_sheets_grid_contactcelleditoverlay_tsx_20d4">
            <Avatar
              name={item.data.fullName}
              size="sm"
              className="!h-5 !w-5"
              data-icod-id="src_features_sheets_grid_contactcelleditoverlay_tsx_cbf9" />
            <div
              className="min-w-0 flex-1"
              data-icod-id="src_features_sheets_grid_contactcelleditoverlay_tsx_7fff">
              <div
                className="truncate font-medium"
                data-icod-id="src_features_sheets_grid_contactcelleditoverlay_tsx_7ca2">{item.data.fullName}</div>
              <div
                className="truncate text-muted-foreground"
                data-icod-id="src_features_sheets_grid_contactcelleditoverlay_tsx_71d7">{item.data.email}</div>
            </div>
          </div>
        )}
        onSelect={handleSelectMember}
        header={
          <ContactCellEditor
            query={contactQuery}
            onQueryChange={(v) => setContactQuery(v)}
            onKeyDown={(e) => {
              if (e.key === 'Tab') {
                e.preventDefault();
                if (filteredMembers.length > 0 && !committedRef.current) {
                  committedRef.current = true;
                  onCommit(filteredMembers[0].id);
                }
                onStopEdit();
              }
            }}
            data-icod-id="src_features_sheets_grid_contactcelleditoverlay_tsx_6e40" />
        }
        footer={
          value != null && value !== '' ? (
            <div
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-muted cursor-pointer"
              onMouseDown={(e) => {
                e.preventDefault();
                if (!committedRef.current) {
                  committedRef.current = true;
                  onCommit(null);
                  onStopEdit();
                }
              }}
              data-icod-id="src_features_sheets_grid_contactcelleditoverlay_tsx_6fbd">
              <X
                className="h-3 w-3 text-muted-foreground"
                data-icod-id="src_features_sheets_grid_contactcelleditoverlay_tsx_c28f" />
              <span
                className="text-muted-foreground"
                data-icod-id="src_features_sheets_grid_contactcelleditoverlay_tsx_1b86">Clear</span>
            </div>
          ) : undefined
        }
        maxHeight={220}
        data-icod-id="src_features_sheets_grid_contactcelleditoverlay_tsx_5eae" />
    </div>
  );
}
