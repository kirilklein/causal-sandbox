import { makeNoise } from "./simulation.js";
import {
  lessonBaseline,
  simulateLesson,
  ipwCalculation,
} from "./lesson-simulation.js";
import { fitClippingSample } from "./clipping-experiment.js";

export function trimmingSample({
  n = 400,
  seed = 4217,
  selection = 3,
  heterogeneous = false,
} = {}) {
  const state = { ...lessonBaseline(10), n, seed, selection };
  const noise = makeNoise(n, seed);
  // Extend only this experiment: the same equation supplies observed and forced outcomes.
  const world = (draws) =>
    simulateLesson(state, draws).map((row) => ({
      ...row,
      Y: row.Y + (heterogeneous ? row.A * (row.C ** 2 - 1) : 0),
    }));
  const data = world(noise);
  // Paired interventions use the same outcome equation and background draws.
  // Only the observed data enter the fit; truth stays in a separate array.
  const untreated = world(noise.map((row) => ({ ...row, a: 1 })));
  const treated = world(noise.map((row) => ({ ...row, a: -1 })));
  return {
    rows: fitClippingSample(data),
    effects: treated.map((row, i) => row.Y - untreated[i].Y),
  };
}

function summarize(rows, effects, indices) {
  const data = indices.map((i) => rows[i]);
  const n = data.length;
  const counts = [0, 1].map((arm) => data.filter(({ A }) => A === arm).length);
  const truth = n ? indices.reduce((sum, i) => sum + effects[i] / n, 0) : null;
  const base = { n, counts, truth };
  const unavailable = (reason) => ({
    ...base,
    available: false,
    reason,
    ipw: null,
  });
  if (!n) return unavailable("No people in this group.");
  if (counts.includes(0))
    return unavailable("Both treatment arms are required.");
  if (data.some(({ Y }) => !Number.isFinite(Y)))
    return unavailable("Finite observed outcomes are required.");
  if (data.some(({ p }) => p === 0 || p === 1))
    return unavailable("Unclipped scores must be strictly between 0 and 1.");
  const weights = data.map(({ A, p }) => 1 / (A ? p : 1 - p));
  const arms = ipwCalculation(data, weights);
  const ipw = arms[1].mean - arms[0].mean;
  if (
    !weights.every(Number.isFinite) ||
    !arms.every(({ mean, weightedSum, totalWeight }) =>
      [mean, weightedSum, totalWeight].every(Number.isFinite),
    ) ||
    !Number.isFinite(ipw)
  )
    return unavailable(
      "Weight calculations exceeded the finite numeric range.",
    );
  return { ...base, available: true, ipw };
}

export function trimmingResult(rows, effects, threshold = 0) {
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 0.5)
    throw new RangeError("Trimming threshold must be between 0 and 0.5.");
  // Invalid membership inputs cannot define a meaningful partition/histogram.
  if (
    rows.some(
      ({ A, p }) =>
        (A !== 0 && A !== 1) || !Number.isFinite(p) || p < 0 || p > 1,
    )
  )
    throw new RangeError(
      "Valid treatment arms and propensity scores are required.",
    );
  if (effects.length !== rows.length || !effects.every(Number.isFinite))
    throw new RangeError(
      "One finite potential-outcome difference per person is required.",
    );

  const retained = [];
  const excluded = [];
  const histogram = [0, 1].map(() => ({
    count: 0,
    retained: Array(10).fill(0),
    excluded: Array(10).fill(0),
  }));
  rows.forEach(({ A, p }, i) => {
    const keep = p >= threshold && p <= 1 - threshold;
    (keep ? retained : excluded).push(i);
    histogram[A].count++;
    histogram[A][keep ? "retained" : "excluded"][
      Math.min(9, Math.floor(p * 10))
    ]++;
  });
  return {
    threshold,
    retained,
    excluded,
    histogram,
    groups: {
      everyone: summarize(
        rows,
        effects,
        rows.map((_, i) => i),
      ),
      retained: summarize(rows, effects, retained),
      excluded: summarize(rows, effects, excluded),
    },
  };
}
