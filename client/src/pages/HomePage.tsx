import { PageContainer } from '@/components/ui';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { selectMyWorkGroups } from '@/store/slices/myWorkSlice';
import { MyWorkSection, QuickActionsPanel, JumpBackInPanel, SharedWithMePanel } from '@/features/home';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomePage() {
  const user = useAppSelector(selectCurrentUser);
  const groups = useAppSelector(selectMyWorkGroups);
  const firstName = user?.fullName?.split(' ')[0] || 'there';
  const greeting = getGreeting();

  // Compute summary line
  const dueTodayCount = groups?.dueToday.total ?? 0;
  const overdueCount = groups?.overdue.total ?? 0;
  let summary: string;
  if (dueTodayCount === 0 && overdueCount === 0) {
    summary = "Nothing due today — you're on track.";
  } else {
    const parts: string[] = [];
    if (dueTodayCount > 0) parts.push(`${dueTodayCount} task${dueTodayCount !== 1 ? 's' : ''} due today`);
    if (overdueCount > 0) parts.push(`${overdueCount} overdue`);
    summary = `You have ${parts.join(' and ')}.`;
  }

  return (
    <PageContainer data-icod-id="src_pages_homepage_tsx_root">
      {/* Greeting */}
      <div className="mb-6" data-icod-id="src_pages_homepage_tsx_greeting">
        <h1
          className="text-xl font-bold text-foreground"
          data-icod-id="src_pages_homepage_tsx_6b0b">
          {greeting}, {firstName}
        </h1>
        <p
          className="mt-1 text-sm text-muted-foreground"
          data-icod-id="src_pages_homepage_tsx_1a19">{summary}</p>
      </div>
      {/* Two-column layout */}
      <div
        className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]"
        data-icod-id="src_pages_homepage_tsx_layout"
      >
        {/* Main column — My Work */}
        <MyWorkSection data-icod-id="src_pages_homepage_tsx_69e5" />

        {/* Right sidebar */}
        <aside className="flex flex-col gap-4" data-icod-id="src_pages_homepage_tsx_sidebar">
          <QuickActionsPanel data-icod-id="src_pages_homepage_tsx_fafc" />
          <JumpBackInPanel data-icod-id="src_pages_homepage_tsx_3100" />
          <SharedWithMePanel data-icod-id="src_pages_homepage_tsx_ca4b" />
        </aside>
      </div>
    </PageContainer>
  );
}
