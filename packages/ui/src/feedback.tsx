import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

/* -------------------------------- Alert ------------------------------ */
type Tone = "info" | "success" | "warning" | "danger";

const alertStyles: Record<Tone, { box: string; icon: ReactNode }> = {
  info: {
    box: "border-info/25 bg-info-soft text-info-soft-fg",
    icon: <Info className="size-4" aria-hidden="true" />,
  },
  success: {
    box: "border-success/25 bg-success-soft text-success-soft-fg",
    icon: <CheckCircle2 className="size-4" aria-hidden="true" />,
  },
  warning: {
    box: "border-warning/25 bg-warning-soft text-warning-soft-fg",
    icon: <AlertTriangle className="size-4" aria-hidden="true" />,
  },
  danger: {
    box: "border-danger/25 bg-danger-soft text-danger-soft-fg",
    icon: <XCircle className="size-4" aria-hidden="true" />,
  },
};

export function Alert({
  tone = "info",
  title,
  children,
}: {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
}) {
  const style = alertStyles[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm ${style.box}`}>
      <span className="mt-0.5">{style.icon}</span>
      <div className="min-w-0 space-y-0.5">
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? <div className="text-xs opacity-90">{children}</div> : null}
      </div>
    </div>
  );
}

/* -------------------------------- Toast ------------------------------ */
type ToastTone = "info" | "success" | "warning" | "danger";
type ToastInput = { title: string; description?: string; tone?: ToastTone };
type ToastItem = ToastInput & { id: number };

type ToastContextValue = { push: (toast: ToastInput) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (toast: ToastInput) => {
      counter.current += 1;
      const id = counter.current;
      setToasts((current) => [...current, { ...toast, id }]);
      window.setTimeout(() => remove(id), 5000);
    },
    [remove],
  );

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 z-[var(--z-toast)] flex w-[min(100vw-2rem,22rem)] flex-col gap-2"
        style={{ insetInlineEnd: "1rem" }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className="rounded-lg border border-border bg-surface p-3 text-sm shadow-e3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-fg">{toast.title}</p>
                {toast.description ? <p className="mt-0.5 text-xs text-fg-muted">{toast.description}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => remove(toast.id)}
                aria-label="Dismiss"
                className="rounded-md p-1 text-fg-subtle hover:bg-surface-2 hover:text-fg"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext);
  if (!value) throw new Error("useToast must be used inside ToastProvider");
  return value;
}

export type { ToastInput, ToastTone };