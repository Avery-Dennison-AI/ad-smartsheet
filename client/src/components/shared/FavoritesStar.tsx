import { Star } from 'lucide-react';
import { cn } from '@/utils/cn';
import Tooltip from '@/components/ui/Tooltip';

interface FavoritesStarProps {
  isFavorite: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md';
}

export default function FavoritesStar({ isFavorite, onToggle, size = 'md' }: FavoritesStarProps) {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const tooltipText = isFavorite ? 'Remove from favorites' : 'Add to favorites';

  return (
    <Tooltip
      content={tooltipText}
      data-icod-id="src_components_shared_favoritesstar_tsx_9502">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={cn(
          'shrink-0 rounded p-1 transition-colors hover:bg-muted',
          isFavorite ? 'text-[#D97706]' : 'text-muted-foreground hover:text-foreground',
        )}
        aria-label={tooltipText}
        data-icod-id="src_components_shared_favoritesstar_tsx_3981">
        <Star
          className={cn(iconSize, isFavorite && 'fill-current')}
          data-icod-id="src_components_shared_favoritesstar_tsx_7953" />
      </button>
    </Tooltip>
  );
}
