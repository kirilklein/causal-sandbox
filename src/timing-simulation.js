import { makeNoise, estimate } from "./simulation.js";

export function timingSample({
  example = "collider",
  window = "before",
  seed = 4217,
  n = 2400,
} = {}) {
  const world = example === "collider" ? `collider-${window}` : example;
  const data = makeNoise(n, seed).map(({ C1: P, C2: R, U, eM, eK, a, eY }) => {
    let A = +(a < 0.5),
      V,
      Y;
    switch (world) {
      case "confounder":
      case "instrument":
        V = P;
        A = +(a < 1 / (1 + Math.exp(-1.5 * V)));
        Y = 2 * A + (world === "confounder" ? 1.5 * V : 0) + eY;
        break;
      case "predictor":
        V = P;
        Y = 2 * A + 1.5 * V + eY;
        break;
      case "mediator":
        V = A + eM;
        Y = A + V + eY;
        break;
      case "treatment":
        V = 2 * A + eM;
        Y = 2 * A + eY;
        break;
      case "outcome":
        Y = 2 * A + eY;
        V = Y + eK;
        break;
      case "collider-before":
        V = P + R + 0.5 * eK;
        A = +(a < 1 / (1 + Math.exp(-1.5 * P)));
        Y = 2 * A + 1.5 * R + eY;
        break;
      case "collider-between":
        V = A + U + 0.5 * eK;
        Y = 2 * A + 1.5 * U + eY;
        break;
      case "collider-after":
        Y = 2 * A + eY;
        V = A + Y + eK;
        break;
      default:
        throw new Error(`Unknown timing world: ${world}`);
    }
    return { P, R, U, A, V, Y };
  });
  return {
    data,
    truth: 2,
    unadjusted: estimate(data, []).values[2],
    adjusted: estimate(data, ["V"]).values[2],
  };
}
