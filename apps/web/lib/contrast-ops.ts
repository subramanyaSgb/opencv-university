/** Lateral-inhibition model for Chapter 9.3: perceived = I + a · (I − Gσ * I), on a 1-D profile (edges replicated). */
export function gaussKernel(sigma: number, radius = Math.ceil(3.75 * sigma)) {
  const k = Array.from({ length: 2 * radius + 1 }, (_, i) => Math.exp(-((i - radius) ** 2) / (2 * sigma * sigma)));
  const s = k.reduce((a, b) => a + b, 0);
  return k.map((v) => v / s);
}

export function surround(profile: number[], sigma: number, radius?: number) {
  const k = gaussKernel(sigma, radius);
  const r = (k.length - 1) / 2;
  const n = profile.length;
  return profile.map((_, i) => k.reduce((acc, w, j) => acc + w * profile[Math.min(n - 1, Math.max(0, i + j - r))], 0));
}

export function perceived(profile: number[], sigma: number, a: number, radius?: number) {
  const s = surround(profile, sigma, radius);
  return profile.map((v, i) => v + a * (v - s[i]));
}

export function staircase(levels: number[], width: number) {
  return levels.flatMap((v) => Array(width).fill(v));
}
