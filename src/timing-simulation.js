import { makeNoise, estimate } from "./simulation.js";

export function baselineCollider({ seed = 4217, n = 2400 } = {}) {
  const data = makeNoise(n, seed).map(({ C1: P, C2: R, eK, a, eY }) => {
    const K = P + R + 0.5 * eK;
    const A = +(a < 1 / (1 + Math.exp(-1.5 * P)));
    return { P, R, K, A, Y: 2 * A + 1.5 * R + eY };
  });
  return {
    data,
    truth: 2,
    withoutK: estimate(data, []).values[2],
    withK: estimate(data, ["K"]).values[2],
  };
}
