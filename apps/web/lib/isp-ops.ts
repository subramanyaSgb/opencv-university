// Image signal processor (ISP) steps for IspLab (Chapter 2.8). Unit-tested. Values are 0..1 floats.

/** sRGB transfer curve (IEC 61966-2-1): linear light → encoded value. */
export function srgbEncode(x: number): number {
  return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(Math.max(x, 0), 1 / 2.4) - 0.055;
}

/** Inverse sRGB curve: encoded value → linear light. */
export function srgbDecode(v: number): number {
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

/** Lens shading: relative illumination at normalized squared radius r2 (0 centre, 1 corner). */
export function shading(r2: number, k = 0.45): number {
  return 1 - k * r2;
}

/** Gray-world white balance: gains that make the R, G and B means equal to the G mean. */
export function grayWorldGains(means: [number, number, number]): [number, number, number] {
  return [means[1] / means[0], 1, means[1] / means[2]];
}
