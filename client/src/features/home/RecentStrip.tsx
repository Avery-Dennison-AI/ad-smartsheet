import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { SheetIcon, RelativeTime } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchRecents, fetchFavorites, selectRecents, selectFavorites, selectUserMetaLoading } from '@/store/slices/userMetaSlice';
import type { SheetMetaItem } from '@/types';

/** Merges favorites and recents, deduped by sheet id, favorites first. Capped at 6. */
function mergeRecentsAndFavorites(favorites: SheetMetaItem[], recents: SheetMetaItem[]): SheetMetaItem[] {
  const seen = new Set<string>();
  const result: SheetMetaItem[] = [];

  for (const item of favorites) {
    if (!seen.has(item.sheet.id)) {
      seen.add(item.sheet.id);
      result.push(item);
    }
  }

  for (const item of recents) {
    if (!seen.has(item.sheet.id)) {
      seen.add(item.sheet.id);
      result.push(item);
    }
  }

  return result.slice(0, 6);
}

export default function RecentStrip() {
  const dispatch = useAppDispatch();
  const recents = useAppSelector(selectRecents);
  const favorites = useAppSelector(selectFavorites);
  const loading = useAppSelector(selectUserMetaLoading);

  useEffect(() => {
    if (!loading && recents.length === 0) {
      dispatch(fetchRecents());
    }
    if (!loading && favorites.length === 0) {
      dispatch(fetchFavorites());
    }
  }, [dispatch, loading, recents.length, favorites.length]);

  const items = mergeRecentsAndFavorites(favorites, recents);

  // Hide entirely when both favorites and recents are empty
  if (items.length === 0 && !loading) return null;

  return (
    <div className="mb-6" data-icod-id="src_features_home_recentstrip_tsx_root">
      <h2
        className="mb-3 text-base font-semibold text-foreground"
        data-icod-id="src_features_home_recentstrip_tsx_title">
        Recent
      </h2>
      <div
        className="flex flex-nowrap gap-3 overflow-x-auto pb-2"
        data-icod-id="src_features_home_recentstrip_tsx_scroll"
      >
        {items.map((item) => {
          const isFav = favorites.some((f) => f.sheet.id === item.sheet.id);
          return (
            <Link
              key={item.sheet.id}
              to={`/sheets/${item.sheet.id}`}
              className="flex w-[200px] shrink-0 flex-col gap-1.5 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/50"
              data-icod-id={`src_features_home_recentstrip_tsx_card_${item.sheet.id}`}
            >
              <div
                className="flex items-center gap-2"
                data-icod-id={`src_features_home_recentstrip_tsx_header_${item.sheet.id}`}>
                <SheetIcon
                  className="h-4 w-4 shrink-0"
                  data-icod-id={`src_features_home_recentstrip_tsx_icon_${item.sheet.id}`} />
                <span
                  className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground"
                  data-icod-id={`src_features_home_recentstrip_tsx_name_${item.sheet.id}`}>
                  {item.sheet.name}
                </span>
                {isFav && (
                  <Star
                    className="h-3.5 w-3.5 shrink-0 fill-primary text-primary"
                    data-icod-id={`src_features_home_recentstrip_tsx_star_${item.sheet.id}`} />
                )}
              </div>
              <div
                className="flex items-center justify-between"
                data-icod-id={`src_features_home_recentstrip_tsx_meta_${item.sheet.id}`}>
                <span
                  className="truncate text-xs text-muted-foreground"
                  data-icod-id={`src_features_home_recentstrip_tsx_ws_${item.sheet.id}`}>
                  {item.workspace.name}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground" data-icod-id={`src_features_home_recentstrip_tsx_time_${item.sheet.id}`}>
                  <RelativeTime
                    date={item.sheet.updatedAt}
                    data-icod-id={`src_features_home_recentstrip_tsx_23ae_${item.sheet.id}`} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
