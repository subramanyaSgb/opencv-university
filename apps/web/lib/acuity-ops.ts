/** Visual acuity for operator screens (Chapter 9.1). Normal acuity (20/20) resolves about 1 arcminute. */
export const ARCMIN_PER_RAD = (180 / Math.PI) * 60;

/** Pixel pitch of a screen in mm from its diagonal (inches) and resolution. */
export function pitchMM(diagInch: number, w: number, h: number) {
  return (diagInch * 25.4) / Math.hypot(w, h);
}

/** Visual angle in arcminutes of an object of size s (mm) seen from distance d (mm). */
export function arcmin(sizeMM: number, distMM: number) {
  return 2 * Math.atan(sizeMM / (2 * distMM)) * ARCMIN_PER_RAD;
}

export type Visibility = "invisible" | "limit" | "visible";
/** Rule of thumb: < 1′ cannot be resolved, 1–4′ only with full attention and high contrast, ≥ 4′ easily seen. */
export function visibility(a: number): Visibility {
  return a < 1 ? "invisible" : a < 4 ? "limit" : "visible";
}

/** Screen zoom (screen pixels per image pixel) needed for an image detail of n pixels to reach `target` arcminutes. */
export function zoomNeeded(nPx: number, pitch: number, distMM: number, target = 4) {
  const size = 2 * distMM * Math.tan(target / ARCMIN_PER_RAD / 2);
  return size / (nPx * pitch);
}
