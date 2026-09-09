import test from "node:test";
import assert from "node:assert/strict";
import { estimate, EstimationError, fitPropensity } from "./simulation.js";
import { lessonBaseline, lessonResult } from "./lesson-simulation.js";
import {
  extent,
  propensityBaseline,
  propensityCohort,
  propensityContours,
} from "./propensity-experiment.js";

test("assignment controls preserve people and random draws, and reset reproduces the cohort", () => {
  const baseline = propensityCohort(propensityBaseline);
  const changed = propensityCohort({
    ...propensityBaseline,
    age: 2,
    severity: -2,
  });
  const positions = (data) =>
    data.map(({ person, C1, C2, age, severity, jitter }) => ({
      person,
      C1,
      C2,
      age,
      severity,
      jitter,
    }));
  assert.deepEqual(positions(baseline), positions(changed));
  assert.ok(baseline.some((d, i) => d.A !== changed[i].A));
  assert.deepEqual(propensityCohort(propensityBaseline), baseline);
  assert.notDeepEqual(
    propensityCohort({ ...propensityBaseline, seed: 4218 }),
    baseline,
  );
});

test("the treatment-only fit matches IPW raw scores and never reads outcomes", () => {
  const data = propensityCohort({ ...propensityBaseline, age: 2, severity: 2 });
  const fit = fitPropensity(data, ["C"]);
  const existing = estimate(data, ["C"], {
    strict: true,
    predictionPoints: data,
  });
  assert.deepEqual(fit.propensities, existing.propensities);
  assert.deepEqual(
    data.map(fit.predict),
    existing.predictions.map((p) => p.treatment),
  );
  assert.deepEqual(
    fitPropensity(
      data.map(({ C1, C2, A }) => ({ C1, C2, A })),
      ["C"],
    ).propensities,
    fit.propensities,
  );
  assert.ok(fit.propensities.some((p) => p < 0.02 || p > 0.98));
  assert.ok(fit.propensities.every((p) => p > 0 && p < 1));
});

test("preview fits the same single-C sample before and after Try IPW", () => {
  const state = lessonBaseline(3);
  const before = lessonResult(state);
  const after = lessonResult({ ...state, adjusted: true });
  assert.deepEqual(before.propensityData, after.propensityData);
  assert.ok(before.propensityData.every((d) => !("C1" in d) && !("C2" in d)));
  const fit = fitPropensity(before.propensityData, ["C"]);
  assert.deepEqual(
    fit.propensities,
    estimate(after.propensityData, ["C"]).propensities,
  );
  assert.equal(lessonResult(state).ipw, before.ipw);
});

test("contour endpoints lie on the fitted probability, including vertical and horizontal contours", () => {
  for (const beta of [
    [-0.4, 0.8, 0.8],
    [0, 1, 0],
    [0, 0, 1],
    [0, -2, 2],
  ]) {
    const contours = propensityContours(beta);
    assert.equal(contours.length, 3);
    for (const { p, points } of contours) {
      for (const { C1, C2 } of [
        ...points,
        {
          C1: (points[0].C1 + points[1].C1) / 2,
          C2: (points[0].C2 + points[1].C2) / 2,
        },
      ]) {
        assert.ok(
          Math.abs(C1) <= extent + 1e-9 && Math.abs(C2) <= extent + 1e-9,
        );
        assert.ok(
          Math.abs(
            1 / (1 + Math.exp(-beta[0] - beta[1] * C1 - beta[2] * C2)) - p,
          ) < 1e-12,
        );
      }
    }
  }
  assert.deepEqual(propensityContours([0, 0, 0]), []);
  assert.deepEqual(propensityContours([20, 0.1, 0.1]), []);
});

test("bounded controls fit across repeated samples; average coefficients recover assignment relationships", () => {
  const totals = [0, 0, 0];
  for (let seed = 100; seed < 140; seed++) {
    const baseline = fitPropensity(
      propensityCohort({ ...propensityBaseline, seed }),
      ["C"],
    );
    baseline.beta.forEach((b, i) => (totals[i] += b));
    for (const age of [-2, 0, 2]) {
      for (const severity of [-2, 0, 2]) {
        const data = propensityCohort({ seed, age, severity });
        const fit = fitPropensity(data, ["C"]);
        assert.ok(
          fit.propensities.every((p) => Number.isFinite(p) && p > 0 && p < 1),
        );
      }
    }
  }
  [-0.4, 0.8, 0.8].forEach((truth, i) =>
    assert.ok(Math.abs(totals[i] / 40 - truth) < 0.08),
  );
});

test("missing arms and singular fits fail explicitly", () => {
  const data = propensityCohort(propensityBaseline);
  assert.throws(() => fitPropensity([], ["C"]), EstimationError);
  assert.throws(
    () =>
      fitPropensity(
        data.map((d) => ({ ...d, A: 1 })),
        ["C"],
      ),
    EstimationError,
  );
  assert.throws(
    () =>
      fitPropensity(
        data.map((d) => ({ ...d, C2: d.C1 })),
        ["C"],
      ),
    EstimationError,
  );
});
