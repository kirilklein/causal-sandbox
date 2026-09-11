import { lessonBaseline, simulateLesson } from "./lesson-simulation.js";

export const normalCritical = 1.959963984540054;
export const uncertaintyBaseline = {
  n: 200,
  seed: 4217,
  selection: 0,
  effect: 2,
};

export const normalDensity = (z) =>
  Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);

// Numerical Recipes' erfc approximation; absolute error below 1.5e-7.
// Evaluate the tail directly to avoid subtracting a CDF close to one.
export function twoSidedP(z) {
  if (!Number.isFinite(z)) throw new TypeError("Test statistic must be finite");
  if (z === 0) return 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.5 * x);
  return Math.min(
    1,
    t *
      Math.exp(
        -x * x -
          1.26551223 +
          t *
            (1.00002368 +
              t *
                (0.37409196 +
                  t *
                    (0.09678418 +
                      t *
                        (-0.18628806 +
                          t *
                            (0.27886807 +
                              t *
                                (-1.13520398 +
                                  t *
                                    (1.48851587 +
                                      t * (-0.82215223 + t * 0.17087277)))))))),
      ),
  );
}

export function normalInference(estimate, se) {
  if (!Number.isFinite(estimate) || !Number.isFinite(se) || se <= 0)
    throw new RangeError(
      "Inference needs a finite estimate and a positive standard error",
    );
  const z = estimate / se;
  return {
    status: "ok",
    estimate,
    se,
    z,
    lower: estimate - normalCritical * se,
    upper: estimate + normalCritical * se,
    p: twoSidedP(z),
  };
}

// Independent people; separate sample variances allow unequal arm variances.
// This is large-sample normal inference for the unadjusted mean difference.
export function differenceInference(rows) {
  const arms = [[], []];
  for (const { A, Y } of rows) {
    if (![0, 1].includes(A) || !Number.isFinite(Y))
      throw new TypeError("Expected binary treatment and finite outcomes");
    arms[A].push(Y);
  }
  if (arms.some((arm) => arm.length < 2))
    return {
      status: "unavailable",
      reason: "At least two people are needed in each treatment group.",
    };
  const summaries = arms.map((ys) => {
    const mean = ys.reduce((sum, y) => sum + y, 0) / ys.length;
    const variance =
      ys.reduce((sum, y) => sum + (y - mean) ** 2, 0) / (ys.length - 1);
    return { n: ys.length, mean, variance };
  });
  const se = Math.sqrt(
    summaries.reduce((sum, arm) => sum + arm.variance / arm.n, 0),
  );
  if (se === 0)
    return {
      status: "unavailable",
      reason:
        "There is no estimated within-group variation; this interval method is unavailable.",
    };
  return {
    ...normalInference(summaries[1].mean - summaries[0].mean, se),
    arms: summaries,
  };
}

export function uncertaintyStudy(settings = uncertaintyBaseline) {
  const state = { ...lessonBaseline(2), ...uncertaintyBaseline, ...settings };
  if (
    !Number.isInteger(state.n) ||
    state.n < 4 ||
    !Number.isInteger(state.seed) ||
    !Number.isFinite(state.selection) ||
    !Number.isFinite(state.effect)
  )
    throw new RangeError("Invalid study settings");
  const result = differenceInference(simulateLesson(state));
  return { ...result, seed: state.seed, truth: state.effect, n: state.n };
}

export function coverageSummary(studies) {
  const valid = studies.filter((study) => study.status === "ok");
  return {
    total: studies.length,
    valid: valid.length,
    covered: valid.filter((s) => s.lower <= s.truth && s.truth <= s.upper)
      .length,
    unavailable: studies.length - valid.length,
  };
}
