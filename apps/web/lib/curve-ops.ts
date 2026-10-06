/** Point operations as 256-entry lookup tables (Module 11). All results rounded and clipped to 0..255. */
export type CurveKind = "identity" | "negative" | "log" | "gamma" | "stretch" | "slice" | "threshold" | "contrast";
export interface CurveParams { gamma?: number; lo?: number; hi?: number; keep?: boolean; t?: number; alpha?: number; beta?: number }

const clip = (v: number) => Math.min(255, Math.max(0, Math.round(v)));

export function lut(kind: CurveKind, p: CurveParams = {}): number[] {
  const c = 255 / Math.log(256);
  return Array.from({ length: 256 }, (_, x) => {
    switch (kind) {
      case "identity": return x;
      case "negative": return 255 - x;
      case "log": return clip(c * Math.log(1 + x));
      case "gamma": return clip(255 * (x / 255) ** (p.gamma ?? 1));
      case "stretch": { const lo = p.lo ?? 0, hi = p.hi ?? 255; return clip(((x - lo) * 255) / Math.max(1, hi - lo)); }
      case "slice": { const lo = p.lo ?? 100, hi = p.hi ?? 150; return x >= lo && x <= hi ? 255 : p.keep ? x : 0; }
      case "threshold": return x > (p.t ?? 128) ? 255 : 0;
      case "contrast": return clip((p.alpha ?? 1) * x + (p.beta ?? 0));
    }
  });
}

/** 256-bin histogram of an 8-bit array. */
export function histogram(values: ArrayLike<number>) {
  const h = new Array(256).fill(0);
  for (let i = 0; i < values.length; i++) h[values[i]]++;
  return h;
}
