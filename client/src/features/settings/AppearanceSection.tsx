import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { ColorSwatchGroup } from '@/components/ui';
import type { ColorSwatchOption } from '@/components/ui';
import { ACCENTS, ACCENT_META, applyAccent, getStoredAccent, type Accent } from '@/utils/theme';
import { updateUserPreferences } from '@/services/userService';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectCurrentUser, fetchMe } from '@/store/slices/authSlice';

const swatchOptions: ColorSwatchOption[] = ACCENTS.map((accent) => ({
  value: accent,
  label: ACCENT_META[accent].label,
  primaryColor: ACCENT_META[accent].color,
}));

/** Appearance settings section — accent color picker. */
export default function AppearanceSection() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const [currentAccent, setCurrentAccent] = useState<Accent>(getStoredAccent());
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Fade out "Saved" indicator after 2 seconds
  useEffect(() => {
    if (saveStatus === 'saved') {
      const timer = setTimeout(() => setSaveStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  async function handleAccentChange(value: string) {
    const accent = value as Accent;
    setCurrentAccent(accent);
    applyAccent(accent);

    if (user) {
      setSaveStatus('saving');
      try {
        await updateUserPreferences({ accentColor: accent });
        await dispatch(fetchMe());
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    } else {
      setSaveStatus('saved');
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
      <div className="mt-6" data-icod-id="appearance_swatch_group">
        <ColorSwatchGroup
          options={swatchOptions}
          value={currentAccent}
          onChange={handleAccentChange}
          data-icod-id="appearance_swatches" />
      </div>
      {/* Inline save indicator */}
      <div className="mt-3 h-5" data-icod-id="appearance_save_indicator">
        {saveStatus === 'saving' && (
          <span className="text-xs text-muted-foreground" data-icod-id="appearance_saving">Saving...</span>
        )}
        {saveStatus === 'saved' && (
          <span className="flex items-center gap-1 text-xs text-success" data-icod-id="appearance_saved">
            <Check
              className="h-3 w-3"
              data-icod-id="src_features_settings_appearancesection_tsx_9447" /> Saved
          </span>
        )}
        {saveStatus === 'error' && (
          <span className="text-xs text-destructive" data-icod-id="appearance_error">Failed to save preference</span>
        )}
      </div>
    </div>
  );
}
