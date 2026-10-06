"use client";

import { useMemo, useState } from "react";
import { type Activation, neuronForward } from "@/lib/nn-ops";

const ACTS: { key: Activation; label: string }[] = [
  { key: "sigmoid", label: "sigmoid" },
  { key: "tanh", label: "tanh" },
  { key: "relu", label: "ReLU" },
];

/** NeuronLab (51.1): one neuron, live. Three inputs and weights, a bias, and a choice of
 *  activation -- shows z = w.x + b as three weighted bars plus the bias, then a(z). */
export function NeuronLab({ caption }: { caption?: string }) {
  const [x, setX] = useState([0.5, -1.0, 2.0]);
  const [w, setW] = useState([0.4, 0.3, -0.2]);
  const [b, setB] = useState(0.1);
  const [act, setAct] = useState<Activation>("sigmoid");

  const { z, a, terms } = useMemo(() => {
    const terms = x.map((xi, i) => xi * w[i]);
    const r = neuronForward(x, w, b, act);
    return { ...r, terms };
  }, [x, w, b, act]);

  const maxAbs = Math.max(0.5, ...terms.map(Math.abs), Math.abs(b));
  const barW = (v: number) => `${(Math.abs(v) / maxAbs) * 50}%`;

  return (
    <figure className="fig neuronlab">
      <div className="sc-ctl">
        {x.map((xi, i) => (
          <label key={`x${i}`} className="ctl">
            <span>x{i + 1} <output>{xi.toFixed(1)}</output></span>
            <input type="range" min={-2} max={2} step={0.1} value={xi}
              onChange={(e) => setX(x.map((v, j) => (j === i ? Number(e.target.value) : v)))}
              aria-label={`input x${i + 1}`} />
          </label>
        ))}
        {w.map((wi, i) => (
          <label key={`w${i}`} className="ctl">
            <span>w{i + 1} <output>{wi.toFixed(1)}</output></span>
            <input type="range" min={-1} max={1} step={0.1} value={wi}
              onChange={(e) => setW(w.map((v, j) => (j === i ? Number(e.target.value) : v)))}
              aria-label={`weight w${i + 1}`} />
          </label>
        ))}
        <label className="ctl ctl-wide">
          <span>bias b <output>{b.toFixed(1)}</output></span>
          <input type="range" min={-2} max={2} step={0.1} value={b} onChange={(e) => setB(Number(e.target.value))} aria-label="bias" />
        </label>
        <div className="ctl ctl-full"><span>Activation</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Activation function">
            {ACTS.map((o) => <button key={o.key} type="button" role="radio" aria-checked={act === o.key} className={act === o.key ? "is-on" : ""} onClick={() => setAct(o.key)}>{o.label}</button>)}
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gap: "0.25rem" }}>
        {terms.map((t, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "4.5rem 1fr 3.5rem" as any, alignItems: "center", gap: "0.4rem" }}>
            <span style={{ fontSize: "0.82rem" }}>w{i + 1}·x{i + 1}</span>
            <span style={{ height: "0.8rem", background: "var(--bg-sunk)", borderRadius: "3px", position: "relative" }}>
              <span style={{ position: "absolute", left: t >= 0 ? "50%" : `calc(50% - ${barW(t)})`, width: barW(t), height: "100%", background: t >= 0 ? "#1f6feb" : "#cf222e", borderRadius: "2px" }} />
            </span>
            <span style={{ fontSize: "0.82rem", textAlign: "right" }}>{t.toFixed(3)}</span>
          </div>
        ))}
        <div style={{ display: "grid", gridTemplateColumns: "4.5rem 1fr 3.5rem" as any, alignItems: "center", gap: "0.4rem" }}>
          <span style={{ fontSize: "0.82rem" }}>bias</span>
          <span style={{ height: "0.8rem", background: "var(--bg-sunk)", borderRadius: "3px", position: "relative" }}>
            <span style={{ position: "absolute", left: b >= 0 ? "50%" : `calc(50% - ${barW(b)})`, width: barW(b), height: "100%", background: b >= 0 ? "#1f6feb" : "#cf222e", borderRadius: "2px" }} />
          </span>
          <span style={{ fontSize: "0.82rem", textAlign: "right" }}>{b.toFixed(3)}</span>
        </div>
      </div>
      <ul className="ap-stats">
        <li><span>z = w·x + b</span><strong>{z.toFixed(4)}</strong><em>sum of the bars above</em></li>
        <li><span>a = {act}(z)</span><strong>{a.toFixed(4)}</strong><em>the neuron's output</em></li>
      </ul>
      <div className="pg-readout"><span>Every neuron does only this: a weighted sum, then one fixed nonlinear squashing function. Everything a deep network does is many of these, wired together.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
