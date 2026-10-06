// Group-of-pictures patterns, frame dependencies, damage from a lost frame, and bitrate, for GopLab (Chapter 4.5). Unit-tested.
// Model (display order): I = independent; P = predicted from the previous I/P; B = from the previous and next I/P.
// Frame sizes are relative to an I-frame and are illustrative inputs, not codec facts.

export type FrameType = "I" | "P" | "B";

/** Frame types for n frames: an I every `gop` frames, `b` B-frames between anchors. */
export function pattern(n: number, gop: number, b: number): FrameType[] {
  const out: FrameType[] = [];
  for (let i = 0; i < n; i++) {
    const k = i % gop;
    if (k === 0) out.push("I");
    else out.push(k % (b + 1) === 0 ? "P" : "B");
  }
  // a B with no later anchor before the end has nothing to look forward to: make it P
  for (let i = n - 1; i >= 0 && out[i] !== "I"; i--) {
    if (out[i] === "B") out[i] = "P"; else break;
  }
  return out;
}

/** Indices of the frames each frame is predicted from. */
export function references(types: FrameType[]): number[][] {
  const anchors = types.map((t, i) => (t === "B" ? -1 : i)).filter((i) => i >= 0);
  return types.map((t, i) => {
    if (t === "I") return [];
    const prev = [...anchors].reverse().find((a) => a < i);
    if (t === "P") return prev === undefined ? [] : [prev];
    const next = anchors.find((a) => a > i);
    return [prev, next].filter((x): x is number => x !== undefined);
  });
}

/** Frames that cannot be decoded correctly when frame `lost` is lost. */
export function damaged(types: FrameType[], lost: number): Set<number> {
  const refs = references(types);
  const bad = new Set<number>([lost]);
  let changed = true;
  while (changed) {
    changed = false;
    refs.forEach((r, i) => {
      if (!bad.has(i) && r.some((x) => bad.has(x))) { bad.add(i); changed = true; }
    });
  }
  return bad;
}

/** Frames that must be decoded to show frame k (k itself and everything it depends on). */
export function needed(types: FrameType[], k: number): Set<number> {
  const refs = references(types);
  const need = new Set<number>();
  const stack = [k];
  while (stack.length) {
    const i = stack.pop() as number;
    if (need.has(i)) continue;
    need.add(i);
    stack.push(...refs[i]);
  }
  return need;
}

export const DEFAULT_SIZE: Record<FrameType, number> = { I: 1, P: 0.2, B: 0.1 };

/** Average bitrate in Mbit/s for an I-frame of `iKB` kilobytes. */
export function bitrate(types: FrameType[], iKB: number, fps: number, rel = DEFAULT_SIZE): number {
  const kB = types.reduce((s, t) => s + rel[t] * iKB, 0) / types.length;
  return (kB * 1000 * 8 * fps) / 1e6;
}
