/** Schematic drawings for Module 2 chapters 2.4 onward. Illustrations, not to scale unless stated. */
import { Camera, Fig } from "./Optics";

/** A camera above a flat area; its view forms a pyramid ending in the field-of-view rectangle. */
export function FovPyramid({ w = "519 mm", h = "435 mm", wd = "1000 mm", caption }: { w?: string; h?: string; wd?: string; caption?: string }) {
  return (
    <Fig vb="0 0 600 260" label={`A camera ${wd} above a surface sees a ${w} by ${h} rectangle`} caption={caption}>
      <defs><marker id="m2-dim" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" className="ax-fill" /></marker></defs>
      <polygon points="120,200 480,200 420,150 180,150" className="m2-fovrect" />
      <line x1="300" y1="48" x2="120" y2="200" className="ax-guide" />
      <line x1="300" y1="48" x2="480" y2="200" className="ax-guide" />
      <line x1="300" y1="48" x2="420" y2="150" className="ax-guide" />
      <line x1="300" y1="48" x2="180" y2="150" className="ax-guide" />
      <rect x="276" y="14" width="48" height="30" rx="5" className="sk-cam" />
      <line x1="120" y1="222" x2="480" y2="222" className="ax-line" markerStart="url(#m2-dim)" markerEnd="url(#m2-dim)" />
      <text x="300" y="244" textAnchor="middle" className="ax-label sz-strong">FOV width {w}</text>
      <text x="500" y="170" className="ax-label sz-strong">height {h}</text>
      <line x1="540" y1="48" x2="540" y2="146" className="ax-line" markerStart="url(#m2-dim)" markerEnd="url(#m2-dim)" />
      <text x="532" y="100" textAnchor="end" className="ax-label">WD {wd}</text>
    </Fig>
  );
}

/** Similar triangles from the lens: sensor width behind, field of view in front. */
export function FovTriangles({ caption }: { caption?: string }) {
  return (
    <Fig vb="0 0 600 220" label="Similar triangles: the sensor width over the focal length equals the field of view over the working distance" caption={caption}>
      <defs><marker id="m2-d2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" className="ax-fill" /></marker></defs>
      <line x1="40" y1="20" x2="40" y2="200" className="m2-obj" />
      <line x1="40" y1="20" x2="560" y2="140" className="ax-guide" />
      <line x1="40" y1="200" x2="560" y2="80" className="ax-guide" />
      <ellipse cx="480" cy="110" rx="7" ry="34" className="op-lens" />
      <line x1="560" y1="80" x2="560" y2="140" className="op-sensor" />
      <text x="30" y="114" textAnchor="end" className="ax-label sz-strong" transform="rotate(-90 30 114)">FOV</text>
      <text x="560" y="70" textAnchor="middle" className="ax-label sz-strong">sensor</text>
      <line x1="40" y1="212" x2="480" y2="212" className="ax-line" markerStart="url(#m2-d2)" markerEnd="url(#m2-d2)" />
      <text x="260" y="206" textAnchor="middle" className="ax-label">working distance WD</text>
      <line x1="480" y1="170" x2="560" y2="170" className="ax-line" markerStart="url(#m2-d2)" markerEnd="url(#m2-d2)" />
      <text x="520" y="164" textAnchor="middle" className="ax-label">≈ f</text>
    </Fig>
  );
}

/** An object whose top is above the calibration plane looks bigger: it is closer to the camera. */
export function HeightErrorSketch({ caption }: { caption?: string }) {
  return (
    <Fig vb="0 0 600 250" label="A billet whose top is above the calibration plane is closer to the camera, so it covers more pixels and reads longer" caption={caption}>
      <rect x="276" y="10" width="48" height="30" rx="5" className="sk-cam" />
      <line x1="300" y1="40" x2="150" y2="212" className="op-ray-b" />
      <line x1="300" y1="40" x2="450" y2="212" className="op-ray-b" />
      <line x1="300" y1="40" x2="165" y2="140" className="op-ray-a" />
      <line x1="300" y1="40" x2="435" y2="140" className="op-ray-a" />
      <line x1="40" y1="212" x2="560" y2="212" className="op-axis" />
      <text x="560" y="230" textAnchor="end" className="ax-label">calibration plane (where mm/px was measured)</text>
      <rect x="165" y="140" width="270" height="22" rx="4" fill="url(#op-steel)" />
      <text x="300" y="156" textAnchor="middle" className="op-onsteel">billet top, h higher</text>
      <text x="20" y="96" className="ax-label sz-strong">red: closer surface covers more pixels → reads too long</text>
    </Fig>
  );
}

/** A wide slab measured by two cameras, each looking at one edge. */
export function TwoCameraSlab({ caption }: { caption?: string }) {
  return (
    <Fig vb="0 0 600 220" label="A slab is measured by two cameras, each with a narrow field of view over one edge, at a known distance apart" caption={caption}>
      <defs><marker id="m2-d3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" className="ax-fill" /></marker></defs>
      {[110, 490].map((x) => (
        <g key={x}>
          <rect x={x - 22} y="14" width="44" height="28" rx="5" className="sk-cam" />
          <path d={`M${x} 42 L${x - 60} 150 L${x + 60} 150 Z`} className="sk-fov" />
        </g>
      ))}
      <rect x="100" y="150" width="400" height="30" rx="4" fill="url(#op-steel)" />
      <text x="300" y="170" textAnchor="middle" className="op-onsteel">SLAB ≈ 2000 mm</text>
      <line x1="110" y1="200" x2="490" y2="200" className="ax-line" markerStart="url(#m2-d3)" markerEnd="url(#m2-d3)" />
      <text x="300" y="214" textAnchor="middle" className="ax-label">camera spacing known from calibration</text>
      <text x="110" y="64" textAnchor="middle" className="ax-label">left edge</text>
      <text x="490" y="64" textAnchor="middle" className="ax-label">right edge</text>
    </Fig>
  );
}

export { Camera };

/** Rain-in-buckets analogy for photosites: different light gives different fill; one bucket overflows. */
export function BucketSketch({ caption }: { caption?: string }) {
  const levels = [0.15, 0.45, 0.8, 1.0];
  const labels = ["dark", "medium", "bright", "full (saturated)"];
  return (
    <Fig vb="0 0 600 230" label="Four buckets collect rain like four pixels collect light: little, medium, a lot, and one overflowing" caption={caption}>
      {levels.map((l, k) => {
        const x = 75 + k * 150;
        const drops = Math.round(l * 9) + 1;
        return (
          <g key={k}>
            {Array.from({ length: drops }, (_: unknown, d: number) => (
              <line key={d} x1={x - 30 + ((d * 17) % 60)} y1={14 + ((d * 23) % 40)} x2={x - 33 + ((d * 17) % 60)} y2={24 + ((d * 23) % 40)} className="m2-drop" />
            ))}
            <path d={`M${x - 40} 80 L${x - 34} 190 L${x + 34} 190 L${x + 40} 80`} className="m2-bucket" />
            <rect x={x - 37 + 3 * (1 - l)} y={190 - 108 * l} width={74 - 6 * (1 - l)} height={108 * l} className="m2-water" />
            {l >= 1 && <path d={`M${x + 40} 82 q12 20 4 60`} className="m2-spill" />}
            <text x={x} y="212" textAnchor="middle" className="ax-label sz-strong">{labels[k]}</text>
          </g>
        );
      })}
    </Fig>
  );
}

/** A shutter window on a time line, with the object moving while it is open. */
export function ExposureTimeline({ caption }: { caption?: string }) {
  return (
    <Fig vb="0 0 600 190" label="While the shutter is open the moving billet travels; its image is smeared over that distance" caption={caption}>
      <defs><marker id="m2-d4" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" className="ax-fill" /></marker></defs>
      <line x1="30" y1="40" x2="570" y2="40" className="ax-line" markerEnd="url(#m2-d4)" />
      <text x="570" y="30" textAnchor="end" className="ax-label">time</text>
      <rect x="180" y="26" width="240" height="28" rx="4" className="m2-shutter" />
      <text x="300" y="45" textAnchor="middle" className="ax-label sz-strong">shutter open (exposure)</text>
      {[0, 1, 2, 3, 4].map((k) => (
        <rect key={k} x={180 + k * 30} y="96" width="150" height="34" rx="4" fill="url(#op-steel)" opacity={k === 4 ? 1 : 0.28} />
      ))}
      <line x1="180" y1="150" x2="300" y2="150" className="ax-line" markerStart="url(#m2-d4)" markerEnd="url(#m2-d4)" />
      <text x="240" y="170" textAnchor="middle" className="ax-label sz-strong">travel = speed × exposure</text>
      <text x="450" y="118" className="ax-label">→ moving</text>
    </Fig>
  );
}

/** Continuous light vs a short strobe pulse inside a longer exposure. */
export function StrobeTimeline({ caption }: { caption?: string }) {
  return (
    <Fig vb="0 0 600 200" label="With continuous light the whole exposure collects light and motion; with a strobe only the short flash does" caption={caption}>
      <text x="20" y="40" className="ax-label sz-strong">Continuous light</text>
      <text x="265" y="42" textAnchor="middle" className="ax-label">exposure</text>
      <rect x="140" y="24" width="250" height="26" rx="4" className="m2-shutter" />
      <rect x="140" y="56" width="250" height="12" rx="3" className="m2-light" />
      <text x="400" y="66" className="ax-label">light all the time → long blur</text>
      <text x="20" y="130" className="ax-label sz-strong">Strobe</text>
      <text x="265" y="132" textAnchor="middle" className="ax-label">exposure</text>
      <rect x="140" y="114" width="250" height="26" rx="4" className="m2-shutter" />
      <rect x="255" y="146" width="22" height="12" rx="3" className="m2-light" />
      <text x="400" y="156" className="ax-label">short, bright flash → short blur</text>
      <text x="265" y="190" textAnchor="middle" className="ax-label">time →</text>
    </Fig>
  );
}

/** A Bayer colour filter array drawn as coloured cells, optionally with the value each pixel measured. */
export function BayerPattern({ pattern = "RGGB", rows = 4, cols = 4, values, caption }: { pattern?: string; rows?: number; cols?: number; values?: number[][]; caption?: string }) {
  const tint: Record<string, string> = { R: "#d8473b", G: "#2f9e4f", B: "#2f63d6" };
  return (
    <figure className="vis bayerpat">
      <div className="bp-grid" style={{ ["--cols" as string]: values ? values[0].length : cols }} role="img"
        aria-label={`${pattern} Bayer pattern${values ? " with measured values" : ""}`}>
        {Array.from({ length: (values ? values.length : rows) * (values ? values[0].length : cols) }, (_: unknown, k: number) => {
          const nc = values ? values[0].length : cols;
          const r = Math.floor(k / nc), c = k % nc;
          const ch = pattern[(r % 2) * 2 + (c % 2)];
          return <span key={k} className="bp-cell" style={{ background: tint[ch] }}>{values ? values[r][c] : ch}</span>;
        })}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

/** Row-by-row exposure windows: global shutter (all rows together) vs rolling shutter (staggered). */
export function ShutterRows({ caption }: { caption?: string }) {
  const rows = 6;
  const panel = (x0: number, title: string, stagger: boolean) => (
    <g>
      <text x={x0 + 120} y="18" textAnchor="middle" className="ax-label sz-strong">{title}</text>
      {Array.from({ length: rows }, (_: unknown, r: number) => (
        <g key={r}>
          <text x={x0} y={44 + r * 24} className="ax-origin">row {r + 1}</text>
          <rect x={x0 + 50 + (stagger ? r * 22 : 0)} y={32 + r * 24} width="110" height="16" rx="3" className="m2-shutter" />
        </g>
      ))}
      <text x={x0 + 160} y="196" textAnchor="middle" className="ax-label">time →</text>
    </g>
  );
  return (
    <Fig vb="0 0 620 205" label="Global shutter: all rows exposed in the same time window. Rolling shutter: each row's window starts a little later than the row above" caption={caption}>
      {panel(10, "Global shutter", false)}
      {panel(320, "Rolling shutter", true)}
    </Fig>
  );
}

/** A line-scan camera over a moving strip: the camera sees one thin line; the image grows as the strip moves. */
export function LineScanSketch({ caption }: { caption?: string }) {
  return (
    <Fig vb="0 0 620 230" label="A line-scan camera sees one thin line across a moving strip; successive lines stack up into an image" caption={caption}>
      <rect x="110" y="10" width="60" height="32" rx="6" className="sk-cam" />
      <path d="M140 42 L40 150 L240 150 Z" className="sk-fov" />
      <polygon points="20,140 260,140 300,190 60,190" fill="url(#op-steel)" />
      <line x1="40" y1="150" x2="250" y2="150" className="m2-scanline" />
      <text x="160" y="214" textAnchor="middle" className="ax-label">strip moves ↓ under the line</text>
      <text x="330" y="36" className="ax-label sz-strong">image builds up line by line</text>
      {Array.from({ length: 10 }, (_: unknown, k: number) => (
        <rect key={k} x="330" y={48 + k * 15} width="210" height="12" rx="2" className={k === 9 ? "m2-newline" : "m2-oldline"} />
      ))}
      <text x="546" y="191" className="ax-label">← newest</text>
    </Fig>
  );
}
