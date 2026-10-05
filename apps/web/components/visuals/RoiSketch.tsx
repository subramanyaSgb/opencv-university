/** Schematic camera view: a billet in the frame, with a dashed Region Of Interest around it. */
export function RoiSketch({ roi = true, caption }: { roi?: boolean; caption?: string }) {
  return (
    <figure className="vis roisk">
      <svg viewBox="0 0 420 220" role="img" aria-label={roi ? "Camera frame with a dashed region of interest around a steel billet" : "Camera frame showing a steel billet"}>
        <defs>
          <linearGradient id="billet" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#ffb347" />
            <stop offset="0.5" stopColor="#ff7a1a" />
            <stop offset="1" stopColor="#c2410c" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="420" height="220" rx="10" fill="#151a20" />
        <rect x="70" y="88" width="280" height="50" rx="6" fill="url(#billet)" />
        <text x="210" y="119" textAnchor="middle" fill="#3b1d06" fontSize="15" fontWeight="700" fontFamily="system-ui, sans-serif">STEEL BILLET</text>
        <text x="14" y="22" fill="#9fb3c8" fontSize="11" fontFamily="system-ui, sans-serif">camera view · entire image</text>
        {roi && (
          <>
            <rect x="120" y="70" width="180" height="86" rx="4" fill="none" stroke="#58a6ff" strokeWidth="2.5" strokeDasharray="8 6" />
            <rect x="120" y="50" width="44" height="18" rx="4" fill="#58a6ff" />
            <text x="142" y="63" textAnchor="middle" fill="#0f1419" fontSize="11" fontWeight="700" fontFamily="system-ui, sans-serif">ROI</text>
          </>
        )}
      </svg>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
