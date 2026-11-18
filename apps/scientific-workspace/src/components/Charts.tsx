import type { ReactNode } from "react";

const W = 600;
const H = 180;
const PAD = 8;

function scale(values: number[], width = W - PAD * 2, height = H - PAD * 2) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return {
    min,
    max,
    x: (index: number) => PAD + (index / Math.max(1, values.length - 1)) * width,
    y: (value: number) => PAD + height - ((value - min) / span) * height,
  };
}

/** Accessible line chart: SVG for sighted users, a text summary for assistive technology. */
export function LineChart({
  data,
  unit,
  uncertaintyPct = 0,
  label,
}: {
  data: number[];
  unit: string;
  uncertaintyPct?: number;
  label: string;
}) {
  const s = scale(data);
  const line = data.map((value, index) => `${index === 0 ? "M" : "L"}${s.x(index).toFixed(1)} ${s.y(value).toFixed(1)}`).join(" ");
  const area = `${line} L${s.x(data.length - 1).toFixed(1)} ${(H - PAD).toFixed(1)} L${s.x(0).toFixed(1)} ${(H - PAD).toFixed(1)} Z`;
  const band = uncertaintyPct
    ? data
        .map((value, index) => `L${s.x(index).toFixed(1)} ${s.y(Math.min(s.max, value * (1 + uncertaintyPct / 100))).toFixed(1)}`)
        .join(" ")
        .replace(/^L/, "M")
    : "";
  const bandBack = uncertaintyPct
    ? [...data]
        .reverse()
        .map((value, index) => {
          const original = data.length - 1 - index;
          return `L${s.x(original).toFixed(1)} ${s.y(Math.max(s.min, value * (1 - uncertaintyPct / 100))).toFixed(1)}`;
        })
        .join(" ")
    : "";
  const last = data[data.length - 1] ?? 0;

  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`${label} (${unit})`}>
        {[0.25, 0.5, 0.75].map((fraction) => (
          <line
            key={fraction}
            x1={PAD}
            x2={W - PAD}
            y1={PAD + (H - PAD * 2) * fraction}
            y2={PAD + (H - PAD * 2) * fraction}
            stroke="var(--border)"
            strokeWidth="1"
          />
        ))}
        <path d={area} fill="var(--primary)" fillOpacity="0.12" />
        {band ? <path d={`${band} ${bandBack} Z`} fill="var(--primary)" fillOpacity="0.14" /> : null}
        <path d={line} fill="none" stroke="var(--primary)" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx={s.x(data.length - 1)} cy={s.y(last)} r="3.6" fill="var(--primary)" />
      </svg>
      <figcaption className="sr-only">
        {label}: {data.length} points, from {data[0]?.toFixed(1)} to {last.toFixed(1)} {unit}.
      </figcaption>
    </figure>
  );
}

export function BarChart({ items }: { items: Array<{ label: string; value: number; unit: string; highlight?: boolean }> }) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.label}>
          <div className="flex items-baseline justify-between gap-3 text-2xs">
            <span className="text-fg-muted">{item.label}</span>
            <span className="numeric font-medium text-fg">
              {item.value.toLocaleString()} <span className="text-fg-subtle">{item.unit}</span>
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-pill bg-surface-3">
            <div
              className="h-full rounded-pill"
              style={{
                width: `${Math.round((item.value / max) * 100)}%`,
                background: item.highlight ? "var(--success)" : "var(--primary)",
                opacity: item.highlight ? 1 : 0.75,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Sparkline({ data }: { data: number[] }) {
  const s = scale(data, 120, 32);
  const line = data.map((value, index) => `${index === 0 ? "M" : "L"}${s.x(index).toFixed(1)} ${s.y(value).toFixed(1)}`).join(" ");
  return (
    <svg viewBox="0 0 120 32" className="h-8 w-28" aria-hidden="true">
      <path d={line} fill="none" stroke="var(--primary)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function Panel({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-surface shadow-e1">
      <header className="flex flex-wrap items-start justify-between gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-fg">{title}</h2>
          {subtitle ? <p className="text-2xs text-fg-muted">{subtitle}</p> : null}
        </div>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}