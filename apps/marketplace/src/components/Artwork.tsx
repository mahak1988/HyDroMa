/** Deterministic, authored product artwork (no photography, no external assets). */
export function ProductArt({ seed, className }: { seed: number; className?: string }) {
  const palettes = [
    ["var(--primary-soft)", "var(--success)", "var(--green-300)"],
    ["var(--warning-soft)", "var(--warning)", "var(--amber-700)"],
    ["var(--info-soft)", "var(--info)", "var(--blue-700)"],
    ["var(--success-soft)", "var(--success)", "var(--green-600)"],
  ];
  const [bg, mid, accent] = palettes[seed % palettes.length] ?? palettes[0]!;
  const rotation = (seed * 37) % 360;
  const circles = Array.from({ length: 3 }, (_, index) => ({
    cx: 40 + ((seed * (13 + index * 7)) % 120),
    cy: 40 + ((seed * (17 + index * 5)) % 80),
    r: 10 + ((seed + index * 9) % 22),
  }));

  return (
    <svg viewBox="0 0 200 140" role="img" aria-label="Product artwork" className={className}>
      <defs>
        <linearGradient id={`pa-${seed}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={bg} />
          <stop offset="100%" stopColor="var(--surface)" />
        </linearGradient>
      </defs>
      <rect width="200" height="140" rx="10" fill={`url(#pa-${seed})`} />
      <g transform={`rotate(${rotation} 100 70)`} opacity="0.9">
        <path d="M0 104 L46 62 L86 92 L128 48 L168 84 L200 66 L200 140 L0 140 Z" fill={mid} fillOpacity="0.55" />
        <path d="M0 120 L52 92 L96 114 L140 84 L176 106 L200 96 L200 140 L0 140 Z" fill={accent} fillOpacity="0.5" />
      </g>
      {circles.map((circle, index) => (
        <circle key={index} cx={circle.cx} cy={circle.cy} r={circle.r} fill={mid} fillOpacity={0.18 + index * 0.08} />
      ))}
      <circle cx="158" cy="34" r="14" fill="var(--warning)" opacity="0.5" />
    </svg>
  );
}