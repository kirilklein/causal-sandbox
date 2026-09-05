import { makeNoise, estimate } from "./simulation.js";

// Complete lesson state; no advanced sandbox setting is shared with this world.
export function lessonBaseline(level) {
  if (![1, 2, 3, 4, 5, 6, 7, 8, 9, 10].includes(level))
    throw new Error("Unknown lesson");
  return {
    level,
    ...(level === 9 ? { hiddenStrength: 0 } : {}),
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

// One measured baseline variable; level 9 adds unmeasured smoking status.
export function simulateLesson(state, noise = makeNoise(state.n, state.seed)) {
  return noise.map(({ C1: C, U: smokingDraw, a, eY, eM, eK }) => {
    const U = +(smokingDraw > 0);
    const hiddenInfluence =
      state.level === 9 ? state.hiddenStrength * (U - 0.5) : 0;
    const A = +(
      a <
      1 /
        (1 +
          Math.exp(
            0.8 -
              state.selection * C -
              state.treatmentCurve * (C ** 2 - 1) -
              hiddenInfluence,
          ))
    );
    const M = state.level === 7 ? A + eM : 0;
    const Y =
      state.effect * A +
      state.outcomeInfluence * C +
      state.outcomeCurve * (C ** 2 - 1) +
      M +
      hiddenInfluence +
      eY;
    return {
      ...(state.level > 1 ? { C } : {}),
      ...(state.level === 9 ? { U } : {}),
      A,
      Y,
      ...(state.level === 7 ? { M } : {}),
      ...(state.level === 8 ? { K: A + Y + eK } : {}),
    };
  });
}

export function lessonResult(state, noise) {
  const world = simulateLesson(state, noise);
  // U is available only to the simulator, never to the analyst. C remains measured.
  const data =
    state.level === 9 ? world.map(({ A, C, Y }) => ({ A, C, Y })) : world;
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
    ...(state.level === 10
      ? {
          overlap: overlapDiagnostics(
            data,
            result.propensities,
            result.weights,
          ),
        }
      : {}),
    before: state.level > 1 ? means(data.map(() => 1)) : null,
    after: state.level > 1 ? means(result.weights) : null,
  };
}

// Histogram uses fitted probabilities before clipping; weight summaries use
// the exact clipped weights used by IPW and the AIPW residual correction.
export function overlapDiagnostics(data, propensities, weights) {
  return [0, 1].map((arm) => {
    const bins = Array(10).fill(0);
    const armWeights = [];
    data.forEach((d, i) => {
      if (d.A !== arm) return;
      bins[Math.min(9, Math.floor(propensities[i] * 10))]++;
      armWeights.push(weights[i]);
    });
    armWeights.sort((a, b) => b - a);
    const sum = armWeights.reduce((s, w) => s + w, 0);
    const squares = armWeights.reduce((s, w) => s + w * w, 0);
    const topCount = Math.ceil(armWeights.length * 0.01);
    return {
      count: armWeights.length,
      bins,
      ess: sum ? (sum * sum) / squares : null,
      topCount,
      topShare: sum
        ? armWeights.slice(0, topCount).reduce((s, w) => s + w, 0) / sum
        : null,
    };
  });
}
