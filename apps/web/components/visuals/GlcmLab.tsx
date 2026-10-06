"use client";

import { useMemo, useState } from "react";
import { useGrays, GrayView, Seg } from "./lab-kit";

const SOURCES: Record<string, { src: string; label: string }> = {
  woven: { src: "/images/sample-texture-woven.png", label: "woven fabric" },
  smooth: { src: "/images/sample-texture-smooth.png", label: "smooth shading" },
  blotchy: { src: "/images/sample-texture-blotchy.png", label: "blotchy" },
  defect: { src: "/images/sample-texture-defect.png", label: "fabric with a defect" },
};
const ANGLES: Record<string, [number, number]> = { "0": [1, 0], "45": [1, -1], "90": [0, 1], "135": [1, 1] };
const LEVELS = 16;

function quantize(v: number): number {
  return Math.min(LEVELS - 1, Math.floor(v / (256 / LEVELS)));
}

/** Build the LxL co-occurrence matrix (distance 1, given direction) over a rectangular region of a grey image. */
function glcm(d: ArrayLike<number>, w: number, x0: number, y0: number, rw: number, rh: number, dx: number, dy: number): Float64Array {
  const mat = new Float64Array(LEVELS * LEVELS);
  const ax0 = x0 + Math.max(0, -dx), ax1 = x0 + rw - Math.max(0, dx);
  const ay0 = y0 + Math.max(0, -dy), ay1 = y0 + rh - Math.max(0, dy);
  for (let y = ay0; y < ay1; y++) {
    for (let x = ax0; x < ax1; x++) {
      const a = quantize(d[y * w + x]);
      const b = quantize(d[(y + dy) * w + (x + dx)]);
      mat[a * LEVELS + b]++;
    }
  }
  return mat;
}

function haralick(mat: Float64Array) {
  const total = mat.reduce((s, v) => s + v, 0) || 1;
  let contrast = 0, homogeneity = 0, energy = 0, entropy = 0, muI = 0, muJ = 0;
  for (let i = 0; i < LEVELS; i++) for (let j = 0; j < LEVELS; j++) {
    const p = mat[i * LEVELS + j] / total;
    muI += i * p; muJ += j * p;
  }
  let varI = 0, varJ = 0, cov = 0;
  for (let i = 0; i < LEVELS; i++) for (let j = 0; j < LEVELS; j++) {
    const p = mat[i * LEVELS + j] / total;
    const d2 = (i - j) * (i - j);
    contrast += d2 * p;
    homogeneity += p / (1 + d2);
    energy += p * p;
    if (p > 0) entropy -= p * Math.log2(p);
    varI += (i - muI) * (i - muI) * p; varJ += (j - muJ) * (j - muJ) * p;
    cov += (i - muI) * (j - muJ) * p;
  }
  const sdI = Math.sqrt(varI), sdJ = Math.sqrt(varJ);
  const correlation = sdI > 0 && sdJ > 0 ? cov / (sdI * sdJ) : 1;
  return { contrast, homogeneity, energy, entropy, correlation };
}

const fmt = (v: number) => v.toFixed(3);

/** GlcmLab (Module 35): the grey-level co-occurrence matrix of a texture at a chosen direction (0/45/90/135 deg,
 *  distance 1), its Haralick features, and (for the "defect" source) a defect-patch vs rest-of-fabric comparison. */
export function GlcmLab({ initialSource = "woven", initialAngle = "0", caption }: { initialSource?: keyof typeof SOURCES; initialAngle?: keyof typeof ANGLES; caption?: string }) {
  const [source, setSource] = useState<keyof typeof SOURCES>(initialSource);
  const [angle, setAngle] = useState<keyof typeof ANGLES>(initialAngle);
  const g = useGrays([SOURCES[source].src])?.[0];
  const [dx, dy] = ANGLES[angle];

  const result = useMemo(() => {
    if (!g) return null;
    const mat = glcm(g.d, g.w, 0, 0, g.w, g.h, dx, dy);
    const feats = haralick(mat);
    let defectFeats = null, restFeats = null;
    if (source === "defect") {
      defectFeats = haralick(glcm(g.d, g.w, 24, 24, 24, 24, dx, dy));
      restFeats = haralick(glcm(g.d, g.w, 0, 0, 24, 24, dx, dy));
    }
    const maxV = Math.max(...mat);
    const heat = Float64Array.from(mat, (v) => Math.log1p(v) / Math.log1p(maxV) * 255);
    return { mat, feats, defectFeats, restFeats, heat };
  }, [g, dx, dy, source]);

  if (!g || !result) return <p>Loading…</p>;

  return (
    <figure className="fig lklab">
      <Seg label="Texture" opts={Object.entries(SOURCES).map(([k, v]) => [k as keyof typeof SOURCES, v.label] as [keyof typeof SOURCES, string])} v={source} set={setSource} />
      <Seg label="Direction (distance 1)" opts={(Object.keys(ANGLES) as (keyof typeof ANGLES)[]).map((k) => [k, `${k}°`] as [keyof typeof ANGLES, string])} v={angle} set={setAngle} />
      <div className="lk-grid">
        <GrayView d={g.d} w={g.w} h={g.h} scale={5} label={`${SOURCES[source].label} (${g.w}×${g.h})`} />
        <GrayView d={result.heat} w={LEVELS} h={LEVELS} scale={14} heat label={`co-occurrence matrix (${LEVELS}×${LEVELS} grey levels, log-scaled counts)`} />
      </div>
      <p className="lk-read">
        Contrast <b>{fmt(result.feats.contrast)}</b> · Homogeneity <b>{fmt(result.feats.homogeneity)}</b> · Energy <b>{fmt(result.feats.energy)}</b> ·
        Correlation <b>{fmt(result.feats.correlation)}</b> · Entropy <b>{fmt(result.feats.entropy)}</b>
      </p>
      {result.defectFeats && result.restFeats && (
        <p className="lk-read">
          Defect patch: contrast <b>{fmt(result.defectFeats.contrast)}</b>, homogeneity <b>{fmt(result.defectFeats.homogeneity)}</b> —
          rest of the fabric: contrast <b>{fmt(result.restFeats.contrast)}</b>, homogeneity <b>{fmt(result.restFeats.homogeneity)}</b>.
        </p>
      )}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
