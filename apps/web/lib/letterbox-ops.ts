/** Chapter 15.5: how an image is fitted into a network's square input (stretch, center crop, letterbox), and how boxes map back. */

export type Fit = "stretch" | "crop" | "letterbox";

/** Mapping from image coordinates to network-input coordinates: x' = sx·x + ox, y' = sy·y + oy. */
export function fitParams(w: number, h: number, size: number, fit: Fit) {
  if (fit === "stretch") return { sx: size / w, sy: size / h, ox: 0, oy: 0 };
  const s = fit === "letterbox" ? Math.min(size / w, size / h) : Math.max(size / w, size / h);
  return { sx: s, sy: s, ox: (size - w * s) / 2, oy: (size - h * s) / 2 };
}

export type Box = { x: number; y: number; w: number; h: number };
export const toNet = (b: Box, p: ReturnType<typeof fitParams>): Box => ({ x: b.x * p.sx + p.ox, y: b.y * p.sy + p.oy, w: b.w * p.sx, h: b.h * p.sy });
export const toImage = (b: Box, p: ReturnType<typeof fitParams>): Box => ({ x: (b.x - p.ox) / p.sx, y: (b.y - p.oy) / p.sy, w: b.w / p.sx, h: b.h / p.sy });

/** Share of the network input that is padding, and share of the image that is cut away. */
export function fitStats(w: number, h: number, size: number, fit: Fit) {
  const p = fitParams(w, h, size, fit), cw = w * p.sx, ch = h * p.sy;
  const visW = Math.min(cw, size), visH = Math.min(ch, size);
  return { padding: 1 - (visW * visH) / (size * size), cut: 1 - (visW * visH) / (cw * ch), aspect: p.sy / p.sx };
}
