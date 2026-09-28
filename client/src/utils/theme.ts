export const ACCENT_KEY = 'ads_accent';
export const ACCENTS = ['teal', 'blue', 'indigo', 'purple', 'rose', 'orange'] as const;
export type Accent = typeof ACCENTS[number];

/** Applies the given accent to the document and persists it in localStorage. */
export function applyAccent(accent: Accent): void {
  document.documentElement.setAttribute('data-accent', accent);
  localStorage.setItem(ACCENT_KEY, accent);
}

/** Returns the stored accent from localStorage, defaulting to 'teal'. */
export function getStoredAccent(): Accent {
  const stored = localStorage.getItem(ACCENT_KEY);
  return (ACCENTS.includes(stored as Accent) ? stored : 'teal') as Accent;
}
