import { LayoutGrid } from 'lucide-react';
import { EmptyState, PageHeader } from '@/components/ui';

export default function HomePage() {
  return (
    <div data-icod-id="src_pages_homepage_tsx_e6f6">
      <PageHeader title="Home" data-icod-id="src_pages_homepage_tsx_1587" />
      <EmptyState
        icon={LayoutGrid}
        title="No sheets yet"
        description="Create your first spreadsheet to get started with GridFlow."
        data-icod-id="src_pages_homepage_tsx_6fdc" />
    </div>
  );
}
