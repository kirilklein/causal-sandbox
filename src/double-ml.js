import { makeNoise, random } from "./simulation.js";
import { normalInference, coverageSummary } from "./uncertainty.js";

// Target: the average treatment effect E[Y(1) − Y(0)] in the curved AIPW world.
// Exchangeability given C and positivity hold by construction; the lesson
// varies only how nuisance functions are learned and where they are evaluated.
export const doubleMlBaseline = {
  n: 600,
  effect: 2,
  selection: 0.8,
  outcomeInfluence: 1.5,
  outcomeCurve: 2,
  treatmentCurve: 0.9,
  outcomeK: 1,
  propensityK: 60,
  folds: 5,
  seed: 31000,
};
export const propensityBounds = [0.02, 0.98];

const sigmoid = (x) => 1 / (1 + Math.exp(-x));
export const trueOutcome = (C, A, s = doubleMlBaseline) =>
  s.effect * A + s.outcomeInfluence * C + s.outcomeCurve * (C ** 2 - 1);
export const trueTreatment = (C, s = doubleMlBaseline) =>
  sigmoid(-0.8 + s.selection * C + s.treatmentCurve * (C ** 2 - 1));

// Same equations as the AIPW lesson world, at the lesson's sample size.
export function doubleMlSample(settings = doubleMlBaseline) {
  const s = { ...doubleMlBaseline, ...settings };
  return makeNoise(s.n, s.seed).map(({ C1: C, a, eY }) => {
    const A = +(a < trueTreatment(C, s));
    return { C, A, Y: trueOutcome(C, A, s) + eY };
  });
}

// Positions (in `training`) of the k rows nearest to x on C. Ties keep the
// earlier training row, so results do not depend on floating-point luck.
export function knnNeighbors(training, k) {
  if (!Number.isInteger(k) || k < 1)
    throw new RangeError("k must be a positive integer");
  if (k > training.length)
    throw new RangeError("k cannot exceed the training size");
  const sorted = training
    .map((d, i) => ({ C: d.C, i }))
    .sort((p, q) => p.C - q.C || p.i - q.i);
  return (x) => {
    let lo = 0,
      hi = sorted.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (sorted[mid].C < x) lo = mid + 1;
      else hi = mid;
    }
    let left = lo - 1,
      right = lo;
    const chosen = [];
    while (chosen.length < k) {
      const dl = left >= 0 ? x - sorted[left].C : Infinity;
      const dr = right < sorted.length ? sorted[right].C - x : Infinity;
      const takeLeft =
        dl < dr || (dl === dr && sorted[left].i < sorted[right].i);
      chosen.push(takeLeft ? sorted[left--].i : sorted[right++].i);
    }
    return chosen;
  };
}

// Mean of the k training values nearest to x on C.
export function knnRegression(training, k, value = (d) => d.Y) {
  const neighbors = knnNeighbors(training, k);
  const values = training.map(value);
  return (x) => neighbors(x).reduce((s, i) => s + values[i], 0) / k;
}

// Which rows of `data` train the arm-A outcome prediction for row `row`:
// all same-arm rows (in-sample) or same-arm rows outside its fold.
export function outcomeNeighbors(data, row, { k, foldOf, crossFit }) {
  const pool = data.flatMap((d, i) =>
    d.A === data[row].A && (!crossFit || foldOf[i] !== foldOf[row]) ? [i] : [],
  );
  return knnNeighbors(
    pool.map((i) => data[i]),
    k,
  )(data[row].C).map((j) => pool[j]);
}

// Same-arm rows nearest to `row` on C (the row itself included), for zooming in.
export function zoomRows(data, row, size) {
  const pool = data.flatMap((d, i) => (d.A === data[row].A ? [i] : []));
  return knnNeighbors(
    pool.map((i) => data[i]),
    Math.min(size, pool.length),
  )(data[row].C).map((j) => pool[j]);
}

// A typical person to illustrate one prediction: untreated, near the middle
// of C, with a cross-fitted residual closest to the root mean square residual.
export function typicalRow(data, estimates) {
  const residuals = estimates.crossFit.residuals;
  const rms = Math.sqrt(
    residuals.reduce((s, r) => s + r * r, 0) / residuals.length,
  );
  let best = -1;
  data.forEach((d, i) => {
    if (d.A !== 0 || Math.abs(d.C) >= 0.5) return;
    const gap = Math.abs(Math.abs(residuals[i]) - rms);
    if (best < 0 || gap < Math.abs(Math.abs(residuals[best]) - rms)) best = i;
  });
  if (best < 0)
    throw new RangeError("No untreated person near the middle of C");
  return best;
}

// Balanced random partition: fold sizes differ by at most one.
export function foldAssignment(n, folds, seed) {
  if (!Number.isInteger(folds) || folds < 2 || folds > n)
    throw new RangeError("Need at least two folds and one row per fold");
  const order = Array.from({ length: n }, (_, i) => i);
  const r = random(seed);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const foldOf = Array(n);
  order.forEach((row, position) => (foldOf[row] = position % folds));
  return foldOf;
}

const clip = (p) =>
  Math.min(propensityBounds[1], Math.max(propensityBounds[0], p));

// Fit outcome regressions per arm and the propensity on `training`,
// then predict at each row of `evaluation`.
function nuisances(training, evaluation, { outcomeK, propensityK }) {
  const arms = [0, 1].map((arm) => training.filter((d) => d.A === arm));
  if (arms.some((rows) => rows.length < outcomeK))
    return {
      reason: `A training set has fewer than ${outcomeK} people in one treatment group.`,
    };
  if (training.length < propensityK)
    return {
      reason: `A training set has fewer than ${propensityK} people.`,
    };
  const [fit0, fit1] = arms.map((rows) => knnRegression(rows, outcomeK));
  const fitP = knnRegression(training, propensityK, (d) => d.A);
  return {
    rows: evaluation.map((d) => ({
      m0: fit0(d.C),
      m1: fit1(d.C),
      p: clip(fitP(d.C)),
    })),
  };
}

// Uncentered AIPW (efficient influence function) score for the ATE.
export function aipwScore({ A, Y }, { m0, m1, p }) {
  const mA = A ? m1 : m0;
  const weight = A ? 1 / p : -1 / (1 - p);
  return m1 - m0 + weight * (Y - mA);
}

const mean = (values) => values.reduce((s, v) => s + v, 0) / values.length;

/**
 * Three estimators of the same ATE from one sample:
 *  plugIn   — mean(m1 − m0), nuisances fitted on all rows;
 *  inSample — AIPW score, nuisances fitted and evaluated on all rows;
 *  crossFit — AIPW score, each row's nuisances fitted on the other folds.
 * Scores give an influence-function SE; the plug-in has none here.
 */
export function doubleMlEstimates(data, settings = {}) {
  const s = { ...doubleMlBaseline, ...settings };
  const full = nuisances(data, data, s);
  if (!full.rows) return { status: "unavailable", reason: full.reason };
  const foldOf = foldAssignment(data.length, s.folds, s.seed ^ 0x2f6b);
  const crossRows = Array(data.length);
  for (let fold = 0; fold < s.folds; fold++) {
    const held = data.flatMap((_, i) => (foldOf[i] === fold ? [i] : []));
    const fitted = nuisances(
      data.filter((_, i) => foldOf[i] !== fold),
      held.map((i) => data[i]),
      s,
    );
    if (!fitted.rows) return { status: "unavailable", reason: fitted.reason };
    held.forEach((row, j) => (crossRows[row] = fitted.rows[j]));
  }
  const scored = (rows) => {
    const psi = data.map((d, i) => aipwScore(d, rows[i]));
    const est = mean(psi);
    const sd = Math.sqrt(
      psi.reduce((t, v) => t + (v - est) ** 2, 0) / (psi.length - 1),
    );
    return {
      ...normalInference(est, sd / Math.sqrt(psi.length)),
      residuals: data.map((d, i) => d.Y - (d.A ? rows[i].m1 : rows[i].m0)),
      psi,
    };
  };
  return {
    status: "ok",
    foldOf,
    plugIn: { estimate: mean(full.rows.map((r) => r.m1 - r.m0)) },
    inSample: scored(full.rows),
    crossFit: scored(crossRows),
  };
}

export const estimatorKeys = ["plugIn", "inSample", "crossFit"];

// Repeated studies from fixed seeds; the truth is the simulated ATE.
export function doubleMlStudies(settings = {}, count = 100) {
  const s = { ...doubleMlBaseline, ...settings };
  return Array.from({ length: count }, (_, i) => {
    const seed = s.seed + i;
    const result = doubleMlEstimates(doubleMlSample({ ...s, seed }), {
      ...s,
      seed,
    });
    return { seed, truth: s.effect, ...result };
  });
}

// Bias, spread, and (for score estimators) interval coverage per estimator.
export function doubleMlSummary(studies) {
  const ok = studies.filter((study) => study.status === "ok");
  const truth = studies[0]?.truth;
  return Object.fromEntries(
    estimatorKeys.map((key) => {
      const values = ok.map((study) => study[key].estimate);
      const avg = mean(values);
      const sd = Math.sqrt(
        values.reduce((t, v) => t + (v - avg) ** 2, 0) / (values.length - 1),
      );
      const summary = {
        count: values.length,
        unavailable: studies.length - ok.length,
        bias: avg - truth,
        sd,
        mcse: sd / Math.sqrt(values.length),
      };
      if (key !== "plugIn") {
        const coverage = coverageSummary(
          ok.map((study) => ({ ...study[key], truth })),
        );
        summary.coverage = coverage.covered / coverage.valid;
        summary.meanSE = mean(ok.map((study) => study[key].se));
      }
      return [key, summary];
    }),
  );
}
