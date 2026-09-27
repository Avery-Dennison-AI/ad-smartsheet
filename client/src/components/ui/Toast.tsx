import { useState, useCallback, createContext, useContext, type ReactNode } from 'react';
import { CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastData {
  id: string;
  variant: ToastVariant;
  message: string;
}

interface ToastContextValue {
  addToast: (variant: ToastVariant, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/** Hook to trigger toasts. Must be used inside <ToastProvider>. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

const icons: Record<ToastVariant, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const variantClass: Record<ToastVariant, string> = {
  success: 'border-[var(--color-success)]/30 bg-[var(--color-success-bg)] text-[var(--color-success)]',
  error: 'border-destructive/30 bg-[var(--color-danger-bg)] text-destructive',
  info: 'border-border bg-[var(--color-info-bg)] text-[var(--color-info)]',
};

function ToastItem({ toast, onDismiss }: { toast: ToastData; onDismiss: (id: string) => void }) {
  const Icon = icons[toast.variant];
  return (
    <div
      role="alert"
      className={cn(
        'flex items-center gap-2 rounded-[var(--radius-md)] border px-4 py-3 text-sm shadow-[var(--shadow-md)]',
        'animate-[toast-in_0.3s_ease-out]',
        variantClass[toast.variant],
      )}
      onAnimationEnd={(e) => {
        // Auto-dismiss after animation completes + delay
        if (e.animationName === 'toast-in') {
          setTimeout(() => onDismiss(toast.id), 4000);
        }
      }}
      data-icod-id="src_components_ui_toast_tsx_05c0">
      <Icon
        className="h-4 w-4 shrink-0"
        data-icod-id="src_components_ui_toast_tsx_28bf" />
      <span className="flex-1" data-icod-id="src_components_ui_toast_tsx_c4e3">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="ml-2 opacity-60 hover:opacity-100 transition-opacity duration-150"
        aria-label="Dismiss"
        data-icod-id="src_components_ui_toast_tsx_571a">
        <XCircle className="h-3.5 w-3.5" data-icod-id="src_components_ui_toast_tsx_3a77" />
      </button>
    </div>
  );
}

/** Renders the toast stack in the top-right corner. */
export function ToastContainer({ toasts, onDismiss }: { toasts: ToastData[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div
      className="fixed right-4 top-4 flex flex-col gap-2 max-w-sm"
      style={{ zIndex: 'var(--z-toast)' }}
      data-icod-id="src_components_ui_toast_tsx_d2e2">
      {toasts.map((t) => (
        <ToastItem
          key={t.id}
          toast={t}
          onDismiss={onDismiss}
          data-icod-id={`src_components_ui_toast_tsx_c90f_${t.id}`} />
      ))}
    </div>
  );
}

/** Provider that manages toast state. Wrap your app root with this. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((variant: ToastVariant, message: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, variant, message }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
        data-icod-id="src_components_ui_toast_tsx_2bcd" />
    </ToastContext.Provider>
  );
}
