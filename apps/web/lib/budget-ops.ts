// Frame-time budget of a processing pipeline, for BudgetLab (Chapter 7.7). Unit-tested.

export type Stage = { name: string; ms: number };

export function budget(fps: number): number { return 1000 / fps; }
/** Running the stages one after another for every frame. */
export function sequential(stages: Stage[]) {
  const latency = stages.reduce((s, x) => s + x.ms, 0);
  return { latency, fps: latency > 0 ? 1000 / latency : Infinity };
}
/** Running each stage in its own thread/process on consecutive frames (a pipeline): throughput set by the slowest stage. */
export function pipelined(stages: Stage[]) {
  const slowest = stages.reduce((a, b) => (b.ms > a.ms ? b : a), stages[0]);
  const latency = stages.reduce((s, x) => s + x.ms, 0);
  return { latency, fps: slowest.ms > 0 ? 1000 / slowest.ms : Infinity, bottleneck: slowest.name };
}
