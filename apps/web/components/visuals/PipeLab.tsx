"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { runPipeline, STEP_LABEL, STEP_CODE, type Step } from "@/lib/pipe-ops";
import { metrics } from "@/lib/thresh-ops";

type Src = { label: string; src: string; gt: string };
const SOURCES: Src[] = [
  { label: "printed label, uneven light", src: "/images/sample-print-uneven.png", gt: "/images/sample-print-uneven-gt.png" },
  { label: "faint crack in noise", src: "/images/sample-crack-faint.png", gt: "/images/sample-plate-crack-mask.png" },
];
const ALL: Step[] = ["flat", "blur", "stretch", "otsu"];

function useGray(src: string) {
  const [g, setG] = useState<{ d: Uint8Array; w: number; h: number } | null>(null);
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
      const ctx = c.getContext("2d")!; ctx.drawImage(img, 0, 0);
      const p = ctx.getImageData(0, 0, img.width, img.height).data, d = new Uint8Array(img.width * img.height);
      for (let i = 0; i < d.length; i++) d[i] = p[4 * i];
      setG({ d, w: img.width, h: img.height });
    };
    img.src = src;
  }, [src]);
  return g;
}

function Gray({ d, w, h, label }: { d: Uint8Array; w: number; h: number; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d"); if (!ctx) return;
    const im = ctx.createImageData(w, h);
    for (let i = 0; i < d.length; i++) im.data.set([d[i], d[i], d[i], 255], 4 * i);
    ctx.putImageData(im, 0, 0);
  }, [d, w, h]);
  return <figure className="pq-stage"><canvas ref={ref} width={w} height={h} className="pq-img" role="img" aria-label={label} /><figcaption>{label}</figcaption></figure>;
}

/** PipeLab (Module 15): switch steps on and off and change their order; each stage is shown and the final mask is scored against ground truth (dark objects = value below 128). */
export function PipeLab({ initial = ["otsu"], initialOrder = ALL, initialSource = 0, caption }: { initial?: Step[]; initialOrder?: Step[]; initialSource?: number; caption?: string }) {
  const [si, setSi] = useState(initialSource);
  const [order, setOrder] = useState<Step[]>(initialOrder);
  const [on, setOn] = useState<Record<Step, boolean>>({ flat: initial.includes("flat"), blur: initial.includes("blur"), stretch: initial.includes("stretch"), otsu: initial.includes("otsu") });
  const s = SOURCES[si];
  const g = useGray(s.src), gt = useGray(s.gt);
  const active = order.filter((x) => on[x]);
  const stages = useMemo(() => (g ? runPipeline(g.d, g.w, g.h, active) : null), [g, active.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps
  const final = stages?.[stages.length - 1];
  const q = final && gt ? metrics(Uint8Array.from(final, (v) => (v < 128 ? 1 : 0)), gt.d) : null;
  const move = (i: number, d: number) => setOrder((o) => { const n = o.slice(), j = i + d; if (j < 0 || j >= n.length) return o; [n[i], n[j]] = [n[j], n[i]]; return n; });
  return (
    <figure className="fig pipelab">
      <div className="ctl ctl-full"><span>Image</span>
        <div className="seg seg-small" role="radiogroup" aria-label="Image">
          {SOURCES.map((x, i) => <button key={x.src} type="button" role="radio" aria-checked={si === i} className={si === i ? "is-on" : ""} onClick={() => setSi(i)}>{x.label}</button>)}
        </div>
      </div>
      <ol className="pq-steps">
        {order.map((st, i) => (
          <li key={st} className={on[st] ? "is-on" : ""}>
            <label><input type="checkbox" checked={on[st]} onChange={(e) => setOn({ ...on, [st]: e.target.checked })} /> {STEP_LABEL[st]}</label>
            <span className="pq-move">
              <button type="button" onClick={() => move(i, -1)} aria-label={`Move ${STEP_LABEL[st]} up`} disabled={i === 0}>↑</button>
              <button type="button" onClick={() => move(i, 1)} aria-label={`Move ${STEP_LABEL[st]} down`} disabled={i === order.length - 1}>↓</button>
            </span>
          </li>
        ))}
      </ol>
      {g && stages && (
        <div className="pq-strip">
          <Gray d={stages[0]} w={g.w} h={g.h} label="input" />
          {active.map((st, i) => <Gray key={st + i} d={stages[i + 1]} w={g.w} h={g.h} label={`${i + 1}. ${STEP_LABEL[st]}`} />)}
        </div>
      )}
      {q && (
        <div className="ap-stats pq-stats">
          <span>final mask (value &lt; 128 = object) vs truth:</span>
          <span>precision <b>{(100 * q.precision).toFixed(1)} %</b></span>
          <span>recall <b>{(100 * q.recall).toFixed(1)} %</b></span>
          <span>F1 <b>{q.f1.toFixed(3)}</b></span>
        </div>
      )}
      <pre className="pq-code"><code>{active.length ? active.map((st) => STEP_CODE[st]).join("\n") : "# no steps: the raw image is compared with 128"}</code></pre>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
