import { makeNoise, estimate } from "./simulation.js";

export const relevanceWorlds = ["unrelated", "predictor", "proxy", "collider"];

export function relevanceSample({
  world = "unrelated",
  seed = 4217,
  n = 2400,
} = {}) {
  if (!relevanceWorlds.includes(world))
    throw new Error(`Unknown relevance world: ${world}`);
  const data = makeNoise(n, seed).map(({ C1: P, C2: R, U, eM, eK, a, eY }) => {
    let A = +(a < 0.5);
    let V = P;
    let Y = 2 * A + eY;
    if (world === "predictor") Y += 1.5 * V;
    if (world === "proxy") {
      V = U + eM;
      A = +(a < 1 / (1 + Math.exp(-1.5 * U)));
      Y = 2 * A + 1.5 * U + eY;
    }
    if (world === "collider") {
      V = P + R + 0.5 * eK;
      A = +(a < 1 / (1 + Math.exp(-1.5 * P)));
      Y = 2 * A + 1.5 * R + eY;
    }
    return { A, V, Y };
  });
  const split = Math.floor(n / 2);
  const training = data.slice(0, split);
  const validation = data.slice(split);
  const fits = [[], ["V"]].map((adjustment) => {
    const fitted = estimate(training, adjustment, {
      strict: true,
      predictionPoints: validation,
    });
    const effect = fitted.values[2];
    // Shared predictions are at A=0; this additive model's A coefficient is its contrast.
    const rmse = Math.sqrt(
      validation.reduce((sum, row, i) => {
        const prediction = fitted.predictions[i].outcome + effect * row.A;
        return sum + (row.Y - prediction) ** 2;
      }, 0) / validation.length,
    );
    return { effect, rmse };
  });
  return { data, fits, truth: 2, vEffect: world === "predictor" ? 1.5 : 0 };
}
