import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface SaveIndicatorProps {
  saving: boolean;
  error: string | null;
  className?: string;
}

/** Shows "Saving..." with a spinner or "All changes saved" with a check icon. */
export default function SaveIndicator({ saving, error, className }: SaveIndicatorProps) {
  if (error) {
    return (
      <span
        className={cn('flex items-center gap-1 text-xs text-destructive', className)}
        data-icod-id="src_components_ui_saveindicator_tsx_71c8">
        <span
          className="truncate max-w-[200px]"
          data-icod-id="src_components_ui_saveindicator_tsx_6302">{error}</span>
      </span>
    );
  }

  if (saving) {
    return (
      <span
        className={cn('flex items-center gap-1 text-xs text-muted-foreground', className)}
        data-icod-id="src_components_ui_saveindicator_tsx_93c4">
        <Loader2
          className="h-3 w-3 animate-spin"
          data-icod-id="src_components_ui_saveindicator_tsx_49ab" />Saving…
              </span>
    );
  }

  return (
    <span
      className={cn('flex items-center gap-1 text-xs text-success', className)}
      data-icod-id="src_components_ui_saveindicator_tsx_501c">
      <Check
        className="h-3 w-3"
        data-icod-id="src_components_ui_saveindicator_tsx_81e0" />All changes saved
          </span>
  );
}
