import test from "node:test";
import assert from "node:assert/strict";
import {
  lessonBaseline,
  lessonResult,
  simulateLesson,
} from "./lesson-simulation.js";
import { targetContinuousAte } from "./tmle.js";
import { tmleCurveExplanation, tmleFormula, tmlePath } from "./tmle-lesson.js";

test("TMLE formulas label predictions with Y hat notation", () => {
  const formula = tmleFormula();
  assert.match(formula, /Initial prediction · Ŷₐ/);
  assert.match(formula, /Targeted prediction · Ŷₐ\*/);
  assert.doesNotMatch(formula, /<mi>m<\/mi>|m₁|m₀|m\*/);
});

test("TMLE lesson uses the AIPW world and fits without leaking targeting progress into the sample", () => {
  const state = lessonBaseline(11);
  assert.deepEqual(state, {
    ...lessonBaseline(6),
    level: 11,
    outcomeQuadratic: false,
    targeting: 0,
  });
  const result = lessonResult(state);
  const before = structuredClone(result.tmleData);
  const target = targetContinuousAte(result.tmleData, {
    m0: result.tmleData.map((row) => row.m0),
    m1: result.tmleData.map((row) => row.m1),
    propensities: result.tmleData.map((row) => row.p),
  });
  assert.equal(target.status, "ok");
  assert.ok(Math.abs(target.initialEstimate - result.regression) < 1e-12);
  assert.ok(
    Math.abs(target.initialEstimate + target.correctionBefore - result.aipw) <
      1e-12,
  );
  assert.ok(Math.abs(target.correctionBefore) > 0.5);
  const world = simulateLesson(state);
  for (const fraction of [0, 0.25, 0.5, 0.75, 1]) {
    const changed = { ...state, targeting: fraction };
    assert.deepEqual(simulateLesson(changed), world);
    assert.deepEqual(lessonResult(changed), result);
    const view = tmlePath(result.tmleData, fraction);
    assert.equal(view.status, "ok");
    assert.ok(
      Math.abs(view.correction - (1 - fraction) * target.correctionBefore) <
        1e-12,
    );
    assert.ok(
      Math.abs(
        view.currentEstimate -
          ((1 - fraction) * result.regression + fraction * target.estimate),
      ) < 1e-12,
    );
    if (fraction === 0)
      assert.deepEqual(
        view.current0,
        before.map((row) => row.m0),
      );
    if (fraction === 1) assert.deepEqual(view.current1, target.m1);
  }
  assert.deepEqual(result.tmleData, before);
  assert.notDeepEqual(
    lessonResult({ ...state, seed: state.seed + 1 }).tmleData,
    before,
  );
  assert.deepEqual(lessonResult(lessonBaseline(11)), result);
  assert.equal(lessonResult(lessonBaseline(6)).tmleData, undefined);
});

test("targeting preview rejects invalid progress and preserves estimator failure", () => {
  for (const progress of [-1, 1.1, NaN])
    assert.throws(() => tmlePath([], progress), RangeError);
  assert.deepEqual(tmlePath([], 0), {
    status: "unavailable",
    reason: "empty-sample",
  });
  assert.deepEqual(tmlePath([{ A: 0, Y: 1, m0: 0, m1: 1, p: 0.5 }], 1), {
    status: "unavailable",
    reason: "missing-treatment-arm",
  });
});

test("curve explanations follow the fitted sign and rarest treatment locations", () => {
  const rows = [
    { A: 0, Y: 1, C: 1.7, m0: 0, m1: 0, p: 0.9 },
    { A: 1, Y: -1, C: -0.4, m0: 0, m1: 0, p: 0.1 },
    { A: 1, Y: 0, C: -1.7, m0: 0, m1: 0, p: 0.5 },
  ];
  for (const sign of [1, -1]) {
    const sample = rows.map((row) => ({ ...row, Y: sign * row.Y }));
    const view = tmlePath(sample, 0);
    assert.equal(view.status, "ok");
    assert.match(
      tmleCurveExplanation(sample, view, 0),
      new RegExp(
        `${sign === 1 ? "raises" : "lowers"} this curve most near C = 1.7`,
      ),
    );
    assert.match(
      tmleCurveExplanation(sample, view, 1),
      new RegExp(
        `${sign === 1 ? "lowers" : "raises"} this curve most near C = -0.4`,
      ),
    );
    assert.equal(
      tmleCurveExplanation(sample, view, 1),
      tmleCurveExplanation(sample, tmlePath(sample, 1), 1),
    );
  }
  const unchanged = rows.map((row) => ({ ...row, Y: 0 }));
  assert.match(
    tmleCurveExplanation(unchanged, tmlePath(unchanged, 1), 0),
    /effectively zero/,
  );
});
