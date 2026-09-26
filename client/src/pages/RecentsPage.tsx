import { Clock } from 'lucide-react';
import { EmptyState, PageHeader, PageContainer, Card } from '@/components/ui';

export default function RecentsPage() {
  return (
    <PageContainer data-icod-id="src_pages_recentspage_tsx_99d4">
      <PageHeader title="Recents" data-icod-id="src_pages_recentspage_tsx_cbeb" />
      <Card data-icod-id="src_pages_recentspage_tsx_b5ca">
        <EmptyState
          icon={Clock}
          title="No recent activity"
          description="Sheets you open will appear here."
          data-icod-id="src_pages_recentspage_tsx_174f" />
      </Card>
    </PageContainer>
  );
}
