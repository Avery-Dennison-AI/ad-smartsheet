import { Star } from 'lucide-react';
import { EmptyState, PageHeader } from '@/components/ui';

export default function FavoritesPage() {
  return (
    <div data-icod-id="src_pages_favoritespage_tsx_729e">
      <PageHeader title="Favorites" data-icod-id="src_pages_favoritespage_tsx_aa9c" />
      <EmptyState
        icon={Star}
        title="No favorites"
        description="Star sheets to pin them here for quick access."
        data-icod-id="src_pages_favoritespage_tsx_2dd9" />
    </div>
  );
}
