/** Lightweight static preview of the study area (the interactive map is lazy-loaded on /map). */
export function MiniMap({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 200" role="img" aria-label="Study area preview" className={className}>
      <defs>
        <linearGradient id="mini-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary-soft)" />
          <stop offset="100%" stopColor="var(--surface)" />
        </linearGradient>
      </defs>
      <rect width="400" height="200" rx="8" fill="url(#mini-bg)" />
      {Array.from({ length: 9 }, (_, index) => (
        <line key={`h${index}`} x1="12" x2="388" y1={18 + index * 20} y2={18 + index * 20} stroke="var(--border)" strokeWidth="1" />
      ))}
      {Array.from({ length: 12 }, (_, index) => (
        <line key={`v${index}`} x1={16 + index * 32} x2={16 + index * 32} y1="12" y2="188" stroke="var(--border)" strokeWidth="1" />
      ))}
      <path d="M64 148 L120 96 L186 126 L248 70 L318 118 L352 96 L352 168 L64 168 Z" fill="var(--primary)" fillOpacity="0.16" stroke="var(--primary)" strokeWidth="2" />
      {[
        [120, 116], [186, 140], [250, 96], [300, 132], [168, 88],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4" fill="var(--info)" stroke="white" strokeWidth="1.4" />
      ))}
    </svg>
  );
}