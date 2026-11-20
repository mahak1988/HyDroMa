/**
 * MapLibre paint properties need concrete colours; CSS custom properties cannot
 * be used directly inside a WebGL style. Resolve the active theme tokens once
 * per map creation and fall back to the light palette when the document is
 * unavailable (SSR/tests).
 */
export type MapColors = {
  background: string;
  grid: string;
  primary: string;
  warning: string;
  info: string;
  success: string;
  border: string;
  canvas: string;
};

const FALLBACK: MapColors = {
  background: "#f7f2e9",
  grid: "#ded5c9",
  primary: "#5a3d50",
  warning: "#8a5a12",
  info: "#315f83",
  success: "#236b4a",
  border: "#ded5c9",
  canvas: "#f7f2e9",
};

export function resolveMapColors(): MapColors {
  if (typeof window === "undefined") return FALLBACK;
  const styles = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string): string => styles.getPropertyValue(name).trim() || fallback;
  return {
    background: read("--canvas", FALLBACK.background),
    grid: read("--border-strong", FALLBACK.grid),
    primary: read("--primary", FALLBACK.primary),
    warning: read("--warning", FALLBACK.warning),
    info: read("--info", FALLBACK.info),
    success: read("--success", FALLBACK.success),
    border: read("--border-strong", FALLBACK.border),
    canvas: read("--canvas", FALLBACK.canvas),
  };
}