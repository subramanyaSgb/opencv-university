/** OpenCV.js memory model (Chapter 8.9): Mats live in the WebAssembly heap and are freed only by mat.delete(). */
export interface JsMemParams { w: number; h: number; channels: number; matsPerFrame: number; deleted: boolean; fps: number; heapLimitMB: number }

export function frameBytes(p: JsMemParams) { return p.w * p.h * p.channels * p.matsPerFrame; }

/** Heap used after `frames` frames, and how long until the heap limit is reached (Infinity when Mats are deleted). */
export function heapAfter(p: JsMemParams, frames: number) {
  const per = frameBytes(p);
  const used = p.deleted ? per : per * frames;
  const limit = p.heapLimitMB * 1024 * 1024;
  const framesToLimit = p.deleted ? Infinity : Math.floor(limit / per);
  return { usedMB: used / (1024 * 1024), framesToLimit, secondsToLimit: framesToLimit / p.fps, over: used > limit };
}
