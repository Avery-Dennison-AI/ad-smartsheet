import { Clock } from 'lucide-react';
import { EmptyState, PageHeader } from '@/components/ui';

export default function RecentsPage() {
  return (
    <div data-icod-id="src_pages_recentspage_tsx_29ac">
      <PageHeader title="Recents" data-icod-id="src_pages_recentspage_tsx_cbeb" />
      <EmptyState
        icon={Clock}
        title="No recent activity"
        description="Sheets you open will appear here."
        data-icod-id="src_pages_recentspage_tsx_e4ad" />
    </div>
  );
}
