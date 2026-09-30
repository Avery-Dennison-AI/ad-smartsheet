import { useState } from 'react';
import { SaveIndicator, useToast, ThemeOptionCard } from '@/components/ui';
import { ACCENTS, ACCENT_META, applyAccent, getStoredAccent, type Accent } from '@/utils/theme';
import { updateUserPreferences } from '@/services/userService';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectCurrentUser, fetchMe } from '@/store/slices/authSlice';

/** Appearance settings section — accent color picker. */
export default function AppearanceSection() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const { addToast } = useToast();
  const [currentAccent, setCurrentAccent] = useState<Accent>(getStoredAccent());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleAccentChange(accent: Accent) {
    setCurrentAccent(accent);
    applyAccent(accent);
    setSaveError(null);

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
    <div className="max-w-[720px]" data-icod-id="appearance_section">
      <h2
        className="text-lg font-semibold text-foreground"
        data-icod-id="appearance_heading">Accent color</h2>
      <p
        className="mt-1 text-sm text-muted-foreground"
        data-icod-id="appearance_desc">Choose your app's primary color.</p>

      <div
        className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-6"
        data-icod-id="appearance_grid">
        {ACCENTS.map((accent) => {
          const meta = ACCENT_META[accent];
          return (
            <ThemeOptionCard
              key={accent}
              accent={accent}
              label={meta.label}
              primaryColor={meta.color}
              selected={currentAccent === accent}
              onSelect={() => handleAccentChange(accent)}
              data-icod-id={`appearance_card_${accent}`} />
          );
        })}
      </div>

      <div className="mt-4" data-icod-id="appearance_save_indicator">
        <SaveIndicator
          saving={saving}
          error={saveError}
          data-icod-id="appearance_save" />
      </div>
    </div>
  );
}
