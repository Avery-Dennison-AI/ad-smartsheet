import { useEffect, useRef, type ReactNode } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import Button from './Button';

export type ModalSize = 'sm' | 'md' | 'lg';

const modalSizeClass: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-[560px]',
};

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
  /** Width preset. Default 'md'. */
  size?: ModalSize;
}

const FORM_FIELD_SELECTOR =
  'input:not([type="hidden"]), textarea, select';

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

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
  size = 'md',
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  // Stable ref to onClose so the keydown effect never re-runs when the
  // callback changes identity — prevents focus-stealing on every keystroke.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Auto-focus first form field (or fallback to first focusable) — runs ONLY when open transitions to true.
  useEffect(() => {
    if (!open) return;

    requestAnimationFrame(() => {
      if (dialogRef.current) {
        const firstField = dialogRef.current.querySelector<HTMLElement>(FORM_FIELD_SELECTOR);
        const target = firstField ?? dialogRef.current.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
        target?.focus();
      }
    });
  }, [open]);

  // Keydown listener (Escape + focus trap) — depends only on `open`.
  useEffect(() => {
    if (!open) return;

    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }

      // Focus trap
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
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

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 'var(--z-modal-overlay)' }}
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
          'relative flex w-full flex-col gap-4 rounded-[var(--radius-lg)] border border-border',
          'bg-card p-6 text-card-foreground shadow-[var(--shadow-md)]',
          'animate-in fade-in zoom-in-95 duration-200',
          modalSizeClass[size],
          className,
        )}
        style={{ zIndex: 'var(--z-modal)' }}
        data-icod-id="src_components_ui_modal_tsx_77d7">
        {title && (
          <div
            className="flex items-center justify-between"
            data-icod-id="src_components_ui_modal_tsx_7fac">
            <h2
              className="text-md font-semibold"
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
    </div>,
    document.body,
  );
}
