import { Link } from 'react-router-dom';
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
        {/* Recent sheets card */}
        <Card header="Recent sheets" data-icod-id="src_pages_homepage_tsx_006d">
          <EmptyState
            title="Sheets you open will appear here."
            description=""
            data-icod-id="src_pages_homepage_tsx_bf12" />
        </Card>

        {/* Favorites card */}
        <Card header="Favorites" data-icod-id="src_pages_homepage_tsx_c140">
          <EmptyState
            title="Star sheets for quick access."
            description=""
            data-icod-id="src_pages_homepage_tsx_8838" />
        </Card>

        {/* Your workspaces section */}
        <div data-icod-id="src_pages_homepage_tsx_dd31">
          <h2
            className="mb-3 text-[var(--text-sm)] font-medium text-[var(--color-gray-900)]"
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
                  data-icod-id={`src_pages_homepage_tsx_df8c_${ws.slug}`}>
                  <Card
                    className="flex items-center gap-3 p-4 transition-shadow hover:shadow-[var(--shadow-sm)] cursor-pointer"
                    data-icod-id={`src_pages_homepage_tsx_6c52_${ws.slug}`}>
                    <WorkspaceIcon
                      name={ws.name}
                      color={ws.colorVar}
                      size="md"
                      data-icod-id={`src_pages_homepage_tsx_e176_${ws.slug}`} />
                    <span
                      className="font-medium text-[var(--color-gray-900)]"
                      data-icod-id={`src_pages_homepage_tsx_e4cc_${ws.slug}`}>{ws.name}</span>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card data-icod-id="src_pages_homepage_tsx_2865">
              <EmptyState
                title="No workspaces yet."
                description=""
                data-icod-id="src_pages_homepage_tsx_2ee7" />
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
