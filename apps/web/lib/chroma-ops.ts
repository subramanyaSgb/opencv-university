/** Chapter 10.1: linear camera RGB of a surface under light of some intensity and tint; normalised chromaticity. */
export type RGB = [number, number, number];

/** Linear 8-bit camera values: 255 · reflectance · intensity · illuminant, clipped at 255 (saturation). */
export function observe(reflectance: RGB, intensity: number, illuminant: RGB = [1, 1, 1]): RGB {
  return reflectance.map((r, i) => Math.min(255, Math.round(255 * r * intensity * illuminant[i]))) as RGB;
}

/** Normalised chromaticity r = R/(R+G+B), g = G/(R+G+B), b = B/(R+G+B); undefined for black. */
export function chroma(rgb: RGB): RGB | null {
  const s = rgb[0] + rgb[1] + rgb[2];
  return s === 0 ? null : (rgb.map((v) => v / s) as RGB);
}

export const saturated = (rgb: RGB) => rgb.some((v) => v >= 255);
