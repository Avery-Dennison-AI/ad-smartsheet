import { Star } from 'lucide-react';
import { EmptyState } from '@/components/ui';

export default function FavoritesPage() {
  return (
    <div data-icod-id="src_pages_favoritespage_tsx_729e">
      <h1
        className="mb-6 text-[var(--text-xl)] font-semibold text-foreground"
        data-icod-id="src_pages_favoritespage_tsx_570b">Favorites</h1>
      <EmptyState
        icon={Star}
        title="No favorites"
        description="Star sheets to pin them here for quick access."
        data-icod-id="src_pages_favoritespage_tsx_2dd9" />
    </div>
  );
}
