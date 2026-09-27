import { LayoutGrid } from 'lucide-react';
import { EmptyState, Button } from '@/components/ui';

interface SheetEmptyStateProps {
  canCreate: boolean;
  onCreateClick: () => void;
}

export default function SheetEmptyState({ canCreate, onCreateClick }: SheetEmptyStateProps) {
  return (
    <EmptyState
      icon={LayoutGrid}
      title="No sheets yet"
      description="Sheets you create in this workspace will appear here."
      action={
        canCreate ? (
          <Button
            size="sm"
            onClick={onCreateClick}
            data-icod-id="src_features_sheets_components_sheetemptystate_tsx_f485">
            New sheet
          </Button>
        ) : undefined
      }
      data-icod-id="src_features_sheets_components_sheetemptystate_tsx_09c8" />
  );
}
