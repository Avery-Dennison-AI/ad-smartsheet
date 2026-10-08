import { cn } from '@/utils/cn';

export interface SelectableCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
  name?: string;
  value?: string;
  className?: string;
}

export default function SelectableCard({
  icon,
  title,
  description,
  selected,
  onSelect,
  name,
  value,
  className,
}: SelectableCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
    }
  };

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      data-name={name}
      data-value={value}
      className={cn(
        'flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        selected
          ? 'border-primary bg-primary/5 ring-1 ring-primary'
          : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30',
        className,
      )}
      data-icod-id="src_components_ui_selectablecard_tsx_f4e1">
      <div
        className="flex items-center gap-2"
        data-icod-id="src_components_ui_selectablecard_tsx_8153">
        <span
          className={cn('h-4 w-4', selected ? 'text-primary' : 'text-muted-foreground')}
          data-icod-id="src_components_ui_selectablecard_tsx_abb0">
          {icon}
        </span>
        <span
          className="text-sm font-medium text-foreground"
          data-icod-id="src_components_ui_selectablecard_tsx_b1ae">{title}</span>
      </div>
      <p
        className="text-xs leading-snug text-muted-foreground"
        data-icod-id="src_components_ui_selectablecard_tsx_28ac">{description}</p>
    </button>
  );
}
