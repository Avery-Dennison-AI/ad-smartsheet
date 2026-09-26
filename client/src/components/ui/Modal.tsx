import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import Button from './Button';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * Centred overlay dialog with focus trapping.
 * Closes on Escape and backdrop click. Scroll lock built in.
 */
export default function Modal({
  open,
  onClose,
  title,
  footer,
  className,
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();

      // Focus trap
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';

    // Auto-focus first focusable element
    requestAnimationFrame(() => {
      if (dialogRef.current) {
        const firstFocusable = dialogRef.current.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        firstFocusable?.focus();
      }
    });

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      data-icod-id="src_components_ui_modal_tsx_f869">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
        data-icod-id="src_components_ui_modal_tsx_4a38" />
      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative flex w-full max-w-lg flex-col gap-4 rounded-[var(--radius-lg)] border border-border',
          'bg-card p-6 text-card-foreground shadow-[var(--shadow-md)]',
          'animate-in fade-in zoom-in-95 duration-200',
          className,
        )}
        data-icod-id="src_components_ui_modal_tsx_77d7">
        {title && (
          <div
            className="flex items-center justify-between"
            data-icod-id="src_components_ui_modal_tsx_7fac">
            <h2
              className="text-[var(--text-md)] font-semibold"
              data-icod-id="src_components_ui_modal_tsx_f42f">{title}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Close"
              className="!h-7 !w-7 !p-0"
              data-icod-id="src_components_ui_modal_tsx_99a2">
              <X className="h-4 w-4" data-icod-id="src_components_ui_modal_tsx_f248" />
            </Button>
          </div>
        )}
        <div className="text-sm" data-icod-id="src_components_ui_modal_tsx_c3c4">{children}</div>
        {footer && <div
          className="flex justify-end gap-3 pt-1"
          data-icod-id="src_components_ui_modal_tsx_d6f1">{footer}</div>}
      </div>
    </div>
  );
}
