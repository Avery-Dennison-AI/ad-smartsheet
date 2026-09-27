import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Star } from 'lucide-react';
import { PageContainer, Card, EmptyState, Button, Skeleton, WorkspaceIcon } from '@/components/ui';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { fetchWorkspaces, selectWorkspaceList, selectWorkspaceStatus } from '@/store/slices/workspaceSlice';
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
  const firstName = user?.fullName?.split(' ')[0] || 'there';
  const greeting = getGreeting();
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (status === 'idle') dispatch(fetchWorkspaces());
  }, [status, dispatch]);

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
            <EmptyState
              compact
              icon={Clock}
              title="Sheets you open will appear here."
              data-icod-id="src_pages_homepage_tsx_023a" />
          </Card>
          <Card header="Favorites" data-icod-id="src_pages_homepage_tsx_13c8">
            <EmptyState
              compact
              icon={Star}
              title="Star sheets to find them quickly."
              data-icod-id="src_pages_homepage_tsx_dfd0" />
          </Card>
        </div>

        {/* Your workspaces section */}
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
                  key={ws._id}
                  to={`/workspaces/${ws._id}`}
                  className="group block rounded-[var(--radius-lg)] border border-border bg-card p-4 transition-colors hover:border-muted-foreground/30 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                  data-icod-id={`src_pages_homepage_tsx_7bb9_${ws._id}`}>
                  <div
                    className="flex items-center gap-3"
                    data-icod-id={`src_pages_homepage_tsx_ba6c_${ws._id}`}>
                    <WorkspaceIcon
                      name={ws.name}
                      color={ws.color}
                      size="sm"
                      data-icod-id={`src_pages_homepage_tsx_0568_${ws._id}`} />
                    <span
                      className="truncate text-sm font-medium text-foreground"
                      data-icod-id={`src_pages_homepage_tsx_a7b6_${ws._id}`}>{ws.name}</span>
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
      </div>
      <CreateWorkspaceModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        data-icod-id="src_pages_homepage_tsx_e093" />
    </PageContainer>
  );
}
