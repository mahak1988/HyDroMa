import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";

/* ------------------------------- Card ------------------------------- */
export function Card({
  children,
  className,
  as: Tag = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "article" | "div" | "aside";
}) {
  return (
    <Tag className={`rounded-lg border border-border bg-surface shadow-e1 ${className ?? ""}`}>
      {children}
    </Tag>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  id,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  id?: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
      <div className="min-w-0 space-y-1">
        <h2 id={id} className="truncate text-sm font-semibold text-fg">
          {title}
        </h2>
        {subtitle ? <p className="text-xs text-fg-muted">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`p-5 ${className ?? ""}`}>{children}</div>;
}

export function CardFooter({ children }: { children: ReactNode }) {
  return <div className="border-t border-border px-5 py-3">{children}</div>;
}

/* ------------------------------- Badge ------------------------------ */
type Tone = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-fg-muted",
  primary: "bg-primary-soft text-primary-soft-fg",
  success: "bg-success-soft text-success-soft-fg",
  warning: "bg-warning-soft text-warning-soft-fg",
  danger: "bg-danger-soft text-danger-soft-fg",
  info: "bg-info-soft text-info-soft-fg",
};

export function Badge({
  children,
  tone = "neutral",
  dot = false,
}: {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
}) {
  const dotColor: Record<Tone, string> = {
    neutral: "var(--fg-subtle)",
    primary: "var(--primary)",
    success: "var(--success)",
    warning: "var(--warning)",
    danger: "var(--danger)",
    info: "var(--info)",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill px-2 py-0.5 text-2xs font-medium ${tones[tone]}`}
    >
      {dot ? (
        <span aria-hidden="true" className="size-1.5 rounded-full" style={{ background: dotColor[tone] }} />
      ) : null}
      {children}
    </span>
  );
}

/* ------------------------------- Table ------------------------------ */
export function Table({
  children,
  caption,
}: {
  children: ReactNode;
  caption?: string;
}) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-border bg-surface-2/60 text-2xs uppercase tracking-wide text-fg-subtle">
      {children}
    </thead>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-border">{children}</tbody>;
}

export function Tr({ children, ...rest }: { children: ReactNode } & React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className="transition-colors hover:bg-surface-2/50" {...rest}>
      {children}
    </tr>
  );
}

export function Th({
  children,
  className,
  ...rest
}: { children: ReactNode } & ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th scope="col" className={`px-4 py-2.5 text-start font-medium ${className ?? ""}`} {...rest}>
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  ...rest
}: { children: ReactNode } & TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`px-4 py-2.5 text-start align-middle ${className ?? ""}`} {...rest}>
      {children}
    </td>
  );
}

/* ----------------------------- Skeleton ----------------------------- */
export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse rounded-md bg-surface-3 ${className ?? ""}`}
      style={{ animationDuration: "1.6s" }}
    />
  );
}

/* ---------------------------- Empty state --------------------------- */
export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-6 py-12 text-center">
      <p className="text-sm font-medium text-fg">{title}</p>
      {body ? <p className="max-w-sm text-xs text-fg-muted">{body}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

/* ------------------------------- Avatar ----------------------------- */
export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const initials = parts.map((part) => part.charAt(0).toUpperCase()).join("") || "?";
  return (
    <span
      role="img"
      aria-label={name}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary-soft-fg ${
        size === "sm" ? "size-7 text-2xs" : "size-9 text-xs"
      }`}
    >
      <span aria-hidden="true">{initials}</span>
    </span>
  );
}