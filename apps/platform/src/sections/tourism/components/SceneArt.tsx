type ArtVariant = "village" | "nomadic" | "nature" | "farm" | "stay" | "event";

const PALETTES: Record<ArtVariant, [string, string, string]> = {
  village: ["var(--primary-soft)", "var(--primary)", "var(--green-300)"],
  nomadic: ["var(--warning-soft)", "var(--warning)", "var(--amber-700)"],
  nature: ["var(--success-soft)", "var(--success)", "var(--green-600)"],
  farm: ["var(--warning-soft)", "var(--success)", "var(--green-700)"],
  stay: ["var(--info-soft)", "var(--info)", "var(--blue-700)"],
  event: ["var(--primary-soft)", "var(--warning)", "var(--green-700)"],
};

const variantForSeed = (seed: number): ArtVariant => {
  const order: ArtVariant[] = ["village", "nomadic", "nature", "farm", "stay", "event"];
  return order[seed % order.length] ?? "nature";
};

/**
 * Authored vector landscape artwork. Original work, no photography and no
 * third-party asset: the licence is the project's own (see the execution report).
 */
export function SceneArt({
  seed,
  className,
  label,
  variant,
}: {
  seed: number;
  className?: string;
  label?: string;
  variant?: ArtVariant;
}) {
  const kind = variant ?? variantForSeed(seed);
  const [bg, mid, accent] = PALETTES[kind];
  const rotation = (seed * 41) % 360;
  const sunX = 120 + ((seed * 29) % 360);
  const sunY = 34 + ((seed * 17) % 40);

  return (
    <svg viewBox="0 0 320 200" role="img" aria-label={label ?? "Landscape illustration"} className={className}>
      <defs>
        <linearGradient id={`sky-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={bg} />
          <stop offset="100%" stopColor="var(--surface)" />
        </linearGradient>
        <linearGradient id={`ridge-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={mid} stopOpacity="0.9" />
          <stop offset="100%" stopColor={mid} stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id={`water-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.1" />
        </linearGradient>
      </defs>

      <rect width="320" height="200" rx="12" fill={`url(#sky-${seed})`} />
      <circle cx={sunX} cy={sunY} r="18" fill="var(--warning)" opacity="0.5" />
      <circle cx={sunX} cy={sunY} r="10" fill="var(--warning)" opacity="0.7" />

      {[0, 1, 2, 3].map((index) => (
        <path
          key={index}
          d={`M0 ${92 + index * 16} C 70 ${78 + index * 16}, 130 ${104 + index * 16}, 190 ${90 + index * 16} S 280 ${78 + index * 16}, 320 ${94 + index * 16}`}
          fill="none"
          stroke="var(--border-strong)"
          strokeOpacity="0.45"
          strokeWidth="1"
        />
      ))}

      <g transform={`rotate(${(rotation % 12) - 6} 160 120)`}>
        <path d="M0 150 L52 112 L96 138 L150 96 L206 136 L258 108 L320 146 L320 200 L0 200 Z" fill={`url(#ridge-${seed})`} />
        <path d="M0 172 L46 146 L92 168 L144 138 L196 168 L252 142 L320 170 L320 200 L0 200 Z" fill={accent} fillOpacity="0.45" />
      </g>

      <path d="M0 186 C 60 176, 120 196, 180 186 S 280 176, 320 188 L320 200 L0 200 Z" fill={`url(#water-${seed})`} />

      {kind === "nomadic" || kind === "event" ? (
        <g transform="translate(232 146)" opacity="0.85">
          <path d="M0 18 L16 0 L32 18 Z" fill="var(--warning)" opacity="0.75" />
          <path d="M16 0 L16 18" stroke="var(--surface)" strokeWidth="1.2" strokeOpacity="0.6" />
        </g>
      ) : null}

      {kind === "village" || kind === "farm" ? (
        <g opacity="0.8">
          {[54, 74, 94].map((x) => (
            <rect key={x} x={x} y={150} width="14" height="16" rx="1.5" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="0.8" />
          ))}
          <path d="M54 150 L61 143 L68 150 Z" fill="var(--warning)" opacity="0.8" />
          <path d="M74 150 L81 143 L88 150 Z" fill="var(--warning)" opacity="0.8" />
          <path d="M94 150 L101 143 L108 150 Z" fill="var(--warning)" opacity="0.8" />
        </g>
      ) : null}

      {[24, 36, 48, 270, 282, 294].map((x, index) => (
        <g key={x} transform={`translate(${x} ${168 - (index % 2) * 8})`} opacity="0.7">
          <rect x="-1" y="0" width="2" height="10" fill="var(--primary-soft-fg)" />
          <circle cx="0" cy="-2" r="5.5" fill="var(--primary-soft-fg)" opacity="0.8" />
        </g>
      ))}
    </svg>
  );
}