import type { ReactNode } from "react";

/**
 * Chart primitives — dependency-free SVG.
 *
 * These live in `packages/ui` (not in an app) because the same visual language
 * is required by the scientific workspace, dashboards and reports. They are
 * deliberately dependency-free: a charting library would add hundreds of kB to
 * every app that only needs a sparkline.
 *
 * Accessibility contract: every chart renders an SVG for sighted users *and* a
 * text alternative (`<figcaption class="sr-only">` or an aria-label) so the same
 * information reaches assistive technology.
 */
const DEFAULT_W = 600;
const DEFAULT_H = 180;
const PAD = 8;

export type ChartScale = {
  min: number;
  max: number;
  x: (index: number) => number;
  y: (value: number) => number;
};

/**
 * Min/max of a series in a single pass.
 *
 * Deliberately not `Math.min(...values)`: the spread form throws
 * `RangeError: Maximum call stack size exceeded` once a series grows past the
 * engine's argument limit (measured: 150 000 points). Scientific series can
 * easily reach that size.
 *
 * Non-finite values are ignored for scaling and reported through `finiteCount`,
 * so the caller can decide whether to draw a gap or a caption.
 */
export function summarizeSeries(values: readonly number[]): {
  min: number;
  max: number;
  finiteCount: number;
  allFinite: boolean;
} {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let finiteCount = 0;

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    if (value < min) min = value;
    if (value > max) max = value;
    finiteCount += 1;
  }

  if (finiteCount === 0) return { min: 0, max: 0, finiteCount: 0, allFinite: false };
  return { min, max, finiteCount, allFinite: finiteCount === values.length };
}

export function scaleSeries(
  values: readonly number[],
  width = DEFAULT_W - PAD * 2,
  height = DEFAULT_H - PAD * 2,
): ChartScale {
  const { min, max } = summarizeSeries(values);
  const span = max - min || 1;

  return {
    min,
    max,
    x: (index: number) => PAD + (index / Math.max(1, values.length - 1)) * width,
    y: (value: number) => {
      // A constant series has no range: centre it instead of pinning it to the
      // baseline, which would read as "dropped to zero".
      if (max === min) return PAD + height / 2;
      return PAD + height - ((value - min) / span) * height;
    },
  };
}

type ChartPoint = { value: number; index: number };

/**
 * Build an SVG path from finite points only.
 *
 * A non-finite value breaks the line (a new `M`), which renders as a gap rather
 * than interpolating across missing data.
 */
function pointsPath(points: readonly ChartPoint[], scale: ChartScale): string {
  let path = "";
  let previousIndex = Number.NEGATIVE_INFINITY;

  for (const point of points) {
    const move = point.index !== previousIndex + 1;
    path += `${move ? "M" : "L"}${scale.x(point.index).toFixed(1)} ${scale.y(point.value).toFixed(1)} `;
    previousIndex = point.index;
  }

  return path.trim();
}

/** Accessible line chart with an optional uncertainty band. */
export function LineChart({
  data,
  unit,
  uncertaintyPct = 0,
  label,
  color = "var(--primary)",
  height = DEFAULT_H,
  summary,
}: {
  data: readonly number[];
  unit: string;
  uncertaintyPct?: number;
  label: string;
  color?: string;
  height?: number;
  /** Localised screen-reader summary; falls back to an English auto-summary. */
  summary?: string;
}) {
  const width = DEFAULT_W;
  const scale = scaleSeries(data, width - PAD * 2, height - PAD * 2);
  const baseline = height - PAD;

  const points: ChartPoint[] = [];
  for (let index = 0; index < data.length; index += 1) {
    const value = data[index];
    if (typeof value === "number" && Number.isFinite(value)) points.push({ value, index });
  }

  const { allFinite } = summarizeSeries(data);
  const line = pointsPath(points, scale);

  // An area fill is only meaningful over an unbroken series; with a gap it would
  // visually bridge missing data.
  const area =
    points.length > 1 && allFinite
      ? `${points.map((point, position) => `${position === 0 ? "M" : "L"}${scale.x(point.index).toFixed(1)} ${scale.y(point.value).toFixed(1)}`).join(" ")} L${scale.x(points[points.length - 1]!.index).toFixed(1)} ${baseline} L${scale.x(points[0]!.index).toFixed(1)} ${baseline} Z`
      : "";

  const finiteValues = points.map((point) => point.value);
  const bandTop = uncertaintyPct
    ? points
        .map(
          (point, position) =>
            `${position === 0 ? "M" : "L"}${scale.x(point.index).toFixed(1)} ${scale.y(point.value * (1 + uncertaintyPct / 100)).toFixed(1)}`,
        )
        .join(" ")
    : "";
  const bandBottom = uncertaintyPct
    ? [...points]
        .reverse()
        .map((point) => `L${scale.x(point.index).toFixed(1)} ${scale.y(point.value * (1 - uncertaintyPct / 100)).toFixed(1)}`)
        .join(" ")
    : "";

  const last = finiteValues.length > 0 ? finiteValues[finiteValues.length - 1]! : 0;
  const lastPoint = points.length > 0 ? points[points.length - 1]! : null;
  const first = finiteValues.length > 0 ? finiteValues[0]! : 0;

  const autoSummary =
    points.length === 0
      ? `${label}: no finite values.`
      : `${label}: ${points.length} of ${data.length} points, from ${first.toFixed(1)} to ${last.toFixed(1)} ${unit}${
          points.length === data.length ? "" : " (missing values skipped)"
        }${uncertaintyPct ? `, uncertainty ±${uncertaintyPct}%` : ""}.`;

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={`${label} (${unit})`}
        preserveAspectRatio="none"
      >
        {[0.25, 0.5, 0.75].map((fraction) => (
          <line
            key={fraction}
            x1={PAD}
            x2={width - PAD}
            y1={PAD + (height - PAD * 2) * fraction}
            y2={PAD + (height - PAD * 2) * fraction}
            stroke="var(--border)"
            strokeWidth="1"
          />
        ))}
        {area ? <path d={area} fill={color} fillOpacity="0.12" /> : null}
        {bandTop && bandBottom ? <path d={`${bandTop} ${bandBottom} Z`} fill={color} fillOpacity="0.14" /> : null}
        {line ? (
          <path d={line} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        ) : null}
        {lastPoint ? (
          <circle cx={scale.x(lastPoint.index)} cy={scale.y(lastPoint.value)} r="3.6" fill={color} />
        ) : null}
      </svg>
      <figcaption className="sr-only">{summary ?? autoSummary}</figcaption>
    </figure>
  );
}

/** Horizontal bar list — the compact form used in indicator panels. */
export function BarChart({
  items,
  color = "var(--primary)",
  formatValue,
}: {
  items: Array<{ label: string; value: number; unit: string; highlight?: boolean }>;
  color?: string;
  /** Optional localiser for the printed value (digits, separators). */
  formatValue?: (value: number) => string;
}) {
  const render = formatValue ?? ((value: number) => String(value));
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.label}>
          <div className="flex items-baseline justify-between gap-3 text-2xs">
            <span className="text-fg-muted">{item.label}</span>
            <span className="numeric font-medium text-fg">
              {render(item.value)} <span className="text-fg-subtle">{item.unit}</span>
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-pill bg-surface-3">
            <div
              className="h-full rounded-pill"
              style={{
                width: `${Math.round((item.value / max) * 100)}%`,
                background: item.highlight ? "var(--success)" : color,
                opacity: item.highlight ? 1 : 0.75,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Donut/proportion chart with an accessible table alternative. */
export function DonutChart({
  segments,
  size = 132,
  thickness = 16,
  label,
  centerLabel,
}: {
  segments: Array<{ label: string; value: number; color?: string }>;
  size?: number;
  thickness?: number;
  label: string;
  centerLabel?: string;
}) {
  const total = segments.reduce((sum, segment) => sum + Math.max(0, segment.value), 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth={thickness}
        />
        {segments.map((segment) => {
          const fraction = total > 0 ? Math.max(0, segment.value) / total : 0;
          const dash = fraction * circumference;
          const circle = (
            <circle
              key={segment.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color ?? "var(--primary)"}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
          offset += dash;
          return circle;
        })}
        {centerLabel ? (
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-fg text-sm font-semibold"
          >
            {centerLabel}
          </text>
        ) : null}
      </svg>
      <ul className="space-y-1 text-2xs">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center gap-2 text-fg-muted">
            <span
              aria-hidden="true"
              className="size-2 rounded-full"
              style={{ background: segment.color ?? "var(--primary)" }}
            />
            <span>{segment.label}</span>
            <span className="numeric text-fg">{segment.value.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Inline trend line for compact cards. */
export function Sparkline({
  data,
  color = "var(--primary)",
  width = 120,
  height = 32,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (data.length === 0) return null;
  const finite = data.filter((value) => Number.isFinite(value));
  if (finite.length === 0) return null;
  const scale = scaleSeries(data, width, height);
  const path = data
    .map((value, index) => ({ value, index }))
    .filter((point) => Number.isFinite(point.value))
    .map(
      (point, position) =>
        `${position === 0 ? "M" : "L"}${scale.x(point.index).toFixed(1)} ${scale.y(point.value).toFixed(1)}`,
    )
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true" className="shrink-0">
      <path d={path} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Chart legend — shared so every chart type labels itself the same way. */
export function ChartLegend({
  items,
  className,
}: {
  items: Array<{ label: string; color?: string; shape?: "circle" | "line" | "fill" }>;
  className?: string;
}) {
  return (
    <ul className={`flex flex-wrap items-center gap-3 text-2xs text-fg-muted ${className ?? ""}`}>
      {items.map((item) => {
        const color = item.color ?? "var(--primary)";
        if (item.shape === "line") {
          return (
            <li key={item.label} className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" style={{ backgroundColor: color, height: "2px", width: "1.1rem" }} />
              {item.label}
            </li>
          );
        }
        if (item.shape === "fill") {
          return (
            <li key={item.label} className="inline-flex items-center gap-1.5">
              <span
                aria-hidden="true"
                style={{ backgroundColor: color, opacity: 0.35, height: "0.7rem", width: "1.1rem", border: `1px solid ${color}` }}
              />
              {item.label}
            </li>
          );
        }
        return (
          <li key={item.label} className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" style={{ backgroundColor: color, height: "0.6rem", width: "0.6rem", borderRadius: "9999px" }} />
            {item.label}
          </li>
        );
      })}
    </ul>
  );
}

/** Panel frame shared by dashboard and report screens. */
export function Panel({
  title,
  subtitle,
  action,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
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
      {footer ? <div className="border-t border-border px-4 py-2.5">{footer}</div> : null}
    </section>
  );
}