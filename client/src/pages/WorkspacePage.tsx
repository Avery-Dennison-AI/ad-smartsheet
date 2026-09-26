import { useParams } from 'react-router-dom';
import { PageHeader, EmptyState, PageContainer } from '@/components/ui';

function slugToTitle(slug: string): string {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function WorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const workspaceName = id ? slugToTitle(id) : 'Workspace';

  return (
    <PageContainer data-icod-id="src_pages_workspacepage_tsx_7b9e">
      <PageHeader title={workspaceName} data-icod-id="src_pages_workspacepage_tsx_b9e2" />
      <EmptyState
        title="Sheets will appear here."
        description="Create your first sheet to get started."
        data-icod-id="src_pages_workspacepage_tsx_46b6" />
    </PageContainer>
  );
}
