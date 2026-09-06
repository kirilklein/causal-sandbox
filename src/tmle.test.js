import test from "node:test";
import assert from "node:assert/strict";
import { targetContinuousAte } from "./tmle.js";
import { estimate } from "./simulation.js";
import { lessonBaseline, simulateLesson } from "./lesson-simulation.js";

const mean = (values) =>
  values.reduce((sum, value) => sum + value, 0) / values.length;
const close = (actual, expected, tolerance = 1e-10) =>
  assert.ok(
    Math.abs(actual - expected) < tolerance,
    `${actual} != ${expected}`,
  );
const data = [
  { A: 0, Y: 1 },
  { A: 1, Y: 4 },
];
const fits = { m0: [0, 1], m1: [2, 3], propensities: [0.25, 0.5] };

test("continuous targeting matches a rational example and differs from initial AIPW", () => {
  // H = (-4/3, 2), r = (1, 1); epsilon = (2/3)/(52/9) = 3/26.
  const result = targetContinuousAte(data, fits);
  assert.equal(result.status, "ok");
  close(result.epsilon, 3 / 26);
  close(result.estimate, 33 / 13);
  close(result.initialEstimate, 2);
  close(result.correctionBefore, 1 / 3);
  close(result.correctionAfter, 0);
  result.m0.forEach((value, i) => close(value, [-2 / 13, 10 / 13][i]));
  result.m1.forEach((value, i) => close(value, [32 / 13, 42 / 13][i]));
  // The aggregate loss is minimized, but this person's prediction gets worse.
  assert.ok(
    Math.abs(data[0].Y - result.m0[0]) > Math.abs(data[0].Y - fits.m0[0]),
  );
  assert.ok(Math.abs(result.estimate - (2 + 1 / 3)) > 0.2);
  const influence = data.map(
    (row, i) =>
      result.cleverCovariate[i] *
        (row.Y - (row.A ? result.m1[i] : result.m0[i])) +
      result.m1[i] -
      result.m0[i] -
      result.estimate,
  );
  close(mean(influence), 0);
});

test("targeting preserves inputs and obeys treatment and outcome relabeling", () => {
  const original = structuredClone({ data, fits });
  const result = targetContinuousAte(data, fits);
  assert.deepEqual({ data, fits }, original);
  const reversed = targetContinuousAte(
    data.map((row) => ({ ...row, A: 1 - row.A })),
    {
      m0: fits.m1,
      m1: fits.m0,
      propensities: fits.propensities.map((p) => 1 - p),
    },
  );
  close(reversed.estimate, -result.estimate);
  close(reversed.epsilon, -result.epsilon);
  for (const scale of [-3, 0, 2]) {
    const transform = (y) => scale * y + 7;
    const changed = targetContinuousAte(
      data.map((row) => ({ ...row, Y: transform(row.Y) })),
      {
        m0: fits.m0.map(transform),
        m1: fits.m1.map(transform),
        propensities: fits.propensities,
      },
    );
    assert.equal(changed.status, "ok");
    close(changed.estimate, scale * result.estimate);
    close(changed.epsilon, scale * result.epsilon);
  }
});

test("an exact heterogeneous population isolates the two robustness conditions", () => {
  // Equally common strata: g=(.2,.8), Q0=(0,3), effects=(1,3), ATE=2.
  // Opposite residuals within each arm/stratum keep every conditional mean exact.
  const population = [];
  for (const C of [0, 1]) {
    for (let i = 0; i < 100; i++) {
      const A = +(i < (C ? 80 : 20));
      population.push({
        A,
        Y: 3 * C + A * (1 + 2 * C) + (i % 2 ? 0.5 : -0.5),
        C,
      });
    }
  }
  for (const correctOutcome of [false, true]) {
    for (const correctTreatment of [false, true]) {
      const result = targetContinuousAte(population, {
        m0: population.map(({ C }) => (correctOutcome ? 3 * C : 0)),
        m1: population.map(({ C }) => (correctOutcome ? 1 + 5 * C : 0)),
        propensities: population.map(({ C }) =>
          correctTreatment ? (C ? 0.8 : 0.2) : 0.5,
        ),
      });
      assert.equal(result.status, "ok");
      close(result.correctionAfter, 0);
      if (correctOutcome || correctTreatment) close(result.estimate, 2);
      else close(result.estimate, 4.4);
      if (correctOutcome) close(result.epsilon, 0);
    }
  }
});

test("clipping is explicit and used in the fit and both counterfactual updates", () => {
  const raw = [0, 1, 0.01, 0.99, 0.02, 0.98];
  const rows = raw.map((_, i) => ({ A: i % 2, Y: i - 2 }));
  const predictions = {
    m0: raw.map(() => 0),
    m1: raw.map(() => 1),
    propensities: raw,
  };
  const result = targetContinuousAte(rows, predictions);
  assert.equal(result.status, "ok");
  assert.equal(result.clipped, 4);
  assert.deepEqual(result.propensities, [0.02, 0.98, 0.02, 0.98, 0.02, 0.98]);
  const alreadyClipped = targetContinuousAte(rows, {
    ...predictions,
    propensities: result.propensities,
  });
  close(result.estimate, alreadyClipped.estimate);
  close(result.correctionAfter, 0);
  rows.forEach((row, i) => {
    const p = result.propensities[i];
    close(result.m0[i], -result.epsilon / (1 - p));
    close(result.m1[i], 1 + result.epsilon / p);
  });
});

test("successful targeting does not repair a clipped correct propensity with wrong outcomes", () => {
  const population = [];
  for (const C of [0, 1]) {
    for (let i = 0; i < 1000; i++) {
      const A = +(i < (C ? 999 : 1));
      population.push({ A, Y: 2 * A + 3 * C, C });
    }
  }
  const result = targetContinuousAte(population, {
    m0: population.map(() => 0),
    m1: population.map(() => 0),
    propensities: population.map(({ C }) => (C ? 0.999 : 0.001)),
  });
  assert.equal(result.status, "ok");
  assert.equal(result.clipped, 2000);
  close(result.correctionAfter, 0);
  assert.ok(Math.abs(result.estimate - 2) > 1);
});

test("unavailable inputs and numerical failure never return a fallback estimate", () => {
  const unavailable = (rows, predictions, reason) =>
    assert.deepEqual(targetContinuousAte(rows, predictions), {
      status: "unavailable",
      reason,
    });
  unavailable([], { m0: [], m1: [], propensities: [] }, "empty-sample");
  for (const A of [0, 1])
    unavailable(
      data.map((row) => ({ ...row, A })),
      fits,
      "missing-treatment-arm",
    );
  for (const value of [NaN, Infinity, -Infinity, null, "1", undefined]) {
    unavailable([{ A: 0, Y: value }, data[1]], fits, "invalid-input");
    for (const key of ["m0", "m1", "propensities"])
      unavailable(
        data,
        { ...fits, [key]: [value, fits[key][1]] },
        "invalid-input",
      );
  }
  for (const A of [-1, 2, true, "0"])
    unavailable([{ A, Y: 1 }, data[1]], fits, "invalid-input");
  for (const p of [-0.1, 1.1])
    unavailable(data, { ...fits, propensities: [p, 0.5] }, "invalid-input");
  unavailable(
    [
      { A: 0, Y: -Number.MAX_VALUE },
      { A: 1, Y: Number.MAX_VALUE },
    ],
    fits,
    "non-finite-targeting",
  );
  unavailable(
    [
      { A: 0, Y: 1e16 + 2 },
      { A: 1, Y: 1e16 },
    ],
    {
      m0: [1e16, 1e16],
      m1: [1e16, 1e16],
      propensities: fits.propensities,
    },
    "targeting-not-solved",
  );
  assert.throws(
    () => targetContinuousAte(data, { ...fits, m0: [0] }),
    TypeError,
  );
  assert.throws(
    () => targetContinuousAte(data, { ...fits, propensities: null }),
    TypeError,
  );
});

test("TMLE with existing nuisance fits across 40 independent nonlinear lesson samples", (t) => {
  const specs = [
    { outcomeQuadratic: false, treatmentQuadratic: false },
    { outcomeQuadratic: true, treatmentQuadratic: false },
    { outcomeQuadratic: false, treatmentQuadratic: true },
    { outcomeQuadratic: true, treatmentQuadratic: true },
  ];
  const errors = specs.map(() => []);
  for (let seed = 100; seed < 140; seed++) {
    const rows = simulateLesson({ ...lessonBaseline(6), seed });
    specs.forEach((spec, j) => {
      const fit = estimate(rows, ["C"], { ...spec, predictionPoints: rows });
      // The current model is additive in A, so its standardized contrast is
      // the common fitted treatment coefficient. No shared fit output is added.
      const result = targetContinuousAte(rows, {
        m0: fit.predictions.map((p) => p.outcome),
        m1: fit.predictions.map((p) => p.outcome + fit.values[2]),
        propensities: fit.propensities,
      });
      assert.equal(result.status, "ok");
      close(result.correctionAfter, 0);
      errors[j].push(result.estimate - 2);
    });
  }
  errors.forEach((values, j) => {
    const bias = mean(values),
      sd = Math.sqrt(
        values.reduce((sum, value) => sum + (value - bias) ** 2, 0) /
          (values.length - 1),
      );
    t.diagnostic(
      `${JSON.stringify(specs[j])}: bias=${bias.toFixed(4)}, SD=${sd.toFixed(4)}, MCSE=${(sd / Math.sqrt(values.length)).toFixed(4)}`,
    );
    if (j) assert.ok(Math.abs(bias) < 0.1, `bias=${bias}`);
    else assert.ok(Math.abs(bias) > 0.5, `bias=${bias}`);
  });
});
