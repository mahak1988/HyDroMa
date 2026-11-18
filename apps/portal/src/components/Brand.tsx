import { useSite } from "../content/useContent";

/** Brand mark — authored SVG (no third-party assets). */
export function BrandMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <linearGradient id="eco-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--success)" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#eco-mark)" />
      <path d="M10 29c7 0 12-4 14-12 1-4 3-6 6-7" stroke="white" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <circle cx="10" cy="29" r="2.6" fill="white" />
      <circle cx="26" cy="17" r="2.6" fill="white" opacity="0.9" />
    </svg>
  );
}

export function Brand() {
  const site = useSite();
  return (
    <span className="flex items-center gap-2.5">
      <BrandMark />
      <span className="leading-tight">
        <span className="block text-[0.95rem] font-semibold tracking-tight text-fg">{site.ui.brand}</span>
        <span className="block text-2xs text-fg-subtle">{site.ui.tagline}</span>
      </span>
    </span>
  );
}