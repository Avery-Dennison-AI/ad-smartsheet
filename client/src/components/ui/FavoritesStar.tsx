import { Star } from 'lucide-react';
import { cn } from '@/utils/cn';
import IconButton from './IconButton';

interface FavoritesStarProps {
  isFavorite: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md';
}

export default function FavoritesStar({ isFavorite, onToggle, size = 'md' }: FavoritesStarProps) {
  const tooltipText = isFavorite ? 'Remove from favorites' : 'Add to favorites';

  return (
    <IconButton
      size={size === 'sm' ? 'sm' : 'md'}
      tooltip={tooltipText}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        'shrink-0',
        isFavorite && 'text-warning',
      )}
      data-icod-id="src_components_ui_favoritesstar_tsx_f46b">
      <Star
        className={cn(isFavorite && 'fill-current')}
        data-icod-id="src_components_ui_favoritesstar_tsx_d3c9" />
    </IconButton>
  );
}
