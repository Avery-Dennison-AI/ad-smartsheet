export const ACCENT_KEY = 'ads_accent';
export const ACCENTS = ['avery', 'teal', 'blue', 'indigo', 'purple', 'rose', 'orange'] as const;
export type Accent = typeof ACCENTS[number];

/** Display metadata for each accent, used by SettingsPage. */
export const ACCENT_META: Record<Accent, { label: string; color: string }> = {
  avery: { label: 'Avery Dennison', color: '#D80024' },
  teal: { label: 'Teal', color: '#14B8A6' },
  blue: { label: 'Blue', color: '#3B82F6' },
  indigo: { label: 'Indigo', color: '#6366F1' },
  purple: { label: 'Purple', color: '#A855F7' },
  rose: { label: 'Rose', color: '#F43F5E' },
  orange: { label: 'Orange', color: '#F97316' },
};

/** Applies the given accent to the document and persists it in localStorage. */
export function applyAccent(accent: Accent): void {
  document.documentElement.setAttribute('data-accent', accent);
  localStorage.setItem(ACCENT_KEY, accent);
}

/** Returns the stored accent from localStorage, defaulting to 'avery'. */
export function getStoredAccent(): Accent {
  const stored = localStorage.getItem(ACCENT_KEY);
  return (ACCENTS.includes(stored as Accent) ? stored : 'avery') as Accent;
}
