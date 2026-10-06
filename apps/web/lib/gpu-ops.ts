/** Offload model for Chapter 8.5: is moving the work to the GPU worth the transfers? Times in ms. */
export interface GpuParams {
  mp: number;          // megapixels
  channels: number;    // 1 or 3
  bw: number;          // practical host <-> device bandwidth, GB/s
  cpuMs: number;       // CPU time of one operation on this image
  speedup: number;     // GPU kernel speed-up of one operation vs CPU
  ops: number;         // operations chained on the GPU without going back to the CPU
  smallResult: boolean; // download only a small result (a count, a box) instead of the full image
  launchMs?: number;   // fixed overhead per GPU operation (kernel launch, synchronisation)
}

export function bytes(p: GpuParams) { return p.mp * 1e6 * p.channels; }
/** ms to move n bytes at bw GB/s */
export function transferMs(n: number, bw: number) { return Number.isFinite(bw) ? (n / (bw * 1e9)) * 1000 : 0; }

export function offload(p: GpuParams) {
  const launch = p.launchMs ?? 0.05;
  const up = transferMs(bytes(p), p.bw);
  const down = p.smallResult ? (Number.isFinite(p.bw) ? 0.02 : 0) : transferMs(bytes(p), p.bw);
  const compute = p.ops * (p.cpuMs / p.speedup + launch);
  const gpu = up + compute + down;
  const cpu = p.ops * p.cpuMs;
  // smallest number of chained ops for which the GPU wins (Infinity if never)
  const perOpGain = p.cpuMs - (p.cpuMs / p.speedup + launch);
  const breakEven = perOpGain <= 0 ? Infinity : Math.ceil((up + down) / perOpGain - 1e-9);
  return { up, down, compute, gpu, cpu, ratio: cpu / gpu, breakEven: Math.max(1, breakEven) };
}
