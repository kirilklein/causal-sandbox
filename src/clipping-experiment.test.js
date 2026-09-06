import test from "node:test";
import assert from "node:assert/strict";
import { estimate } from "./simulation.js";
import { lessonBaseline, simulateLesson } from "./lesson-simulation.js";
import {
  fitClippingSample,
  clippingResult,
  cappedResult,
} from "./clipping-experiment.js";

const close = (actual, expected, tolerance = 1e-10) =>
  assert.ok(
    Math.abs(actual - expected) < tolerance,
    `${actual} != ${expected}`,
  );

const example = [
  { A: 1, Y: 4, p: 0.1, m0: 1, m1: 3 },
  { A: 0, Y: 1, p: 0.9, m0: 2, m1: 4 },
  { A: 1, Y: 8, p: 0.8, m0: 3, m1: 5 },
  { A: 0, Y: 3, p: 0.2, m0: 2, m1: 4 },
];

test("hand-calculated clipping preserves the two estimator normalizations", () => {
  const result = clippingResult(example, 0.2);
  assert.equal(result.available, true);
  assert.deepEqual(result.propensities, [0.2, 0.8, 0.8, 0.2]);
  result.weights.forEach((w, i) => close(w, [5, 5, 1.25, 1.25][i]));
  close(result.regression, 2);
  close(result.ipw, 3.4);
  close(result.aipw, 5.125);
  for (const arm of result.overlap) {
    assert.equal(arm.count, 2);
    assert.equal(arm.clipped, 1);
    close(arm.ess, 25 / 17);
    close(arm.topShare, 0.8);
    close(arm.maxWeight, 5);
    assert.equal(
      arm.bins.reduce((s, count) => s + count, 0),
      2,
    );
  }
});

test("threshold changes preserve raw fits, people, regression, and histogram bins", () => {
  const rows = example.map((row) => Object.freeze({ ...row }));
  Object.freeze(rows);
  const original = structuredClone(rows);
  const baseline = clippingResult(rows, 0);
  assert.deepEqual(
    baseline.propensities,
    rows.map(({ p }) => p),
  );
  for (const threshold of [0, 0.02, 0.1, 0.2, 0.5, 0]) {
    const result = clippingResult(rows, threshold);
    assert.equal(result.available, true);
    assert.equal(result.n, rows.length);
    assert.equal(result.regression, baseline.regression);
    assert.deepEqual(
      result.overlap.map(({ bins }) => bins),
      baseline.overlap.map(({ bins }) => bins),
    );
    assert.ok(
      result.weights.every(
        (w) => threshold === 0 || w <= 1 / threshold + 1e-12,
      ),
    );
    assert.deepEqual(rows, original);
  }
  assert.deepEqual(clippingResult(rows, 0), baseline);
  const collapsed = clippingResult(rows, 0.5);
  assert.deepEqual(collapsed.weights, [2, 2, 2, 2]);
  close(collapsed.ipw, 4); // Ordinary treated mean (6) minus untreated mean (2).
});

test("the default threshold reconciles existing fits in all nuisance-model choices", () => {
  for (const selection of [0.8, 3, 8]) {
    for (const outcomeQuadratic of [false, true]) {
      for (const treatmentQuadratic of [false, true]) {
        const state = {
          ...lessonBaseline(6),
          selection,
          outcomeQuadratic,
          treatmentQuadratic,
        };
        const data = simulateLesson(state);
        const original = structuredClone(data);
        const fit = estimate(data, ["C"], { ...state, aipwDetails: true });
        const rows = fitClippingSample(data, ["C"], state);
        assert.deepEqual(
          rows.map(({ p }) => p),
          fit.propensities,
        );
        rows.forEach((row, i) => {
          assert.equal(row.m0, fit.aipwContributions[i].m0);
          assert.equal(row.m1, fit.aipwContributions[i].m1);
        });
        const result = clippingResult(rows);
        assert.equal(result.available, true);
        close(result.regression, fit.values[2]);
        close(result.ipw, fit.values[3]);
        close(result.aipw, fit.values[4]);
        assert.equal(
          result.overlap.reduce((s, arm) => s + arm.clipped, 0),
          fit.clipped,
        );
        result.weights.forEach((w, i) => close(w, fit.weights[i]));
        if (selection === 8)
          assert.ok(rows.some(({ p }) => p < 0.02 || p > 0.98));
        assert.deepEqual(data, original);
      }
    }
  }
});

// Exactly balanced treatment counts within two equally prevalent strata.
// These enumerate a population expectation, without fitting or simulation noise.
function population(correctOutcome, heterogeneous = false) {
  return [0, 1].flatMap((C) =>
    Array.from({ length: 100 }, (_, i) => {
      const A = +(i < (C ? 90 : 10));
      const effect = 2 + (heterogeneous ? 4 * C : 0);
      return {
        A,
        Y: 10 * C + effect * A,
        p: C ? 0.9 : 0.1,
        m0: correctOutcome ? 10 * C : 0,
        m1: correctOutcome ? 10 * C + effect : 0,
      };
    }),
  );
}

test("clipping reduces weight concentration but can bias IPW and propensity-only AIPW", () => {
  const rows = population(false);
  const original = clippingResult(rows, 0);
  const clipped = clippingResult(rows, 0.2);
  close(original.ipw, 2);
  close(original.aipw, 2);
  close(clipped.ipw, 76 / 13);
  close(clipped.aipw, 4.75);
  for (const [i, arm] of clipped.overlap.entries()) {
    assert.ok(arm.maxWeight < original.overlap[i].maxWeight);
    assert.ok(arm.ess > original.overlap[i].ess);
  }
  for (const threshold of [0, 0.02, 0.2, 0.5]) {
    close(clippingResult(population(true), threshold).aipw, 2);
    close(clippingResult(population(true, true), threshold).aipw, 4);
  }
  const heterogeneous = clippingResult(population(false, true), 0);
  close(heterogeneous.ipw, 4);
  close(heterogeneous.aipw, 4);
});

test("repeated lesson studies expose the IPW bias/spread tradeoff with fixed fits", () => {
  const thresholds = [0, 0.02, 0.1];
  const studies = thresholds.map(() => []);
  for (let seed = 100; seed < 140; seed++) {
    const state = { ...lessonBaseline(10), selection: 3, seed };
    const rows = fitClippingSample(simulateLesson(state));
    thresholds.forEach((threshold, i) => {
      const result = clippingResult(rows, threshold);
      assert.equal(result.available, true);
      studies[i].push(result);
    });
  }
  const summaries = studies.map((runs) => {
    const mean = (key) =>
      runs.reduce((s, row) => s + row[key], 0) / runs.length;
    const ipw = mean("ipw");
    return {
      ipw,
      aipw: mean("aipw"),
      sd: Math.sqrt(
        runs.reduce((s, row) => s + (row.ipw - ipw) ** 2, 0) /
          (runs.length - 1),
      ),
    };
  });
  assert.ok(Math.abs(summaries[0].ipw - 2) < 0.12);
  assert.ok(summaries[1].ipw > summaries[0].ipw + 0.2);
  assert.ok(summaries[2].ipw > summaries[1].ipw + 0.5);
  assert.ok(summaries[1].sd < summaries[0].sd * 0.7);
  assert.ok(summaries[2].sd < summaries[1].sd * 0.8);
  // The outcome model is correct here; this is not protection for a wrong model.
  for (const { aipw } of summaries) assert.ok(Math.abs(aipw - 2) < 0.1);
});

test("the smaller preview study shows both benefit and cost across independent samples", () => {
  const summaries = [0, 0.01, 0.1].map((threshold) => ({
    threshold,
    squaredError: 0,
    improved: 0,
  }));
  for (let seed = 1000; seed < 1200; seed++) {
    const rows = fitClippingSample(
      simulateLesson({ ...lessonBaseline(10), n: 400, selection: 3, seed }),
    );
    const originalError = clippingResult(rows, 0).ipw - 2;
    for (const summary of summaries) {
      const result = clippingResult(rows, summary.threshold);
      assert.equal(result.available, true);
      const error = result.ipw - 2;
      summary.squaredError += error ** 2;
      summary.improved += +(Math.abs(error) < Math.abs(originalError) - 1e-12);
    }
  }
  assert.ok(summaries[1].squaredError < summaries[0].squaredError * 0.85);
  assert.ok(summaries[2].squaredError > summaries[0].squaredError * 2);
  assert.ok(summaries[1].improved > 0 && summaries[1].improved < 200);

  // Retain the existing seed; expose the smaller thresholds the old slider skipped.
  const rows = fitClippingSample(
    simulateLesson({ ...lessonBaseline(10), n: 400, selection: 3 }),
  );
  const originalError = Math.abs(clippingResult(rows, 0).ipw - 2);
  assert.ok(Math.abs(clippingResult(rows, 0.005).ipw - 2) < originalError);
  assert.ok(Math.abs(clippingResult(rows, 0.1).ipw - 2) > originalError);
});

test("unavailable data and calculations never masquerade as finite estimates", () => {
  assert.deepEqual(fitClippingSample([]), []);
  const cases = [
    [],
    example.filter(({ A }) => A === 1),
    ...[NaN, Infinity, -0.1, 1.1].map((p) => [
      { ...example[0], p },
      ...example.slice(1),
    ]),
    ...["Y", "m0", "m1", "A"].map((key) => [
      { ...example[0], [key]: NaN },
      ...example.slice(1),
    ]),
    [{ ...example[0], A: 2 }, ...example.slice(1)],
    [{ ...example[0], Y: Number.MAX_VALUE }, ...example.slice(1)],
  ];
  for (const rows of cases) {
    const result = clippingResult(rows);
    assert.equal(result.available, false);
    assert.ok(result.reason);
    assert.equal(result.ipw, undefined);
    assert.equal(result.aipw, undefined);
  }
  const endpoints = example.map((row) => ({ ...row, p: row.A ? 1 : 0 }));
  assert.equal(clippingResult(endpoints, 0).available, false);
  assert.equal(clippingResult(endpoints, 0.02).available, true);
  const tiny = [{ ...example[0], p: 1e-200 }, ...example.slice(1)];
  assert.equal(clippingResult(tiny, 0).available, false);
  assert.equal(clippingResult(tiny, 0.02).available, true);
  for (const threshold of [-0.1, 0.51, NaN, Infinity, "0.02", null])
    assert.throws(() => clippingResult(example, threshold), RangeError);
});

test("relabeling treatment reverses contrasts and exchanges the arm diagnostics", () => {
  const reversed = example.map(({ A, Y, p, m0, m1 }) => ({
    A: 1 - A,
    Y,
    p: 1 - p,
    m0: m1,
    m1: m0,
  }));
  for (const threshold of [0, 0.02, 0.2, 0.5]) {
    const original = clippingResult(example, threshold);
    const result = clippingResult(reversed, threshold);
    close(result.ipw, -original.ipw);
    close(result.aipw, -original.aipw);
    close(result.regression, -original.regression);
    result.weights.forEach((w, i) => close(w, original.weights[i]));
    result.overlap.forEach((arm, i) =>
      close(arm.ess, original.overlap[1 - i].ess),
    );
  }
});

test("weight capping preserves raw scores and uses the two estimator normalizations", () => {
  const rows = Object.freeze(example.map((row) => Object.freeze({ ...row })));
  const result = cappedResult(rows, 5);
  assert.equal(result.available, true);
  assert.deepEqual(result.weights, [5, 5, 1.25, 1.25]);
  close(result.ipw, 3.4);
  close(result.aipw, 5.125);
  close(result.regression, 2);
  assert.deepEqual(
    result.propensities,
    rows.map(({ p }) => p),
  );
  assert.deepEqual(
    result.overlap.map(({ capped }) => capped),
    [1, 1],
  );
  assert.deepEqual(
    result.overlap.map(({ clipped }) => clipped),
    [0, 0],
  );
  const original = clippingResult(rows, 0);
  const unlimited = cappedResult(rows);
  for (const key of [
    "weights",
    "propensities",
    "overlap",
    "ipw",
    "aipw",
    "regression",
  ])
    assert.deepEqual(unlimited[key], original[key]);
  close(cappedResult(rows, 1).ipw, 4); // All weights equal 1: treated mean minus untreated mean.
  const reversed = rows.map(({ A, p, m0, m1, ...rest }) => ({
    ...rest,
    A: 1 - A,
    p: 1 - p,
    m0: m1,
    m1: m0,
  }));
  close(cappedResult(reversed, 5).ipw, -result.ipw);
  close(cappedResult(reversed, 5).aipw, -result.aipw);
});

test("capping leaves small weights unchanged where probability clipping increases them", () => {
  const rows = [
    { A: 1, Y: 4, p: 0.99, m0: 1, m1: 3 },
    { A: 0, Y: 1, p: 0.01, m0: 1, m1: 3 },
    { A: 1, Y: 6, p: 0.01, m0: 1, m1: 3 },
    { A: 0, Y: 2, p: 0.99, m0: 1, m1: 3 },
  ];
  const capped = cappedResult(rows, 10);
  const clipped = clippingResult(rows, 0.1);
  close(capped.weights[0], 1 / 0.99);
  close(capped.weights[1], 1 / 0.99);
  close(clipped.weights[0], 1 / 0.9);
  close(clipped.weights[1], 1 / 0.9);
  close(capped.weights[2], 10);
  close(capped.weights[3], 10);
  assert.deepEqual(
    capped.overlap.map(({ bins }) => bins),
    clipped.overlap.map(({ bins }) => bins),
  );
  assert.notEqual(capped.ipw, clipped.ipw);
});

test("capping can concentrate estimates away from truth and does not restore propensity-only AIPW", () => {
  const rows = population(false, true);
  close(cappedResult(rows).ipw, 4);
  close(cappedResult(rows).aipw, 4);
  assert.ok(cappedResult(rows, 5).ipw > 4);
  assert.ok(cappedResult(rows, 5).aipw > 4);
  close(cappedResult(population(true, true), 5).aipw, 4);
  for (const bad of [0, -1, NaN, -Infinity, "5", null])
    assert.throws(() => cappedResult(example, bad), RangeError);
  for (const rows of [
    [],
    [example[0]],
    [{ ...example[0], p: 0 }, example[1]],
    [{ ...example[0], Y: Infinity }, example[1]],
  ])
    assert.equal(cappedResult(rows, 5).available, false);
});
