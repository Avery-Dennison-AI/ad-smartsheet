import { cn } from '@/utils/cn';

/** Maps color names to CSS variable-based background/foreground pairs. */
const PILL_COLORS: Record<string, { bg: string; text: string }> = {
  gray: { bg: 'bg-[var(--status-gray-bg)]', text: 'text-[var(--status-gray)]' },
  red: { bg: 'bg-[var(--status-red-bg)]', text: 'text-[var(--status-red)]' },
  yellow: { bg: 'bg-[var(--status-yellow-bg)]', text: 'text-[var(--status-yellow)]' },
  green: { bg: 'bg-[var(--status-green-bg)]', text: 'text-[var(--status-green)]' },
  blue: { bg: 'bg-[var(--status-blue-bg)]', text: 'text-[var(--status-blue)]' },
  purple: { bg: 'bg-[var(--status-purple-bg)]', text: 'text-[var(--status-purple)]' },
};

export interface PillProps {
  label: string;
  color: string;
  className?: string;
}

/** A small colored label with background tint and foreground text. */
export default function Pill({ label, color, className }: PillProps) {
  const colors = PILL_COLORS[color] || PILL_COLORS.gray;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium leading-tight',
        colors.bg,
        colors.text,
        className,
      )}
      data-icod-id="src_components_ui_pill_tsx_8561">
      {label}
    </span>
  );
}
