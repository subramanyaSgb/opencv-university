/** Small schematic drawings for Chapter 1.6. All are illustrations, not real camera images. */

/** An object drawn with length and width dimension lines. */
export function DimSketch({ name = "BILLET", length = "1200 mm", width = "150 mm", caption }: { name?: string; length?: string; width?: string; caption?: string }) {
  return (
    <figure className="vis sk">
      <svg viewBox="0 0 520 170" role="img" aria-label={`${name}, ${length} long and ${width} wide`}>
        <defs>
          <marker id="dim-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" className="ax-fill" /></marker>
          <linearGradient id="steel" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#b8c0c8" /><stop offset="1" stopColor="#7d8791" /></linearGradient>
        </defs>
        <line x1="40" y1="34" x2="440" y2="34" className="ax-line" markerStart="url(#dim-a)" markerEnd="url(#dim-a)" />
        <text x="240" y="24" textAnchor="middle" className="ax-label sz-strong">{length}</text>
        <rect x="40" y="56" width="400" height="70" rx="5" fill="url(#steel)" />
        <text x="240" y="98" textAnchor="middle" className="sk-name">{name}</text>
        <line x1="462" y1="56" x2="462" y2="126" className="ax-line" markerStart="url(#dim-a)" markerEnd="url(#dim-a)" />
        <text x="472" y="96" className="ax-label sz-strong">{width}</text>
      </svg>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

/** A conveyor with products passing under a camera; one product is defective. */
export function Conveyor({ caption, part = false }: { caption?: string; part?: boolean }) {
  return (
    <figure className="vis sk">
      <svg viewBox="0 0 560 200" role="img" aria-label={part ? "A part on a conveyor with its position marked" : "Products moving on a conveyor under a camera; one is defective"}>
        <rect x="150" y="10" width="60" height="34" rx="6" className="sk-cam" />
        <rect x="170" y="44" width="20" height="10" className="sk-cam" />
        <path d="M180 54 L120 150 L240 150 Z" className="sk-fov" />
        <rect x="10" y="150" width="540" height="18" rx="9" className="sk-belt" />
        {part ? (
          <>
            <rect x="300" y="108" width="90" height="42" rx="4" className="sk-box" transform="rotate(-15 345 129)" />
            <circle cx="345" cy="129" r="4" className="ax-dot" />
            <text x="345" y="96" textAnchor="middle" className="ax-pt">X = 530 mm · Y = 220 mm · 15°</text>
          </>
        ) : (
          [40, 140, 240, 340, 440].map((x, i) => (
            <rect key={x} x={x} y="118" width="60" height="32" rx="4" className={i === 3 ? "sk-box sk-bad" : "sk-box"} />
          ))
        )}
        <text x="520" y="190" textAnchor="end" className="ax-label">direction of travel →</text>
      </svg>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

/** A steel plate with a crack, boxed by the vision system. */
export function CrackSketch({ caption }: { caption?: string }) {
  return (
    <figure className="vis sk">
      <svg viewBox="0 0 520 220" role="img" aria-label="A steel plate with a crack inside a detection box">
        <rect x="20" y="20" width="480" height="180" rx="6" fill="#9aa4ae" />
        <path d="M150 110 L190 100 L230 112 L270 96 L310 104 L350 90" fill="none" stroke="#2b2f35" strokeWidth="4" strokeLinejoin="round" />
        <rect x="138" y="78" width="226" height="46" rx="3" fill="none" stroke="#e0473b" strokeWidth="3" />
        <rect x="138" y="56" width="212" height="22" rx="3" fill="#e0473b" />
        <text x="146" y="72" className="sk-tag">crack · length 120 mm</text>
      </svg>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

/** Two coloured objects found in a frame, with their centre coordinates. */
export function DetectSketch({ caption }: { caption?: string }) {
  return (
    <figure className="vis sk">
      <svg viewBox="0 0 640 360" role="img" aria-label="A red object at x 150 y 100 and a blue object at x 500 y 250, each in a box">
        <rect width="640" height="360" rx="10" className="sc-sky" />
        <circle cx="150" cy="100" r="34" fill="#e0473b" />
        <circle cx="500" cy="250" r="34" fill="#2f63d6" />
        <g className="sc-det">
          <rect x="110" y="60" width="80" height="80" rx="3" />
          <rect x="460" y="210" width="80" height="80" rx="3" />
          <rect x="110" y="38" width="170" height="22" rx="3" className="sc-tag" />
          <text x="118" y="54">1 · x=150 y=100</text>
          <rect x="460" y="188" width="170" height="22" rx="3" className="sc-tag" />
          <text x="468" y="204">2 · x=500 y=250</text>
        </g>
      </svg>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

/** One object in four frames, moving right, with the track drawn through it. */
export function TrackSketch({ caption }: { caption?: string }) {
  const xs = [70, 190, 310, 430];
  return (
    <figure className="vis sk">
      <svg viewBox="0 0 520 150" role="img" aria-label="An object detected in four frames, moving to the right">
        <rect width="520" height="150" rx="10" className="sc-sky" />
        <path d={`M${xs[0]} 80 L${xs[3]} 80`} stroke="#2fbf62" strokeWidth="3" strokeDasharray="8 6" />
        {xs.map((x, i) => (
          <g key={x}>
            <circle cx={x} cy="80" r="20" fill="#2f63d6" opacity={0.35 + i * 0.2} />
            <text x={x} y="130" textAnchor="middle" className="ax-label">frame {i + 1}</text>
          </g>
        ))}
        <path d="M470 80 L500 80 M490 72 L500 80 L490 88" stroke="#2fbf62" strokeWidth="3" fill="none" />
      </svg>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

/** A printed or stamped identification plate. */
export function LabelPlate({ text }: { text: string }) {
  return (
    <figure className="vis">
      <div className="label-plate">{text}</div>
    </figure>
  );
}
