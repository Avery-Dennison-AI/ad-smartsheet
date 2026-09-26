import { Star } from 'lucide-react';
import { EmptyState, PageHeader, PageContainer, Card } from '@/components/ui';

export default function FavoritesPage() {
  return (
    <PageContainer data-icod-id="src_pages_favoritespage_tsx_074e">
      <PageHeader title="Favorites" data-icod-id="src_pages_favoritespage_tsx_aa9c" />
      <Card data-icod-id="src_pages_favoritespage_tsx_3a7b">
        <EmptyState
          icon={Star}
          title="No favorites"
          description="Star sheets to pin them here for quick access."
          data-icod-id="src_pages_favoritespage_tsx_4bda" />
      </Card>
    </PageContainer>
  );
}
