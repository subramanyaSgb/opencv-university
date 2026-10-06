/** Module 51: from-scratch neural network math, pure and unit-tested.
 *  51.1 uses sigmoid/tanh/relu and neuronForward; later 51.x chapters reuse these. */

export type Activation = "sigmoid" | "tanh" | "relu" | "identity";

export function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}
export function tanhAct(z: number): number {
  return Math.tanh(z);
}
export function relu(z: number): number {
  return Math.max(0, z);
}
export function identity(z: number): number {
  return z;
}
export const ACTIVATIONS: Record<Activation, (z: number) => number> = {
  sigmoid, tanh: tanhAct, relu, identity,
};

/** z = w . x + b for one neuron. */
export function weightedSum(x: number[], w: number[], b: number): number {
  let s = b;
  for (let i = 0; i < x.length; i++) s += w[i] * x[i];
  return s;
}

/** One neuron: z, then the chosen activation. */
export function neuronForward(x: number[], w: number[], b: number, act: Activation) {
  const z = weightedSum(x, w, b);
  return { z, a: ACTIVATIONS[act](z) };
}

/** A dense layer: several neurons sharing the same inputs. W is [nIn][nOut], b is [nOut]. */
export function layerForward(x: number[], W: number[][], b: number[], act: Activation): number[] {
  const nOut = b.length, nIn = x.length;
  const out = new Array(nOut).fill(0);
  for (let j = 0; j < nOut; j++) {
    let z = b[j];
    for (let i = 0; i < nIn; i++) z += x[i] * W[i][j];
    out[j] = ACTIVATIONS[act](z);
  }
  return out;
}
