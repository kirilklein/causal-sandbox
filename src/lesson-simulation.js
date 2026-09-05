import { makeNoise, estimate } from "./simulation.js";

// Complete lesson state; no advanced sandbox setting is shared with this world.
export function lessonBaseline(level) {
  if (![1, 2, 3, 4, 5, 6, 7, 8].includes(level))
    throw new Error("Unknown lesson");
  return {
    level,
    seed: 4217,
    n: 2400,
    effect: 2,
    selection: level >= 5 && level <= 6 ? 0.8 : level >= 3 ? 1.2 : 0,
    outcomeInfluence: level === 1 ? 0 : 1.5,
    adjusted: level >= 4,
    outcomeCurve: level === 6 ? 2 : 0,
    treatmentCurve: level === 6 ? 0.9 : 0,
    outcomeQuadratic: level === 6,
    treatmentQuadratic: level === 6,
    postAdjusted: false,
  };
}

// Later lessons add one post-treatment variable to the same baseline world.
export function simulateLesson(state, noise = makeNoise(state.n, state.seed)) {
  return noise.map(({ C1: C, a, eY, eM, eK }) => {
    const A = +(
      a <
      1 /
        (1 +
          Math.exp(
            0.8 - state.selection * C - state.treatmentCurve * (C ** 2 - 1),
          ))
    );
    const M = state.level === 7 ? A + eM : 0;
    const Y =
      state.effect * A +
      state.outcomeInfluence * C +
      state.outcomeCurve * (C ** 2 - 1) +
      M +
      eY;
    return {
      ...(state.level > 1 ? { C } : {}),
      A,
      Y,
      ...(state.level === 7 ? { M } : {}),
      ...(state.level === 8 ? { K: A + Y + eK } : {}),
    };
  });
}

export function lessonResult(state, noise) {
  const data = simulateLesson(state, noise);
  const predictionPoints =
    state.level === 5
      ? Array.from({ length: 41 }, (_, i) => ({
          C: Math.sqrt(3) * (i / 20 - 1),
        }))
      : undefined;
  const adjustment = state.adjusted ? ["C"] : [];
  if (state.postAdjusted && state.level === 7) adjustment.push("M");
  if (state.postAdjusted && state.level === 8) adjustment.push("K");
  const result = estimate(data, adjustment, {
    ...state,
    predictionPoints,
  });
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
    ...(predictionPoints
      ? {
          preview: predictionPoints.map(({ C }, i) => ({
            C,
            outcome:
              state.outcomeInfluence * C + state.outcomeCurve * (C ** 2 - 1),
            treatment:
              1 /
              (1 +
                Math.exp(
                  0.8 -
                    state.selection * C -
                    state.treatmentCurve * (C ** 2 - 1),
                )),
            fitted: result.predictions[i],
          })),
        }
      : {}),
    totalEffect: state.effect + (state.level === 7 ? 1 : 0),
    unadjusted: result.values[0],
    ipw: result.values[3],
    regression: result.values[2],
    aipw: result.values[4],
    clipped: result.clipped,
    before: state.level > 1 ? means(data.map(() => 1)) : null,
    after: state.level > 1 ? means(result.weights) : null,
  };
}
