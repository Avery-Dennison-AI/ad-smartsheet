import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Accent } from '@/utils/theme';

export interface ThemeOptionCardProps {
  accent: Accent;
  label: string;
  primaryColor: string;
  selected: boolean;
  onSelect: () => void;
}

/** Selectable card with color preview swatch and checkmark for accent selection. */
export default function ThemeOptionCard({
  label,
  primaryColor,
  selected,
  onSelect,
}: ThemeOptionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'cursor-pointer rounded-lg border-2 p-3 flex flex-col gap-2 transition-colors',
        selected
          ? 'border-[var(--primary)] bg-[var(--primary-light)]'
          : 'border-[var(--border)] hover:border-[var(--border-strong)]',
      )}
      aria-pressed={selected}
      data-icod-id="theme_option_card">
      <div
        className="shrink-0"
        style={{
          backgroundColor: primaryColor,
          width: 32,
          height: 32,
          borderRadius: 6,
        }}
        data-icod-id="theme_option_swatch" />
      <span
        className="text-sm font-medium text-[var(--text)]"
        data-icod-id="theme_option_label">{label}</span>
      {selected && (
        <CheckCircle2
          className="h-4 w-4 text-[var(--primary)]"
          data-icod-id="theme_option_check" />
      )}
    </button>
  );
}
