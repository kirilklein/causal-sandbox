import { makeNoise, estimate } from "./simulation.js";

// Complete lesson state; no advanced sandbox setting is shared with this world.
export function lessonBaseline(level) {
  if (![1, 2, 3].includes(level)) throw new Error("Unknown lesson");
  return {
    level,
    seed: 4217,
    n: 2400,
    effect: 2,
    selection: level === 3 ? 1.2 : 0,
    outcomeInfluence: level === 1 ? 0 : 1.5,
    adjusted: false,
  };
}

// One actual baseline variable; no mediator, collider, hidden cause or interaction.
export function simulateLesson(state, noise = makeNoise(state.n, state.seed)) {
  return noise.map(({ C1: C, a, eY }) => {
    const A = +(a < 1 / (1 + Math.exp(0.8 - state.selection * C)));
    return {
      ...(state.level > 1 ? { C } : {}),
      A,
      Y: state.effect * A + state.outcomeInfluence * C + eY,
    };
  });
}

export function lessonResult(state, noise) {
  const data = simulateLesson(state, noise);
  const result = estimate(data, state.adjusted ? ["C"] : []);
  const means = (weights) =>
    [0, 1].map((arm) => {
      let sum = 0,
        total = 0;
      data.forEach((d, i) => {
        if (d.A === arm) {
          sum += weights[i] * d.C;
          total += weights[i];
        }
      });
      return sum / total;
    });
  return {
    unadjusted: result.values[0],
    ipw: result.values[3],
    clipped: result.clipped,
    before: state.level > 1 ? means(data.map(() => 1)) : null,
    after: state.level > 1 ? means(result.weights) : null,
  };
}
