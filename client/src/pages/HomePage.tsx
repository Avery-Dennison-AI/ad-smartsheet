import { Link } from 'react-router-dom';
import { Clock, Star } from 'lucide-react';
import { PageContainer, Card, EmptyState, WorkspaceIcon } from '@/components/ui';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { PLACEHOLDER_WORKSPACES } from '@/utils/workspaces';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomePage() {
  const user = useAppSelector(selectCurrentUser);
  const firstName = user?.fullName?.split(' ')[0] || 'there';
  const greeting = getGreeting();

  return (
    <PageContainer data-icod-id="src_pages_homepage_tsx_2edb">
      {/* Greeting header */}
      <div className="mb-8" data-icod-id="src_pages_homepage_tsx_b6b4">
        <h1
          className="text-[var(--text-xl)] font-bold text-[var(--color-gray-900)]"
          data-icod-id="src_pages_homepage_tsx_87db">
          {greeting}, {firstName}
        </h1>
        <p
          className="mt-1 text-[var(--text-sm)] text-[var(--color-gray-600)]"
          data-icod-id="src_pages_homepage_tsx_205c">
          Here's what's happening in your workspaces.
        </p>
      </div>
      <div
        className="flex flex-col gap-6"
        data-icod-id="src_pages_homepage_tsx_2ee2">
        {/* Two-column row: Recent sheets + Favorites */}
        <div
          className="grid grid-cols-1 gap-6 md:grid-cols-2"
          data-icod-id="src_pages_homepage_tsx_0924">
          <Card header="Recent sheets" data-icod-id="src_pages_homepage_tsx_006d">
            <EmptyState
              compact
              icon={Clock}
              title="Sheets you open will appear here."
              data-icod-id="src_pages_homepage_tsx_bf12" />
          </Card>

          <Card header="Favorites" data-icod-id="src_pages_homepage_tsx_c140">
            <EmptyState
              compact
              icon={Star}
              title="Star sheets to find them quickly."
              data-icod-id="src_pages_homepage_tsx_8838" />
          </Card>
        </div>

        {/* Your workspaces section */}
        <div data-icod-id="src_pages_homepage_tsx_dd31">
          <h2
            className="mb-3 text-[var(--text-base)] font-medium text-[var(--color-gray-600)]"
            data-icod-id="src_pages_homepage_tsx_c334">
            Your workspaces
          </h2>
          {PLACEHOLDER_WORKSPACES.length > 0 ? (
            <div
              className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
              data-icod-id="src_pages_homepage_tsx_c082">
              {PLACEHOLDER_WORKSPACES.map((ws) => (
                <Link
                  key={ws.slug}
                  to={`/workspaces/${ws.slug}`}
                  className="group block rounded-[var(--radius-lg)] border border-border bg-card p-4 transition-colors hover:border-[var(--color-gray-400)] hover:bg-[var(--color-gray-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] cursor-pointer"
                  data-icod-id={`src_pages_homepage_tsx_df8c_${ws.slug}`}>
                  <div
                    className="flex items-center gap-3"
                    data-icod-id={`src_pages_homepage_tsx_b49b_${ws.slug}`}>
                    <WorkspaceIcon
                      name={ws.name}
                      color={ws.colorVar}
                      size="sm"
                      data-icod-id={`src_pages_homepage_tsx_e176_${ws.slug}`} />
                    <span
                      className="truncate text-[var(--text-sm)] font-medium text-[var(--color-gray-900)]"
                      data-icod-id={`src_pages_homepage_tsx_e4cc_${ws.slug}`}>{ws.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <Card data-icod-id="src_pages_homepage_tsx_2865">
              <EmptyState
                compact
                title="No workspaces yet."
                data-icod-id="src_pages_homepage_tsx_2ee7" />
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
