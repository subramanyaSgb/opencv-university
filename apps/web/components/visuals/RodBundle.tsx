/** Schematic camera view of a rod bundle (end view of bars), used in Chapter 1.1. Not a real photo. */
export function RodBundle({ caption }: { caption?: string }) {
  const rods = Array.from({ length: 26 }, (_, i) => i);
  return (
    <figure className="vis rods">
      <svg viewBox="0 0 420 150" role="img" aria-label="Schematic camera view of a bundle of steel rods">
        <defs>
          <linearGradient id="rod" x1="0" x2="1">
            <stop offset="0" stopColor="#6b7480" />
            <stop offset="0.45" stopColor="#e3e7ec" />
            <stop offset="1" stopColor="#59616b" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="420" height="150" rx="8" fill="#151a20" />
        {rods.map((i) => (
          <rect key={i} x={18 + i * 15} y={28} width={10} height={106} rx={4} fill="url(#rod)" />
        ))}
        <rect x="6" y="6" width="408" height="138" rx="6" fill="none" stroke="#3a8bff" strokeDasharray="6 5" strokeWidth="1.5" />
        <text x="16" y="21" fill="#9fb3c8" fontSize="10" fontFamily="system-ui, sans-serif">camera view</text>
      </svg>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
