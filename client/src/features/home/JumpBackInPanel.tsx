import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Card, EmptyState, SheetIcon } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchRecents, fetchFavorites, selectRecents, selectFavorites } from '@/store/slices/userMetaSlice';
import type { SheetMetaItem } from '@/types';

/** Merges favorites and recents, deduped by sheet id, favorites first. */
function mergeJumpBackIn(favorites: SheetMetaItem[], recents: SheetMetaItem[]): SheetMetaItem[] {
  const seen = new Set<string>();
  const result: SheetMetaItem[] = [];

  // Favorites first
  for (const item of favorites) {
    if (!seen.has(item.sheet.id)) {
      seen.add(item.sheet.id);
      result.push(item);
    }
  }

  // Then recents (deduped)
  for (const item of recents) {
    if (!seen.has(item.sheet.id)) {
      seen.add(item.sheet.id);
      result.push(item);
    }
  }

  return result.slice(0, 6);
}

export default function JumpBackInPanel() {
  const dispatch = useAppDispatch();
  const recents = useAppSelector(selectRecents);
  const favorites = useAppSelector(selectFavorites);

  useEffect(() => {
    dispatch(fetchRecents());
    dispatch(fetchFavorites());
  }, [dispatch]);

  const items = mergeJumpBackIn(favorites, recents);

  return (
    <Card className="flex flex-col" data-icod-id="src_features_home_jumpbackinpanel_tsx_root">
      <h3
        className="mb-2 text-sm font-semibold text-foreground"
        data-icod-id="src_features_home_jumpbackinpanel_tsx_5e09">Jump Back In</h3>
      {items.length > 0 ? (
        <ul className="flex flex-col gap-0.5" data-icod-id="src_features_home_jumpbackinpanel_tsx_list">
          {items.map((item) => {
            const isFav = favorites.some((f) => f.sheet.id === item.sheet.id);
            return (
              <li
                key={item.sheet.id}
                data-icod-id={`src_features_home_jumpbackinpanel_tsx_589b_${item.sheet.id}`}>
                <Link
                  to={`/sheets/${item.sheet.id}`}
                  className="flex items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 transition-colors hover:bg-muted/50"
                  data-icod-id={`src_features_home_jumpbackinpanel_tsx_item_${item.sheet.id}`}
                >
                  <SheetIcon
                    className="h-4 w-4 shrink-0"
                    data-icod-id={`src_features_home_jumpbackinpanel_tsx_dba1_${item.sheet.id}`} />
                  <div
                    className="min-w-0 flex-1"
                    data-icod-id={`src_features_home_jumpbackinpanel_tsx_f486_${item.sheet.id}`}>
                    <span
                      className="block truncate text-sm font-medium text-foreground"
                      data-icod-id={`src_features_home_jumpbackinpanel_tsx_e213_${item.sheet.id}`}>
                      {item.sheet.name}
                    </span>
                    <span
                      className="block truncate text-xs text-muted-foreground"
                      data-icod-id={`src_features_home_jumpbackinpanel_tsx_8767_${item.sheet.id}`}>
                      {item.workspace.name}
                    </span>
                  </div>
                  {isFav && (
                    <Star
                      className="h-3.5 w-3.5 shrink-0 fill-primary text-primary"
                      data-icod-id={`src_features_home_jumpbackinpanel_tsx_24e6_${item.sheet.id}`} />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          compact
          icon={SheetIcon}
          title="No recent sheets yet."
          data-icod-id="src_features_home_jumpbackinpanel_tsx_6f94" />
      )}
    </Card>
  );
}
