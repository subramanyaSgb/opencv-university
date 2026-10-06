/** Brightness perception helpers (Chapter 9.2): sRGB transfer function (IEC 61966-2-1) and Weber contrast. */
export function srgbToLinear(code: number) {
  const c = code / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}
export function linearToSrgb(y: number) {
  const c = y <= 0.0031308 ? 12.92 * y : 1.055 * y ** (1 / 2.4) - 0.055;
  return Math.round(255 * Math.min(1, Math.max(0, c)));
}
/** Weber contrast |ΔL| / L of a spot on a background, with ambient light (fraction of white) reflected by the screen. */
export function weber(bgCode: number, spotCode: number, ambient = 0) {
  const bg = srgbToLinear(bgCode) + ambient;
  const sp = srgbToLinear(spotCode) + ambient;
  return bg > 0 ? Math.abs(bg - sp) / bg : Infinity;
}
/** Rule of thumb: about 2 % is just noticeable in good conditions (Weber fraction). */
export const JND = 0.02;
/** n grey steps equally spaced in luminance (as codes) or in code values. */
export function ramp(n: number, perceptual: boolean) {
  return Array.from({ length: n }, (_, i) => (perceptual ? Math.round((255 * i) / (n - 1)) : linearToSrgb(i / (n - 1))));
}
