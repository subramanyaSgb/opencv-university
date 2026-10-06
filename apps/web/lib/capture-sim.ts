// Simulation of a camera feeding a slower (or faster) processing loop, for CaptureLab (Chapter 7.4). Unit-tested.
// Camera: frame k is captured at t = k / fps. Strategy "buffer": a FIFO of `buffer` frames; when it is full, new
// frames are dropped and the loop always takes the OLDEST frame. Strategy "latest": a reader thread keeps only the
// NEWEST frame; the loop takes it when ready (never the same frame twice).

export type Strategy = "buffer" | "latest";
export type Result = { processed: number; dropped: number; latency: number[]; meanLatency: number; maxLatency: number };

export function simulate(fps: number, procMs: number, buffer: number, strategy: Strategy, seconds = 5): Result {
  const period = 1000 / fps, total = Math.floor((seconds * 1000) / period);
  const capture = (k: number) => k * period;
  let t = 0, next = 0, processed = 0, dropped = 0, lastTaken = -1;
  const latency: number[] = [];
  const queue: number[] = [];
  let produced = 0;
  const produceUntil = (time: number) => {
    while (produced < total && capture(produced) <= time) {
      if (strategy === "buffer") { if (queue.length < buffer) queue.push(produced); else dropped++; }
      produced++;
    }
  };
  while (true) {
    produceUntil(t);
    let k: number | undefined;
    if (strategy === "buffer") k = queue.shift();
    else { const newest = produced - 1; if (newest > lastTaken) { dropped += Math.max(0, newest - lastTaken - 1); k = newest; lastTaken = newest; } }
    if (k === undefined) {
      if (produced >= total) break;
      t = capture(produced); // wait for the next frame
      continue;
    }
    t += procMs;
    latency.push(t - capture(k));
    processed++;
    next++;
  }
  const meanLatency = latency.reduce((a, b) => a + b, 0) / Math.max(1, latency.length);
  return { processed, dropped, latency, meanLatency, maxLatency: Math.max(0, ...latency) };
}
