import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Share2 } from 'lucide-react';
import { Card, EmptyState, SheetIcon } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchSharedWithMe, selectSharedWithMe, selectSharedWithMeStatus } from '@/store/slices/sheetsSlice';
import { selectCurrentUser } from '@/store/slices/authSlice';

export default function SharedWithMePanel() {
  const dispatch = useAppDispatch();
  const sharedItems = useAppSelector(selectSharedWithMe);
  const status = useAppSelector(selectSharedWithMeStatus);
  const user = useAppSelector(selectCurrentUser);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchSharedWithMe());
    }
  }, [status, dispatch]);

  // Hide entirely for non-guest users who have no shared items
  if (user?.role !== 'guest' && sharedItems.length === 0 && status !== 'loading') {
    return null;
  }

  if (sharedItems.length === 0 && status === 'succeeded') {
    return null;
  }

  return (
    <Card className="flex flex-col" data-icod-id="src_features_home_sharedwithmepanel_tsx_root">
      <div
        className="mb-2 flex items-center justify-between"
        data-icod-id="src_features_home_sharedwithmepanel_tsx_03b7">
        <h3
          className="text-sm font-semibold text-foreground"
          data-icod-id="src_features_home_sharedwithmepanel_tsx_a00c">Shared with Me</h3>
        <Link
          to="/shared"
          className="text-xs font-medium text-primary hover:underline"
          data-icod-id="src_features_home_sharedwithmepanel_tsx_view_all"
        >
          View all
        </Link>
      </div>
      {sharedItems.length > 0 ? (
        <ul className="flex flex-col gap-0.5" data-icod-id="src_features_home_sharedwithmepanel_tsx_list">
          {sharedItems.slice(0, 5).map((item) => (
            <li
              key={item.sheet.id}
              data-icod-id={`src_features_home_sharedwithmepanel_tsx_3c0d_${item.sheet.id}`}>
              <Link
                to={`/sheets/${item.sheet.id}`}
                className="flex items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 transition-colors hover:bg-muted/50"
                data-icod-id={`src_features_home_sharedwithmepanel_tsx_item_${item.sheet.id}`}
              >
                <SheetIcon
                  className="h-4 w-4 shrink-0"
                  data-icod-id={`src_features_home_sharedwithmepanel_tsx_860c_${item.sheet.id}`} />
                <div
                  className="min-w-0 flex-1"
                  data-icod-id={`src_features_home_sharedwithmepanel_tsx_1dba_${item.sheet.id}`}>
                  <span
                    className="block truncate text-sm font-medium text-foreground"
                    data-icod-id={`src_features_home_sharedwithmepanel_tsx_c281_${item.sheet.id}`}>
                    {item.sheet.name}
                  </span>
                  <span
                    className="block truncate text-xs text-muted-foreground"
                    data-icod-id={`src_features_home_sharedwithmepanel_tsx_9ced_${item.sheet.id}`}>
                    {item.workspace.name}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          compact
          icon={Share2}
          title="No sheets shared with you."
          data-icod-id="src_features_home_sharedwithmepanel_tsx_b044" />
      )}
    </Card>
  );
}
