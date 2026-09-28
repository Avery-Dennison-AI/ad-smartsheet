import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Users, Mail } from 'lucide-react';
import { PageContainer, PageHeader, Card, SaveIndicator, Button, Tabs, useToast } from '@/components/ui';
import { cn } from '@/utils/cn';
import { ACCENTS, ACCENT_META, applyAccent, getStoredAccent, type Accent } from '@/utils/theme';
import { updateUserPreferences } from '@/services/userService';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectCurrentUser, fetchMe } from '@/store/slices/authSlice';
import { selectAdminUsers, selectAdminInvitations } from '@/store/slices/adminSlice';
import { InviteModal, UsersTab, InvitationsTab } from '@/features/admin';

type SectionId = 'appearance' | 'users';

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const isAdmin = user?.role === 'admin';

  // Determine initial section from query param or default
  const initialSection = (() => {
    const s = searchParams.get('section');
    if (s === 'users' && isAdmin) return 'users';
    return 'appearance';
  })();

  const [activeSection, setActiveSection] = useState<SectionId>(initialSection);
  const [currentAccent, setCurrentAccent] = useState<Accent>(getStoredAccent());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Admin users tab state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [adminActiveTab, setAdminActiveTab] = useState('users');
  const adminUsers = useAppSelector(selectAdminUsers);
  const adminInvitations = useAppSelector(selectAdminInvitations);

  const handleCloseInvite = useCallback(() => setInviteOpen(false), []);

  async function handleAccentChange(accent: Accent) {
    setCurrentAccent(accent);
    applyAccent(accent);
    setSaveError(null);

    // Only persist to server if user is logged in
    if (user) {
      setSaving(true);
      try {
        await updateUserPreferences({ accentColor: accent });
        await dispatch(fetchMe());
        setSaving(false);
        addToast('success', 'Accent color updated');
      } catch {
        setSaving(false);
        setSaveError('Failed to save preference');
      }
    }
  }

  // Build sections list dynamically based on role
  const sections: { id: SectionId; label: string; group?: string }[] = [
    { id: 'appearance', label: 'Appearance', group: 'Preferences' },
  ];
  if (isAdmin) {
    sections.push({ id: 'users', label: 'Users', group: 'Administration' });
  }

  // Group sections by their group label
  const groupedSections: { group: string; items: typeof sections }[] = [];
  for (const section of sections) {
    const g = section.group || '';
    const existing = groupedSections.find((gs) => gs.group === g);
    if (existing) {
      existing.items.push(section);
    } else {
      groupedSections.push({ group: g, items: [section] });
    }
  }

  const adminTabs = [
    { id: 'users', label: 'Users', icon: <Users className="h-4 w-4" data-icod-id="src_pages_settingspage_tsx_1425" />, badge: adminUsers.length },
    { id: 'invitations', label: 'Invitations', icon: <Mail className="h-4 w-4" data-icod-id="src_pages_settingspage_tsx_1fb1" />, badge: adminInvitations.length },
  ];

  return (
    <PageContainer data-icod-id="src_pages_settingspage_tsx_e2e1">
      <PageHeader
        title="Settings"
        description="Manage your preferences"
        data-icod-id="src_pages_settingspage_tsx_9d8a" />
      <div
        className="flex flex-col gap-8 lg:flex-row max-w-3xl"
        data-icod-id="src_pages_settingspage_tsx_2d16">
        {/* Left sidebar nav */}
        <nav
          className="w-full shrink-0 lg:w-48 lg:sticky lg:top-6 lg:self-start"
          data-icod-id="src_pages_settingspage_tsx_dc80">
          <div
            className="flex flex-col gap-3"
            data-icod-id="src_pages_settingspage_tsx_53fb">
            {groupedSections.map((group, gi) => (
              <div
                key={gi}
                className="flex flex-col gap-0.5"
                data-icod-id={`src_pages_settingspage_tsx_82e5_${gi}`}>
                {group.group && (
                  <span
                    className="mb-1 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground"
                    data-icod-id={`src_pages_settingspage_tsx_debd_${gi}`}>
                    {group.group}
                  </span>
                )}
                {group.items.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      'rounded-[var(--radius-md)] px-3 py-2 text-left text-sm font-medium transition-colors',
                      activeSection === section.id
                        ? 'bg-primary/10 text-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                    data-icod-id={`src_pages_settingspage_tsx_2279_${section.id}`}>
                    {section.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </nav>

        {/* Section content */}
        <div className="flex-1 min-w-0" data-icod-id="src_pages_settingspage_tsx_54ec">
          {activeSection === 'appearance' && (
            <Card className="p-6" data-icod-id="src_pages_settingspage_tsx_617a">
              <h2
                className="text-md font-semibold text-foreground"
                data-icod-id="src_pages_settingspage_tsx_4dd5">Appearance</h2>
              <p
                className="mt-1 text-sm text-muted-foreground"
                data-icod-id="src_pages_settingspage_tsx_f19e">
                Customize how AD Smartsheet looks for you.
              </p>

              <div className="mt-6" data-icod-id="src_pages_settingspage_tsx_96e1">
                <div className="mb-3" data-icod-id="src_pages_settingspage_tsx_d915">
                  <label
                    className="text-sm font-medium text-foreground"
                    data-icod-id="src_pages_settingspage_tsx_302e">Accent color</label>
                  <p
                    className="text-xs text-muted-foreground"
                    data-icod-id="src_pages_settingspage_tsx_7853">
                    Changes the primary color across the entire app.
                  </p>
                </div>

                <div
                  className="flex flex-wrap gap-3"
                  data-icod-id="src_pages_settingspage_tsx_94f7">
                  {ACCENTS.map((accent) => {
                    const isSelected = currentAccent === accent;
                    const meta = ACCENT_META[accent];
                    return (
                      <button
                        key={accent}
                        onClick={() => handleAccentChange(accent)}
                        className={cn(
                          'group relative flex flex-col items-center gap-2 rounded-[var(--radius-md)] p-2 transition-all hover:scale-105',
                          isSelected
                            ? 'ring-2 ring-primary ring-offset-2 ring-offset-card'
                            : 'ring-1 ring-border hover:ring-muted-foreground/30',
                        )}
                        aria-label={`Select ${meta.label} accent`}
                        aria-pressed={isSelected}
                        data-icod-id={`src_pages_settingspage_tsx_455d_${accent}`}>
                        <div
                          className="relative flex h-12 w-12 items-center justify-center rounded-full"
                          style={{ backgroundColor: meta.color }}
                          data-icod-id={`src_pages_settingspage_tsx_d38b_${accent}`}>
                          {isSelected && (
                            <div
                              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/20"
                              data-icod-id={`src_pages_settingspage_tsx_2209_${accent}`}>
                              <Check
                                className="h-5 w-5 text-white"
                                data-icod-id={`src_pages_settingspage_tsx_60cc_${accent}`} />
                            </div>
                          )}
                        </div>
                        <span
                          className="text-xs font-medium text-foreground"
                          data-icod-id={`src_pages_settingspage_tsx_101d_${accent}`}>
                          {meta.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4" data-icod-id="src_pages_settingspage_tsx_f3dc">
                  <SaveIndicator
                    saving={saving}
                    error={saveError}
                    data-icod-id="src_pages_settingspage_tsx_4e07" />
                </div>
              </div>
            </Card>
          )}

          {activeSection === 'users' && isAdmin && (
            <div
              className="flex flex-col gap-4"
              data-icod-id="src_pages_settingspage_tsx_895a">
              <div
                className="flex items-center justify-between"
                data-icod-id="src_pages_settingspage_tsx_c893">
                <div data-icod-id="src_pages_settingspage_tsx_b41d">
                  <h2
                    className="text-md font-semibold text-foreground"
                    data-icod-id="src_pages_settingspage_tsx_a3d8">Users</h2>
                  <p
                    className="mt-1 text-sm text-muted-foreground"
                    data-icod-id="src_pages_settingspage_tsx_b753">
                    Manage who has access to AD Smartsheet
                  </p>
                </div>
                <Button
                  variant="primary"
                  onClick={() => setInviteOpen(true)}
                  data-icod-id="src_pages_settingspage_tsx_e1c3">
                  Invite user
                </Button>
              </div>
              <Tabs
                tabs={adminTabs}
                activeTab={adminActiveTab}
                onChange={setAdminActiveTab}
                className="mt-1 mb-2"
                data-icod-id="src_pages_settingspage_tsx_6633" />
              {adminActiveTab === 'users' && <UsersTab data-icod-id="src_pages_settingspage_tsx_9f25" />}
              {adminActiveTab === 'invitations' && <InvitationsTab
                onInvite={() => setInviteOpen(true)}
                data-icod-id="src_pages_settingspage_tsx_f08a" />}
              <InviteModal
                open={inviteOpen}
                onClose={handleCloseInvite}
                data-icod-id="src_pages_settingspage_tsx_8907" />
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
