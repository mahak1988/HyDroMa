/** Authored landscape artwork: layered ridgelines, sun and contour lines.
 *  Everything is SVG/CSS from the design tokens — no photography, no external assets. */
export function LandscapeArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 720 480" role="img" aria-label="Landscape illustration" className={className}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary-soft)" />
          <stop offset="100%" stopColor="var(--surface)" />
        </linearGradient>
        <linearGradient id="ridge-a" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.85" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id="ridge-b" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand-accent)" stopOpacity="0.72" />
          <stop offset="100%" stopColor="var(--brand-accent)" stopOpacity="0.34" />
        </linearGradient>
        <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand-slate)" stopOpacity="0.32" />
          <stop offset="100%" stopColor="var(--brand-slate)" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      <style>{`
        @keyframes portal-drift-sky { 0%,100% { transform: translateX(0); } 50% { transform: translateX(8px); } }
        @keyframes portal-drift-range { 0%,100% { transform: translateX(0); } 50% { transform: translateX(16px); } }
        @keyframes portal-drift-hills { 0%,100% { transform: translateX(0); } 50% { transform: translateX(28px); } }
        @keyframes portal-drift-trees { 0%,100% { transform: translateX(0); } 50% { transform: translateX(40px); } }
        @keyframes portal-drift-grass { 0%,100% { transform: translateX(0); } 50% { transform: translateX(60px); } }
        .portal-layer { will-change: transform; }
        @media (prefers-reduced-motion: reduce) { .portal-layer { animation: none !important; } }
      `}</style>

      <rect width="720" height="480" rx="24" fill="url(#sky)" className="portal-layer" style={{ animation: "portal-drift-sky 12s ease-in-out infinite" }} />
      <circle cx="560" cy="120" r="46" fill="var(--brand-champagne)" opacity="0.5" />
      <circle cx="560" cy="120" r="26" fill="var(--brand-secondary)" opacity="0.55" />

      {/* contour lines */}
      {[0, 1, 2, 3, 4].map((index) => (
        <path
          key={index}
          d={`M0 ${180 + index * 26} C 140 ${150 + index * 26}, 260 ${210 + index * 26}, 400 ${186 + index * 26} S 620 ${150 + index * 26}, 720 ${182 + index * 26}`}
          fill="none"
          stroke="var(--border-strong)"
          strokeOpacity="0.55"
          strokeWidth="1"
        />
      ))}

      {/* deep range (far) */}
      <path d="M0 260 L100 230 L200 260 L320 210 L440 250 L560 220 L720 260 L720 300 L0 300 Z" fill="var(--primary)" opacity="0.25" className="portal-layer" style={{ animation: "portal-drift-range 14s ease-in-out infinite" }} />

      {/* mid hills */}
      <path d="M0 300 L120 250 L220 286 L330 226 L440 276 L560 232 L720 292 L720 360 L0 360 Z" fill="url(#ridge-b)" className="portal-layer" style={{ animation: "portal-drift-hills 10s ease-in-out infinite" }} />

      {/* near ridge */}
      <path d="M0 350 L110 310 L210 340 L320 292 L430 336 L540 300 L720 348 L720 400 L0 400 Z" fill="url(#ridge-a)" className="portal-layer" style={{ animation: "portal-drift-trees 8s ease-in-out infinite" }} />

      {/* water */}
      <path d="M0 400 C 120 372, 240 420, 360 396 S 600 372, 720 404 L720 480 L0 480 Z" fill="url(#water)" />

      {/* river */}
      <path d="M330 300 C 350 340, 300 372, 336 404 S 300 444, 320 480" stroke="var(--brand-slate)" strokeWidth="6" strokeOpacity="0.5" fill="none" strokeLinecap="round" />

      {/* trees (foreground) */}
      {[90, 150, 210, 620, 660].map((x, index) => (
        <g key={x} transform={`translate(${x} ${360 - (index % 2) * 14})`} opacity="0.65" className="portal-layer" style={{ animation: "portal-drift-grass 6s ease-in-out infinite", transformOrigin: `${x}px ${360 - (index % 2) * 14}px` }}>
          <rect x="-1.5" y="0" width="3" height="14" fill="var(--primary-soft-fg)" />
          <circle cx="0" cy="-3" r="8" fill="var(--primary-soft-fg)" opacity="0.8" />
        </g>
      ))}
    </svg>
  );
}

/** Faint topographic pattern used behind hero sections. */
export function TopoPattern() {
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full opacity-[0.18]" preserveAspectRatio="none" viewBox="0 0 1200 600">
      {Array.from({ length: 9 }, (_, index) => (
        <path
          key={index}
          d={`M-50 ${40 + index * 62} C 200 ${10 + index * 62}, 420 ${90 + index * 62}, 640 ${54 + index * 62} S 1000 ${18 + index * 62}, 1250 ${62 + index * 62}`}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}
