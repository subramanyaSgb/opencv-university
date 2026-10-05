/** Schematic optics drawings for Module 2. Illustrations, not to scale unless stated. */
import type { ReactNode } from "react";

function Fig({ label, caption, children, vb = "0 0 560 240" }: { label: string; caption?: string; children: ReactNode; vb?: string }) {
  return (
    <figure className="vis sk op">
      <svg viewBox={vb} role="img" aria-label={label}>
        <defs>
          <marker id="op-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" className="op-light-fill" /></marker>
          <marker id="op-arr-g" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" className="ax-fill" /></marker>
          <linearGradient id="op-steel" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#b8c0c8" /><stop offset="1" stopColor="#7d8791" /></linearGradient>
        </defs>
        {children}
      </svg>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

function Lamp({ x, y }: { x: number; y: number }) {
  return (
    <g>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <line key={a} x1={x + 22 * Math.cos((a * Math.PI) / 180)} y1={y + 22 * Math.sin((a * Math.PI) / 180)}
          x2={x + 32 * Math.cos((a * Math.PI) / 180)} y2={y + 32 * Math.sin((a * Math.PI) / 180)} className="op-sunray" />
      ))}
      <circle cx={x} cy={y} r="16" className="op-sun" />
    </g>
  );
}

function Camera({ x, y, flip = false }: { x: number; y: number; flip?: boolean }) {
  const s = flip ? -1 : 1;
  return (
    <g transform={`translate(${x} ${y}) scale(${s} 1)`}>
      <rect x="0" y="-22" width="62" height="44" rx="6" className="sk-cam" />
      <rect x="-14" y="-13" width="14" height="26" rx="3" className="sk-cam" />
      <rect x="10" y="-30" width="18" height="8" rx="2" className="sk-cam" />
    </g>
  );
}

function Eye({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-34 0 Q0 -26 34 0 Q0 26 -34 0 Z" className="op-eye" />
      <circle cx="-6" cy="0" r="11" className="op-iris" />
      <circle cx="-6" cy="0" r="5" className="op-pupil" />
    </g>
  );
}

/** Light leaves a source, hits an object, and part of it reflects into an eye or a camera. */
export function LightPath({ to = "camera", object = "BILLET", caption }: { to?: "camera" | "eye"; object?: string; caption?: string }) {
  return (
    <Fig label={`A light source shines on a ${object.toLowerCase()}; reflected light travels to the ${to}`} caption={caption}>
      <Lamp x={80} y={50} />
      <text x="80" y="104" textAnchor="middle" className="ax-label sz-strong">light source</text>
      {[0, 1, 2].map((i) => (
        <line key={i} x1={110 + i * 8} y1={66 + i * 6} x2={190 + i * 40} y2={168} className="op-light" markerEnd="url(#op-arr)" />
      ))}
      <rect x="160" y="172" width="200" height="46" rx="5" fill="url(#op-steel)" />
      <text x="260" y="201" textAnchor="middle" className="sk-name">{object}</text>
      {[0, 1].map((i) => (
        <line key={i} x1={300 + i * 30} y1={166} x2={440 - i * 4} y2={96 + i * 12} className="op-light op-refl" markerEnd="url(#op-arr)" />
      ))}
      <text x="392" y="168" className="ax-label">reflected light</text>
      {to === "camera" ? <Camera x={470} y={88} /> : <Eye x={480} y={92} />}
      <text x={to === "camera" ? 500 : 480} y="140" textAnchor="middle" className="ax-label sz-strong">{to}</text>
    </Fig>
  );
}

/** No optics: every scene point lights every sensor point, so the sensor sees a uniform mix. */
export function OpenSensor({ caption }: { caption?: string }) {
  const sensorY = [60, 90, 120, 150, 180];
  return (
    <Fig label="Without a pinhole or lens, light from the top and bottom of an object reaches every point on the sensor" caption={caption}>
      <line x1="60" y1="190" x2="60" y2="62" className="op-obj" />
      <path d="M52 66 L60 52 L68 66 Z" fill="#e0473b" />
      <circle cx="60" cy="190" r="6" fill="#2f63d6" />
      <text x="60" y="222" textAnchor="middle" className="ax-label sz-strong">object</text>
      {sensorY.map((y) => <line key={`a${y}`} x1="60" y1="58" x2="470" y2={y} className="op-ray-a op-thin" />)}
      {sensorY.map((y) => <line key={`b${y}`} x1="60" y1="190" x2="470" y2={y} className="op-ray-b op-thin" />)}
      <path d="M300 30 H490 V210 H300" className="op-box-open" />
      <line x1="470" y1="40" x2="470" y2="200" className="op-sensor" />
      <rect x="478" y="44" width="10" height="152" className="op-mix" />
      <text x="395" y="24" textAnchor="middle" className="ax-label sz-strong">open front: no pinhole, no lens</text>
      <text x="470" y="228" textAnchor="middle" className="ax-label sz-strong">sensor: a uniform mix</text>
    </Fig>
  );
}

/** Analogy: a wide opening lets cars go anywhere; a tiny gate allows one path per car. */
export function GateSketch({ caption }: { caption?: string }) {
  const cars = [40, 90, 140, 190, 240];
  const colors = ["#e0473b", "#2f63d6", "#e0a526", "#1a7f37", "#7d4cc2"];
  const panel = (dx: number, narrow: boolean) => (
    <g transform={`translate(${dx} 0)`}>
      <text x="140" y="22" textAnchor="middle" className="ax-label sz-strong">{narrow ? "Tiny gate" : "Huge opening"}</text>
      {cars.map((x, i) => <rect key={x} x={x - 14} y="40" width="28" height="18" rx="5" fill={colors[i]} />)}
      {narrow ? (
        <>
          <line x1="10" y1="120" x2="134" y2="120" className="op-wallg" />
          <line x1="146" y1="120" x2="270" y2="120" className="op-wallg" />
          {cars.map((x, i) => (
            <polyline key={x} points={`${x},60 140,120 ${280 - x},196`} fill="none" stroke={colors[i]} strokeWidth="2.2" markerEnd="url(#op-arr-g)" />
          ))}
        </>
      ) : (
        <>
          <line x1="4" y1="120" x2="14" y2="120" className="op-wallg" />
          <line x1="266" y1="120" x2="276" y2="120" className="op-wallg" />
          {cars.map((x, i) => [-30, 0, 30].map((dxx) => (
            <line key={`${x}${dxx}`} x1={x} y1="60" x2={x + dxx} y2="196" stroke={colors[i]} strokeWidth="1.6" opacity="0.7" markerEnd="url(#op-arr-g)" />
          )))}
        </>
      )}
      <text x="140" y="226" textAnchor="middle" className="ax-label">{narrow ? "one path per car" : "cars go everywhere"}</text>
    </g>
  );
  return (
    <Fig vb="0 0 600 240" label="Left: cars pass a huge opening in every direction. Right: a tiny gate lets each car through on only one path" caption={caption}>
      {panel(0, false)}
      {panel(310, true)}
    </Fig>
  );
}

/** Two identical rods at different distances: the far one covers a smaller angle, so it looks smaller. */
export function PerspectiveSketch({ caption }: { caption?: string }) {
  // Camera centre at (90,130). Rods 100 tall, centred on the axis, at 170 and 340 px away (2× the distance).
  const c = { x: 90, y: 130 };
  const rods = [{ x: 260, tag: "near" }, { x: 430, tag: "far (2× distance)" }];
  return (
    <Fig vb="0 0 680 260" label="A camera sees two identical rods; the one twice as far away appears half as tall in the image" caption={caption}>
      <Camera x={c.x - 14} y={c.y} flip />
      {rods.map((r, i) => (
        <g key={r.x}>
          <line x1={c.x} y1={c.y} x2={r.x} y2={c.y - 50} className={i ? "op-ray-b" : "op-ray-a"} />
          <line x1={c.x} y1={c.y} x2={r.x} y2={c.y + 50} className={i ? "op-ray-b" : "op-ray-a"} />
          <rect x={r.x - 8} y={c.y - 50} width="16" height="100" rx="3" fill="url(#op-steel)" />
          <text x={r.x} y={c.y + 74} textAnchor="middle" className="ax-label sz-strong">{r.tag}</text>
        </g>
      ))}
      <text x={c.x - 40} y={c.y + 74} textAnchor="middle" className="ax-label">camera</text>
      <rect x="515" y="40" width="150" height="180" rx="6" className="ax-img" />
      <text x="590" y="32" textAnchor="middle" className="ax-label sz-strong">in the image</text>
      <rect x="550" y="70" width="14" height="120" rx="3" fill="url(#op-steel)" />
      <rect x="616" y="100" width="7" height="60" rx="2" fill="url(#op-steel)" />
      <text x="557" y="208" textAnchor="middle" className="ax-label">near</text>
      <text x="620" y="208" textAnchor="middle" className="ax-label">far</text>
    </Fig>
  );
}

/** A sensor: a grid of light-sensitive elements receiving light. One element is highlighted. */
export function SensorGrid({ cols = 10, rows = 6, caption }: { cols?: number; rows?: number; caption?: string }) {
  const cell = 30, x0 = 130, y0 = 70;
  return (
    <Fig vb={`0 0 560 ${y0 + rows * cell + 40}`} label={`A camera sensor drawn as a ${rows} by ${cols} grid of light-sensitive elements`} caption={caption}>
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1={x0 + 30 + i * 60} y1="8" x2={x0 + 30 + i * 60} y2={y0 - 8} className="op-light" markerEnd="url(#op-arr)" />
      ))}
      <text x={x0 - 10} y="36" textAnchor="end" className="ax-label sz-strong">light</text>
      <rect x={x0 - 8} y={y0 - 8} width={cols * cell + 16} height={rows * cell + 16} rx="6" className="op-chip" />
      {Array.from({ length: rows * cols }, (_, k) => {
        const r = Math.floor(k / cols), c = k % cols;
        const on = r === 2 && c === 6;
        return <rect key={k} x={x0 + c * cell + 2} y={y0 + r * cell + 2} width={cell - 4} height={cell - 4} rx="3" className={on ? "op-site is-on" : "op-site"} />;
      })}
      <line x1={x0 + 6 * cell + 15} y1={y0 + 2 * cell + 15} x2="500" y2={y0 + rows * cell + 26} className="ax-guide" />
      <text x="500" y={y0 + rows * cell + 22} textAnchor="end" className="ax-label sz-strong">one light-sensitive element</text>
    </Fig>
  );
}

type ChainIcon = "world" | "light" | "lens" | "pinhole" | "sensor" | "electronics" | "image" | "numbers" | "code" | "measure" | "isp";

function Icon({ kind }: { kind: ChainIcon }) {
  switch (kind) {
    case "world": return <rect x="6" y="16" width="36" height="16" rx="3" fill="url(#op-steel)" />;
    case "light": return <g><circle cx="24" cy="24" r="9" className="op-sun" />{[0, 60, 120, 180, 240, 300].map((a) => <line key={a} x1={24 + 13 * Math.cos(a * Math.PI / 180)} y1={24 + 13 * Math.sin(a * Math.PI / 180)} x2={24 + 19 * Math.cos(a * Math.PI / 180)} y2={24 + 19 * Math.sin(a * Math.PI / 180)} className="op-sunray" />)}</g>;
    case "lens": return <path d="M24 4 Q36 24 24 44 Q12 24 24 4 Z" className="op-lens" />;
    case "pinhole": return <g><line x1="24" y1="4" x2="24" y2="21" className="op-wall" /><line x1="24" y1="27" x2="24" y2="44" className="op-wall" /></g>;
    case "sensor": return <g>{Array.from({ length: 9 }, (_, k) => <rect key={k} x={9 + (k % 3) * 11} y={9 + Math.floor(k / 3) * 11} width="9" height="9" rx="1.5" className="op-site" />)}</g>;
    case "electronics": return <g><rect x="12" y="12" width="24" height="24" rx="3" className="op-chipi" />{[16, 24, 32].map((p) => <g key={p}><line x1={p} y1="6" x2={p} y2="12" className="op-pin" /><line x1={p} y1="36" x2={p} y2="42" className="op-pin" /></g>)}</g>;
    case "isp": return <g><rect x="8" y="12" width="32" height="24" rx="4" className="op-chipi" /><text x="24" y="28" textAnchor="middle" className="op-icon-t">ISP</text></g>;
    case "image": return <g><rect x="6" y="9" width="36" height="30" rx="3" className="ax-img" /><path d="M10 35 L20 22 L27 30 L32 25 L39 35 Z" className="op-mtn" /></g>;
    case "numbers": return <text x="24" y="30" textAnchor="middle" className="op-icon-t">128</text>;
    case "code": return <text x="24" y="30" textAnchor="middle" className="op-icon-t">[ ]</text>;
    case "measure": return <g><rect x="4" y="18" width="40" height="12" rx="2" className="op-ruler" />{[10, 17, 24, 31, 38].map((p) => <line key={p} x1={p} y1="18" x2={p} y2={p % 14 === 10 ? 26 : 23} className="op-pin" />)}</g>;
  }
}

/** The journey from the real world to numbers, each step with a small icon. Wraps on phones. */
export function CameraChain({ steps, direction = "down", caption }:
  { steps: { icon: ChainIcon; label: string; note?: string }[]; direction?: "down" | "right"; caption?: string }) {
  return (
    <figure className={`vis cchain cchain-${direction}`}>
      <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
        <defs><linearGradient id="op-steel" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#b8c0c8" /><stop offset="1" stopColor="#7d8791" /></linearGradient></defs>
      </svg>
      <ol className="cchain-list">
        {steps.map((s, i) => (
          <li key={i} className="cchain-step">
            <svg viewBox="0 0 48 48" className="cchain-icon" aria-hidden="true"><Icon kind={s.icon} /></svg>
            <span className="cchain-text">
              <span className="cchain-label">{s.label}</span>
              {s.note && <span className="cchain-note">{s.note}</span>}
            </span>
          </li>
        ))}
      </ol>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

/* ===================== Chapter 2.2: lenses ===================== */

/** Many rays from one object point pass through a lens and meet again at one point on the sensor. */
export function LensRays({ caption }: { caption?: string }) {
  const ys = [-70, -35, 0, 35, 70];
  return (
    <Fig vb="0 0 600 240" label="Many rays from one object point pass through a lens and meet at one point on the sensor" caption={caption}>
      <line x1="20" y1="120" x2="590" y2="120" className="op-axis" />
      {ys.map((y) => (
        <g key={y}>
          <line x1="50" y1="120" x2="290" y2={120 + y} className="op-ray-a" />
          <line x1="290" y1={120 + y} x2="520" y2="120" className="op-ray-a" />
        </g>
      ))}
      <ellipse cx="290" cy="120" rx="12" ry="84" className="op-lens" />
      <line x1="520" y1="30" x2="520" y2="210" className="op-sensor" />
      <circle cx="50" cy="120" r="6" fill="#e0473b" />
      <circle cx="520" cy="120" r="5" className="ax-dot" />
      <text x="50" y="148" textAnchor="middle" className="ax-label sz-strong">object point</text>
      <text x="290" y="226" textAnchor="middle" className="ax-label sz-strong">lens</text>
      <text x="520" y="22" textAnchor="middle" className="ax-label sz-strong">sensor: one sharp point</text>
    </Fig>
  );
}

/** Analogy: uncontrolled traffic collides; a controller sends each stream to its own exit. */
export function ControllerSketch({ caption }: { caption?: string }) {
  const colors = ["#e0473b", "#2f63d6", "#e0a526", "#1a7f37"];
  const xs = [50, 105, 160, 215];
  return (
    <Fig vb="0 0 600 230" label="Left: cars without traffic control collide in the middle. Right: a controller sends each stream to its own place" caption={caption}>
      <text x="135" y="20" textAnchor="middle" className="ax-label sz-strong">No control</text>
      {xs.map((x, i) => <g key={x}><rect x={x - 12} y="34" width="24" height="16" rx="4" fill={colors[i]} /><line x1={x} y1="52" x2="135" y2="140" stroke={colors[i]} strokeWidth="2" /></g>)}
      <text x="135" y="160" textAnchor="middle" className="op-crash">✕ ✕ ✕</text>
      <text x="135" y="200" textAnchor="middle" className="ax-label">everything gets mixed</text>
      <text x="455" y="20" textAnchor="middle" className="ax-label sz-strong">Lens = traffic controller</text>
      <ellipse cx="455" cy="110" rx="80" ry="10" className="op-lens" />
      {xs.map((x, i) => <g key={x}><rect x={x + 308} y="34" width="24" height="16" rx="4" fill={colors[i]} /><polyline points={`${x + 320},52 ${x + 320},108 ${470 + (1.5 - i) * 40},176`} fill="none" stroke={colors[i]} strokeWidth="2" markerEnd="url(#op-arr-g)" /></g>)}
      <line x1="355" y1="180" x2="555" y2="180" className="op-sensor" />
      <text x="455" y="208" textAnchor="middle" className="ax-label">each stream to its own place</text>
    </Fig>
  );
}

/** Parallel rays from far away meet at the focal point F, a distance f behind the lens. */
export function FocalSketch({ caption }: { caption?: string }) {
  const ys = [-60, -30, 0, 30, 60];
  return (
    <Fig vb="0 0 600 220" label="Parallel rays pass through a lens and meet at the focal point F; f is the distance from the lens centre to F" caption={caption}>
      <defs><marker id="op-dim" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" className="ax-fill" /></marker></defs>
      <line x1="20" y1="110" x2="590" y2="110" className="op-axis" />
      {ys.map((y) => (
        <g key={y}>
          <line x1="40" y1={110 + y} x2="250" y2={110 + y} className="op-light" />
          <line x1="250" y1={110 + y} x2="430" y2="110" className="op-light" />
        </g>
      ))}
      <ellipse cx="250" cy="110" rx="12" ry="76" className="op-lens" />
      <circle cx="430" cy="110" r="5" className="ax-dot" />
      <text x="438" y="100" className="ax-pt">F</text>
      <line x1="250" y1="200" x2="430" y2="200" className="ax-line" markerStart="url(#op-dim)" markerEnd="url(#op-dim)" />
      <text x="340" y="193" textAnchor="middle" className="ax-label sz-strong">focal length f</text>
      <text x="40" y="34" className="ax-label">light from very far away (parallel rays)</text>
    </Fig>
  );
}

function Person({ x, y, blur = false, h = 70 }: { x: number; y: number; blur?: boolean; h?: number }) {
  const s = h / 70;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} filter={blur ? "url(#op-defocus)" : undefined}>
      <circle cx="0" cy="-58" r="10" fill="#e8b48f" />
      <rect x="-11" y="-46" width="22" height="30" rx="7" fill="#2f63d6" />
      <rect x="-9" y="-18" width="7" height="18" rx="3" fill="#33373d" />
      <rect x="2" y="-18" width="7" height="18" rx="3" fill="#33373d" />
    </g>
  );
}

/** A camera focused at 5 m: the person there is sharp, the one at 1 m is blurred. */
export function DistanceFocus({ caption }: { caption?: string }) {
  return (
    <Fig vb="0 0 600 200" label="Camera focused at 5 metres: a person at 5 m is sharp, a person at 1 m is blurry" caption={caption}>
      <defs><filter id="op-defocus" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.2" /></filter></defs>
      <Camera x={78} y={120} flip />
      <line x1="62" y1="150" x2="560" y2="150" className="op-axis" />
      <Person x={180} y={150} blur />
      <Person x={500} y={150} />
      <text x="180" y="174" textAnchor="middle" className="ax-label sz-strong">1 m · blurry</text>
      <text x="500" y="174" textAnchor="middle" className="ax-label sz-strong">5 m · sharp</text>
      <text x="340" y="40" textAnchor="middle" className="ax-label">focus set for 5 m</text>
      <line x1="500" y1="48" x2="500" y2="70" className="ax-guide" />
    </Fig>
  );
}

/** Two cameras side by side: a short lens sees a wide cone, a long lens a narrow one. */
export function FovCone({ caption }: { caption?: string }) {
  const cone = (cx: number, half: number, label: string, sub: string) => (
    <g>
      <path d={`M${cx} 170 L${cx - half} 40 L${cx + half} 40 Z`} className="sk-fov" />
      <line x1={cx} y1="170" x2={cx - half} y2="40" className="ax-guide" />
      <line x1={cx} y1="170" x2={cx + half} y2="40" className="ax-guide" />
      <rect x={cx - 22} y="170" width="44" height="26" rx="5" className="sk-cam" />
      <text x={cx} y="20" textAnchor="middle" className="ax-label sz-strong">{label}</text>
      <text x={cx} y="216" textAnchor="middle" className="ax-label">{sub}</text>
    </g>
  );
  return (
    <Fig vb="0 0 600 230" label="A 12 mm lens sees a wide area; a 50 mm lens sees a narrow area" caption={caption}>
      {cone(160, 120, "Short focal length · 12 mm", "wider view")}
      {cone(450, 30, "Long focal length · 50 mm", "narrower view")}
    </Fig>
  );
}

/** Camera above an object with the working distance dimensioned. */
export function WdSketch({ wd = "2 m", object = "Object", wide = false, caption }: { wd?: string; object?: string; wide?: boolean; caption?: string }) {
  return (
    <Fig vb="0 0 420 250" label={`Camera ${wd} above the ${object.toLowerCase()}: working distance ${wd}`} caption={caption}>
      <defs><marker id="op-dim2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" className="ax-fill" /></marker></defs>
      <rect x="180" y="12" width="60" height="34" rx="6" className="sk-cam" />
      <rect x="198" y="46" width="24" height="12" className="sk-cam" />
      <path d={`M210 58 L${wide ? 40 : 130} 196 L${wide ? 380 : 290} 196 Z`} className="sk-fov" />
      <line x1="300" y1="58" x2="300" y2="194" className="ax-line" markerStart="url(#op-dim2)" markerEnd="url(#op-dim2)" />
      <text x="310" y="132" className="ax-label sz-strong">WD = {wd}</text>
      <rect x={wide ? 20 : 120} y="198" width={wide ? 380 : 180} height="26" rx="4" fill="url(#op-steel)" />
      <text x="210" y="216" textAnchor="middle" className="sk-name" style={{ fontSize: 13 }}>{object.toUpperCase()}</text>
    </Fig>
  );
}

/** The lens's image circle with a small and a large sensor inside: the larger sensor captures more. */
export function SensorSizes({ caption }: { caption?: string }) {
  return (
    <Fig vb="0 0 600 250" label="A lens forms a round image circle; a small sensor captures the centre, a large sensor captures more of it" caption={caption}>
      <circle cx="300" cy="138" r="106" className="op-circle" />
      <text x="300" y="20" textAnchor="middle" className="ax-label sz-strong">image circle formed by the lens</text>
      <rect x="214" y="80" width="172" height="116" rx="3" className="op-sensB" />
      <rect x="254" y="106" width="92" height="62" rx="3" className="op-sensA" />
      <text x="300" y="142" textAnchor="middle" className="ax-label sz-strong">A · small</text>
      <text x="300" y="188" textAnchor="middle" className="ax-label sz-strong">B · large</text>
      <text x="470" y="100" className="ax-label">same lens,</text>
      <text x="470" y="118" className="ax-label">B sees a wider</text>
      <text x="470" y="136" className="ax-label">field of view</text>
    </Fig>
  );
}
