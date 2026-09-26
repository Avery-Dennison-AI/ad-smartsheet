import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

export type AlertVariant = 'error' | 'success' | 'warning' | 'info';

const variantClass: Record<AlertVariant, string> = {
  error: 'border-destructive/30 bg-[var(--color-danger-bg)] text-destructive',
  success: 'border-success/30 bg-[var(--color-success-bg)] text-success',
  warning: 'border-warning/30 bg-[var(--color-warning-bg)] text-warning',
  info: 'border-border bg-[var(--color-info-bg)] text-[var(--color-info)]',
};

const icons: Record<AlertVariant, typeof Info> = {
  error: XCircle,
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
};

export interface AlertProps {
  variant?: AlertVariant;
  className?: string;
  children: ReactNode;
}

/** Inline status banner: form errors, save confirmations, empty-result notices. */
export default function Alert({ variant = 'error', className, children }: AlertProps) {
  const Icon = icons[variant];
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-sm',
        variantClass[variant],
        className,
      )}
      data-icod-id="src_components_ui_alert_tsx_55c5">
      <Icon
        className="mt-0.5 h-4 w-4 shrink-0"
        data-icod-id="src_components_ui_alert_tsx_2e90" />
      <div className="min-w-0" data-icod-id="src_components_ui_alert_tsx_5f6c">{children}</div>
    </div>
  );
}
