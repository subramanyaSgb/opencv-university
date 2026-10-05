/**
 * A simple street scene (car + person) for "what can I do" vs "what can I understand".
 * `detect` overlays bounding boxes with their x, y, width, height.
 */
export function SceneSketch({ detect = false, caption }: { detect?: boolean; caption?: string }) {
  return (
    <figure className="vis scene">
      <svg viewBox="0 0 640 400" role="img" aria-label={detect ? "Scene with a car and a person, each inside a labelled detection box" : "Scene with a car and a person"}>
        <rect width="640" height="400" rx="12" className="sc-sky" />
        <rect y="300" width="640" height="100" className="sc-ground" />
        {/* car */}
        <g transform="translate(80 205)">
          <rect x="0" y="40" width="200" height="60" rx="14" fill="#2f63d6" />
          <path d="M40 40 L70 5 H140 L170 40 Z" fill="#2f63d6" />
          <path d="M55 38 L78 12 H102 V38 Z M110 38 V12 H134 L156 38 Z" fill="#cfe0ff" />
          <circle cx="50" cy="100" r="20" fill="#1c1f24" /><circle cx="150" cy="100" r="20" fill="#1c1f24" />
          <circle cx="50" cy="100" r="8" fill="#9aa4ae" /><circle cx="150" cy="100" r="8" fill="#9aa4ae" />
        </g>
        {/* person */}
        <g transform="translate(440 180)">
          <circle cx="40" cy="24" r="22" fill="#e8b48f" />
          <rect x="16" y="50" width="48" height="80" rx="16" fill="#e0473b" />
          <rect x="20" y="126" width="16" height="70" rx="7" fill="#33373d" />
          <rect x="44" y="126" width="16" height="70" rx="7" fill="#33373d" />
        </g>
        {detect && (
          <g className="sc-det">
            <rect x="72" y="200" width="216" height="134" rx="4" />
            <rect x="72" y="178" width="118" height="22" rx="3" className="sc-tag" />
            <text x="80" y="194">car · 1</text>
            <rect x="420" y="180" width="80" height="210" rx="4" />
            <rect x="420" y="158" width="198" height="22" rx="3" className="sc-tag" />
            <text x="428" y="174">person · x=420 y=180</text>
            <text x="504" y="210" className="sc-dim">w = 80</text>
            <text x="504" y="230" className="sc-dim">h = 210</text>
          </g>
        )}
      </svg>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
