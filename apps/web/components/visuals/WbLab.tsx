"use client";

import { useState } from "react";
import { capture, gains, apply, cast, type Patch, type Trip, type WbMethod } from "@/lib/wb-ops";

const BASE: Patch[] = [
  { name: "white card", refl: [0.8, 0.8, 0.8], area: 1 },
  { name: "grey card", refl: [0.4, 0.4, 0.4], area: 1 },
  { name: "red part", refl: [0.1, 0.1, 0.6], area: 1 },
  { name: "blue part", refl: [0.6, 0.2, 0.1], area: 1 },
  { name: "cardboard", refl: [0.15, 0.3, 0.45], area: 1 },
];
const LEAVES: Patch = { name: "green background", refl: [0.08, 0.45, 0.12], area: 12 };
const LIGHTS: { l: string; t: Trip }[] = [
  { l: "neutral (D65)", t: [1, 1, 1] },
  { l: "warm (halogen)", t: [0.6, 0.9, 1.2] },
  { l: "cool (shade)", t: [1.25, 1, 0.8] },
  { l: "green-ish (old fluorescent)", t: [0.85, 1.15, 0.9] },
];
const METHODS: { k: WbMethod; l: string }[] = [
  { k: "none", l: "no correction" },
  { k: "greyworld", l: "grey world" },
  { k: "whitepatch", l: "white patch (max)" },
  { k: "reference", l: "white reference card" },
];
const css = (v: Trip) => {
  const enc = (x: number) => { const y = Math.min(1, x / 255); return Math.round(255 * (y <= 0.0031308 ? 12.92 * y : 1.055 * y ** (1 / 2.4) - 0.055)); };
  return `rgb(${enc(v[2])},${enc(v[1])},${enc(v[0])})`;
};

/** WbLab: a scene under a coloured light; white-balance it with grey world, white patch or a reference card. */
export function WbLab({ caption }: { caption?: string }) {
  const [li, setLi] = useState(1);
  const [method, setMethod] = useState<WbMethod>("none");
  const [green, setGreen] = useState(false);
  const [expo, setExpo] = useState(1);
  const scene = green ? [...BASE, LEAVES] : BASE;
  const light = LIGHTS[li].t.map((x) => x * expo) as Trip;
  const g = gains(scene, light, method);
  const out = scene.map((p) => ({ p, v: apply(capture(p, light), g) }));
  const greyOut = out.find((o) => o.p.name === "grey card")!.v;
  const c = cast(greyOut);
  return (
    <figure className="fig wblab">
      <div className="sc-ctl">
        <div className="ctl ctl-full"><span>Light</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Light">
            {LIGHTS.map((x, i) => <button key={x.l} type="button" role="radio" aria-checked={li === i} className={li === i ? "is-on" : ""} onClick={() => setLi(i)}>{x.l}</button>)}
          </div>
        </div>
        <div className="ctl ctl-full"><span>White balance</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Method">
            {METHODS.map((x) => <button key={x.k} type="button" role="radio" aria-checked={method === x.k} className={method === x.k ? "is-on" : ""} onClick={() => setMethod(x.k)}>{x.l}</button>)}
          </div>
        </div>
        <div className="ctl ctl-full"><span>Scene</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Scene">
            {([[false, "mixed colours"], [true, "mostly green background"]] as const).map(([k, l]) => <button key={l} type="button" role="radio" aria-checked={green === k} className={green === k ? "is-on" : ""} onClick={() => setGreen(k)}>{l}</button>)}
          </div>
        </div>
        <label className="ctl ctl-wide"><span>Exposure <output>{expo.toFixed(2)}×</output></span><input type="range" min={0.5} max={1.8} step={0.05} value={expo} onChange={(e) => setExpo(Number(e.target.value))} aria-label="Exposure" /></label>
      </div>
      <div className={`wb-scene${green ? " is-green" : ""}`} style={green ? { background: css(out.find((o) => o.p.name === "green background")!.v) } : undefined}>
        {out.filter((o) => o.p.name !== "green background").map((o) => (
          <div key={o.p.name} className="wb-patch"><i style={{ background: css(o.v) }} /><span>{o.p.name}</span></div>
        ))}
      </div>
      <ul className="ap-stats">
        <li><span>Gains B, G, R</span><strong>{g.map((x) => x.toFixed(2)).join(", ")}</strong><em>multiplied into every pixel</em></li>
        <li><span>Grey card after correction</span><strong>{greyOut.map((x) => Math.round(x)).join(", ")}</strong><em>B, G, R (linear)</em></li>
        <li><span>Remaining colour cast</span><strong className={c < 0.05 ? "wb-ok" : c < 0.2 ? "wb-warn" : "wb-bad"}>{Number.isFinite(c) ? `${(c * 100).toFixed(0)} %` : "–"}</strong><em>max/min channel of the grey card − 1</em></li>
      </ul>
      <div className="pg-readout"><span>Grey world assumes the scene averages to grey; a large green background breaks it. White patch assumes the brightest pixel is white; overexposure (clipping) breaks it. A known white card in the image is the most reliable.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
