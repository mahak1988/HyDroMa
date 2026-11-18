import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { Check, X } from "lucide-react";

/* ------------------------------- Dialog ------------------------------ */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const onBackdrop = (event: MouseEvent) => {
      if (event.target === dialog) onClose();
    };
    dialog.addEventListener("click", onBackdrop);
    return () => dialog.removeEventListener("click", onBackdrop);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-auto w-[min(100vw-2rem,560px)] max-h-[90dvh] overflow-hidden rounded-xl border border-border bg-surface p-0 text-fg shadow-e4"
    >
      <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div className="min-w-0 space-y-1">
          <h2 id={titleId} className="text-base font-semibold">
            {title}
          </h2>
          {description ? (
            <p id={descriptionId} className="text-xs text-fg-muted">
              {description}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-md p-1.5 text-fg-muted hover:bg-surface-2 hover:text-fg"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="max-h-[65dvh] overflow-y-auto px-5 py-4">{children}</div>
      {footer ? <div className="flex flex-wrap justify-end gap-2 border-t border-border bg-surface-2/50 px-5 py-3">{footer}</div> : null}
    </dialog>
  );
}

/* ------------------------------ Dropdown ----------------------------- */
export type MenuItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
  selected?: boolean;
};

export function Dropdown({
  label,
  items,
  trigger,
  align = "end",
}: {
  label: string;
  items: MenuItem[];
  trigger: ReactNode;
  align?: "start" | "end";
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const move = (from: number, delta: number) => {
    const enabled = items.map((item, index) => (item.disabled ? -1 : index)).filter((index) => index >= 0);
    if (enabled.length === 0) return;
    const current = enabled.indexOf(from);
    const next = enabled[(current + delta + enabled.length) % enabled.length];
    itemRefs.current[next ?? 0]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      move(0, 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      move(items.length - 1, -1);
    } else if (event.key === "Home") {
      event.preventDefault();
      move(0, 0);
    } else if (event.key === "End") {
      event.preventDefault();
      move(items.length - 1, 0);
    }
  };

  return (
    <div ref={rootRef} className="relative" onKeyDown={onKeyDown}>
      <div className="contents" onClick={() => setOpen((value) => !value)}>
        {trigger}
      </div>
      {open ? (
        <div
          role="menu"
          aria-label={label}
          className="absolute top-[calc(100%+0.375rem)] z-[var(--z-overlay)] min-w-52 rounded-lg border border-border bg-surface p-1 shadow-e3"
          style={align === "end" ? { insetInlineEnd: 0 } : { insetInlineStart: 0 }}
        >
          {items.map((item, index) => (
            <button
              key={item.id}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                item.onSelect();
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-start text-sm transition-colors disabled:opacity-50 ${
                item.danger ? "text-danger hover:bg-danger-soft" : "text-fg hover:bg-surface-2"
              }`}
            >
              {item.icon}
              <span className="flex-1 truncate">{item.label}</span>
              {item.selected ? <Check className="size-3.5 text-primary" aria-hidden="true" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------- Tooltip ----------------------------- */
export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+0.375rem)] z-[var(--z-tooltip)] hidden whitespace-nowrap rounded-md bg-surface-inverse px-2 py-1 text-2xs text-canvas shadow-e2 group-hover:block group-focus-within:block"
      >
        {label}
      </span>
    </span>
  );
}