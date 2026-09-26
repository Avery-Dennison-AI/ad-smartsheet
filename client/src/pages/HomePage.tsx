import { LayoutGrid } from 'lucide-react';
import { EmptyState } from '@/components/ui';

export default function HomePage() {
  return (
    <div data-icod-id="src_pages_homepage_tsx_e6f6">
      <h1
        className="mb-6 text-[var(--text-xl)] font-semibold text-foreground"
        data-icod-id="src_pages_homepage_tsx_5b5e">Home</h1>
      <EmptyState
        icon={LayoutGrid}
        title="No sheets yet"
        description="Create your first spreadsheet to get started with GridFlow."
        data-icod-id="src_pages_homepage_tsx_6fdc" />
    </div>
  );
}
