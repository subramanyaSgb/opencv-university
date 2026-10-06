/** Colour vision deficiency simulation (Machado, Oliveira & Fernandes 2009, severity 1.0, linear RGB) and CIE76 ΔE. */
export type Cvd = "normal" | "protanopia" | "deuteranopia" | "tritanopia";
type M3 = [number, number, number][];
export const MACHADO: Record<Exclude<Cvd, "normal">, M3> = {
  protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  tritanopia: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
};
const lin = (c: number) => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const enc = (y: number) => { const v = Math.min(1, Math.max(0, y)); return Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)); };

export type RGB = [number, number, number];
export function simulate(rgb: RGB, t: Cvd): RGB {
  if (t === "normal") return rgb;
  const l = rgb.map(lin);
  const m = MACHADO[t];
  return m.map((row) => enc(row[0] * l[0] + row[1] * l[1] + row[2] * l[2])) as RGB;
}

/** sRGB (0..255) → CIELAB (D65). */
export function toLab(rgb: RGB): RGB {
  const [r, g, b] = rgb.map(lin);
  const X = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
  const Y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const Z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}
export function deltaE(a: RGB, b: RGB) {
  const p = toLab(a), q = toLab(b);
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
}
