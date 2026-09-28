import { useState } from 'react';
import { Check } from 'lucide-react';
import { PageContainer, PageHeader, Card, SaveIndicator, useToast } from '@/components/ui';
import { cn } from '@/utils/cn';
import { ACCENTS, applyAccent, getStoredAccent, type Accent } from '@/utils/theme';
import { updateUserPreferences } from '@/services/userService';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectCurrentUser, fetchMe } from '@/store/slices/authSlice';

const ACCENT_SWATCHES: Record<Accent, string> = {
  teal: '#14B8A6',
  blue: '#3B82F6',
  indigo: '#6366F1',
  purple: '#A855F7',
  rose: '#F43F5E',
  orange: '#F97316',
};

const ACCENT_LABELS: Record<Accent, string> = {
  teal: 'Teal',
  blue: 'Blue',
  indigo: 'Indigo',
  purple: 'Purple',
  rose: 'Rose',
  orange: 'Orange',
};

const sections = [
  { id: 'appearance', label: 'Appearance' },
] as const;

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const { addToast } = useToast();
  const [activeSection, setActiveSection] = useState<string>('appearance');
  const [currentAccent, setCurrentAccent] = useState<Accent>(getStoredAccent());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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

  return (
    <PageContainer data-icod-id="src_pages_settingspage_tsx_e2e1">
      <PageHeader
        title="Settings"
        description="Manage your preferences"
        data-icod-id="src_pages_settingspage_tsx_9d8a" />
      <div
        className="flex flex-col gap-8 lg:flex-row"
        data-icod-id="src_pages_settingspage_tsx_2d16">
        {/* Left sidebar nav */}
        <nav
          className="w-full shrink-0 lg:w-48 lg:sticky lg:top-6 lg:self-start"
          data-icod-id="src_pages_settingspage_tsx_dc80">
          <div
            className="flex flex-col gap-0.5"
            data-icod-id="src_pages_settingspage_tsx_53fb">
            {sections.map((section) => (
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
                        aria-label={`Select ${ACCENT_LABELS[accent]} accent`}
                        aria-pressed={isSelected}
                        data-icod-id={`src_pages_settingspage_tsx_455d_${accent}`}>
                        <div
                          className="relative flex h-12 w-12 items-center justify-center rounded-full"
                          style={{ backgroundColor: ACCENT_SWATCHES[accent] }}
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
                          {ACCENT_LABELS[accent]}
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
        </div>
      </div>
    </PageContainer>
  );
}
