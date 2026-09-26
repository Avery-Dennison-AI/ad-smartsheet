import { Clock } from 'lucide-react';
import { EmptyState } from '@/components/ui';

export default function RecentsPage() {
  return (
    <div data-icod-id="src_pages_recentspage_tsx_29ac">
      <h1
        className="mb-6 text-[var(--text-xl)] font-semibold text-foreground"
        data-icod-id="src_pages_recentspage_tsx_e555">Recents</h1>
      <EmptyState
        icon={Clock}
        title="No recent activity"
        description="Sheets you open will appear here."
        data-icod-id="src_pages_recentspage_tsx_e4ad" />
    </div>
  );
}
