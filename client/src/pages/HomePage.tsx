import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Star, Share2 } from 'lucide-react';
import { PageContainer, Card, EmptyState, Button, Skeleton, WorkspaceIcon, RelativeTime } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { fetchWorkspaces, selectWorkspaceList, selectWorkspaceStatus } from '@/store/slices/workspaceSlice';
import { fetchRecents, fetchFavorites, selectRecents, selectFavorites } from '@/store/slices/userMetaSlice';
import { fetchSharedWithMe, selectSharedWithMe } from '@/store/slices/sheetsSlice';
import { CreateWorkspaceModal } from '@/features/workspaces';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomePage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const workspaces = useAppSelector(selectWorkspaceList);
  const status = useAppSelector(selectWorkspaceStatus);
  const recents = useAppSelector(selectRecents);
  const favorites = useAppSelector(selectFavorites);
  const sharedWithMe = useAppSelector(selectSharedWithMe);
  const firstName = user?.fullName?.split(' ')[0] || 'there';
  const greeting = getGreeting();
  const isGuest = user?.role === 'guest';
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (!isGuest && status === 'idle') dispatch(fetchWorkspaces());
  }, [status, isGuest, dispatch]);

  useEffect(() => {
    dispatch(fetchRecents());
    dispatch(fetchFavorites());
    dispatch(fetchSharedWithMe());
  }, [dispatch]);

  return (
    <PageContainer data-icod-id="src_pages_homepage_tsx_a7df">
      {/* Greeting header */}
      <div className="mb-8" data-icod-id="src_pages_homepage_tsx_e64a">
        <h1
          className="text-xl font-bold text-foreground"
          data-icod-id="src_pages_homepage_tsx_18af">{greeting}, {firstName}</h1>
        <p
          className="mt-1 text-sm text-muted-foreground"
          data-icod-id="src_pages_homepage_tsx_80fc">Here's what's happening in your workspaces.</p>
      </div>
      <div
        className="flex flex-col gap-6"
        data-icod-id="src_pages_homepage_tsx_5c06">
        {/* Two-column row: Recent sheets + Favorites */}
        <div
          className="grid grid-cols-1 gap-6 md:grid-cols-2"
          data-icod-id="src_pages_homepage_tsx_49b3">
          <Card header="Recent sheets" data-icod-id="src_pages_homepage_tsx_1980">
            {recents.length > 0 ? (
              <ul
                className="flex flex-col gap-1"
                data-icod-id="src_pages_homepage_tsx_5452">
                {recents.slice(0, 5).map((item) => (
                  <li
                    key={item.sheet.id}
                    className="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 hover:bg-muted"
                    data-icod-id={`src_pages_homepage_tsx_5453_${item.sheet.id}`}>
                    <div
                      className="min-w-0 flex-1"
                      data-icod-id={`src_pages_homepage_tsx_410b_${item.sheet.id}`}>
                      <Link
                        to={`/sheets/${item.sheet.id}`}
                        className="truncate text-sm font-medium text-foreground hover:underline"
                        data-icod-id={`src_pages_homepage_tsx_d2c6_${item.sheet.id}`}>
                        {item.sheet.name}
                      </Link>
                      <span
                        className="ml-2 text-xs text-muted-foreground"
                        data-icod-id={`src_pages_homepage_tsx_9987_${item.sheet.id}`}>{item.workspace.name}</span>
                    </div>
                    {item.lastOpenedAt && (
                      <RelativeTime
                        date={item.lastOpenedAt}
                        data-icod-id={`src_pages_homepage_tsx_d9e7_${item.sheet.id}`} />
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                compact
                icon={Clock}
                title="Sheets you open will appear here."
                data-icod-id="src_pages_homepage_tsx_023a" />
            )}
          </Card>
          <Card header="Favorites" data-icod-id="src_pages_homepage_tsx_13c8">
            {favorites.length > 0 ? (
              <ul
                className="flex flex-col gap-1"
                data-icod-id="src_pages_homepage_tsx_71da">
                {favorites.slice(0, 5).map((item) => (
                  <li
                    key={item.sheet.id}
                    className="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 hover:bg-muted"
                    data-icod-id={`src_pages_homepage_tsx_fd2d_${item.sheet.id}`}>
                    <div
                      className="min-w-0 flex-1"
                      data-icod-id={`src_pages_homepage_tsx_5a09_${item.sheet.id}`}>
                      <Link
                        to={`/sheets/${item.sheet.id}`}
                        className="truncate text-sm font-medium text-foreground hover:underline"
                        data-icod-id={`src_pages_homepage_tsx_cbe6_${item.sheet.id}`}>
                        {item.sheet.name}
                      </Link>
                      <span
                        className="ml-2 text-xs text-muted-foreground"
                        data-icod-id={`src_pages_homepage_tsx_323c_${item.sheet.id}`}>{item.workspace.name}</span>
                    </div>
                    <RelativeTime
                      date={item.sheet.updatedAt}
                      data-icod-id={`src_pages_homepage_tsx_8ad3_${item.sheet.id}`} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                compact
                icon={Star}
                title="Star sheets to find them quickly."
                data-icod-id="src_pages_homepage_tsx_dfd0" />
            )}
          </Card>
        </div>

        {/* Shared with me section — shown when there are shared sheets */}
        {sharedWithMe.length > 0 && (
          <div data-icod-id="src_pages_homepage_tsx_shared_section">
            <h2
              className="mb-3 text-base font-medium text-muted-foreground"
              data-icod-id="src_pages_homepage_tsx_shared_title">Shared with me</h2>
            <Card data-icod-id="src_pages_homepage_tsx_shared_card">
              <ul
                className="flex flex-col gap-1"
                data-icod-id="src_pages_homepage_tsx_3fbc">
                {sharedWithMe.slice(0, 5).map((item) => (
                  <li
                    key={item.sheet.id}
                    className="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 hover:bg-muted"
                    data-icod-id={`src_pages_homepage_tsx_d56f_${item.sheet.id}`}>
                    <div
                      className="min-w-0 flex-1"
                      data-icod-id={`src_pages_homepage_tsx_3a43_${item.sheet.id}`}>
                      <Link
                        to={`/sheets/${item.sheet.id}`}
                        className="truncate text-sm font-medium text-foreground hover:underline"
                        data-icod-id={`src_pages_homepage_tsx_5895_${item.sheet.id}`}>
                        {item.sheet.name}
                      </Link>
                      <span
                        className="ml-2 text-xs text-muted-foreground"
                        data-icod-id={`src_pages_homepage_tsx_a006_${item.sheet.id}`}>{item.workspace.name}</span>
                    </div>
                    <RelativeTime
                      date={item.sheet.updatedAt}
                      data-icod-id={`src_pages_homepage_tsx_1874_${item.sheet.id}`} />
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}

        {/* Your workspaces section — hidden for guests */}
        {!isGuest && (
          <div data-icod-id="src_pages_homepage_tsx_8a97">
            <h2
              className="mb-3 text-base font-medium text-muted-foreground"
              data-icod-id="src_pages_homepage_tsx_73c3">Your workspaces</h2>

            {status === 'loading' ? (
              <div
                className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                data-icod-id="src_pages_homepage_tsx_827e">
                <Skeleton variant="card" data-icod-id="src_pages_homepage_tsx_de3c" />
                <Skeleton variant="card" data-icod-id="src_pages_homepage_tsx_abad" />
                <Skeleton variant="card" data-icod-id="src_pages_homepage_tsx_d14c" />
              </div>
            ) : workspaces.length > 0 ? (
              <div
                className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                data-icod-id="src_pages_homepage_tsx_2ef0">
                {workspaces.map((ws) => (
                  <Link
                    key={ws.id}
                    to={`/workspaces/${ws.id}`}
                    className="group block rounded-[var(--radius-lg)] border border-border bg-card p-4 transition-colors hover:border-muted-foreground/30 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                    data-icod-id={`src_pages_homepage_tsx_7bb9_${ws.id}`}>
                    <div
                      className="flex items-center gap-3"
                      data-icod-id={`src_pages_homepage_tsx_ba6c_${ws.id}`}>
                      <WorkspaceIcon
                        name={ws.name}
                        color={ws.color}
                        size="sm"
                        data-icod-id={`src_pages_homepage_tsx_0568_${ws.id}`} />
                      <span
                        className="truncate text-sm font-medium text-foreground"
                        data-icod-id={`src_pages_homepage_tsx_a7b6_${ws.id}`}>{ws.name}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <Card data-icod-id="src_pages_homepage_tsx_593d">
                <EmptyState
                  compact
                  title="No workspaces yet."
                  action={<Button
                    size="sm"
                    onClick={() => setCreateOpen(true)}
                    data-icod-id="src_pages_homepage_tsx_0bf0">Create workspace</Button>}
                  data-icod-id="src_pages_homepage_tsx_ff86" />
              </Card>
            )}
          </div>
        )}
      </div>
      <CreateWorkspaceModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        data-icod-id="src_pages_homepage_tsx_e093" />
    </PageContainer>
  );
}
