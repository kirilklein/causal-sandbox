import test from "node:test";
import assert from "node:assert/strict";
import { timingSample } from "./timing-simulation.js";

const mean = (xs) => xs.reduce((sum, x) => sum + x, 0) / xs.length;
function cov(rows, x, y) {
  const mx = mean(rows.map((row) => row[x]));
  const my = mean(rows.map((row) => row[y]));
  return mean(rows.map((row) => (row[x] - mx) * (row[y] - my)));
}

test("adjusting for baseline V induces the bias predicted by the population covariance formula", () => {
  // P has unit variance; V=P+R+0.5e has variance 2.25. Symmetry gives P(A=1)=0.5.
  // q=Cov(A,P) is integrated independently from the simulation and fitting code.
  const steps = 10000,
    bound = Math.sqrt(3);
  let q = 0;
  for (let i = 0; i < steps; i++) {
    const p = -bound + (2 * bound * (i + 0.5)) / steps;
    q += p / (1 + Math.exp(-1.5 * p)) / steps;
  }
  const expectedAdjusted = 2 - (1.5 * q) / (0.25 * 2.25 - q * q);
  const studies = Array.from({ length: 40 }, (_, i) =>
    timingSample({ seed: 100 + i }),
  );
  const unadjusted = mean(studies.map((s) => s.unadjusted));
  const adjusted = mean(studies.map((s) => s.adjusted));
  assert.ok(Math.abs(unadjusted - 2) < 0.04);
  assert.ok(Math.abs(adjusted - expectedAdjusted) < 0.04);
  assert.ok(Math.abs(adjusted - 2) > 0.7);
  assert.ok(Math.abs(mean(studies.map((s) => cov(s.data, "P", "R")))) < 0.02);
  console.log({ unadjusted, adjusted, expectedAdjusted });
});

const worlds = [
  ["confounder", "before"],
  ["instrument", "before"],
  ["predictor", "before"],
  ["predictor", "between"],
  ["mediator", "between"],
  ["treatment", "between"],
  ["treatment", "after"],
  ["outcome", "after"],
  ["collider", "before"],
  ["collider", "between"],
  ["collider", "after"],
];

test("every timing world agrees with independent OLS calculations and keeps the total-effect target", () => {
  for (const [example, window] of worlds) {
    const study = timingSample({ example, window });
    const { data, truth, adjusted, unadjusted } = study;
    const aa = cov(data, "A", "A"),
      vv = cov(data, "V", "V");
    const ay = cov(data, "A", "Y"),
      av = cov(data, "A", "V"),
      vy = cov(data, "V", "Y");
    assert.ok(Math.abs(unadjusted - ay / aa) < 1e-7, `${example}: unadjusted`);
    assert.ok(
      Math.abs(adjusted - (ay * vv - av * vy) / (aa * vv - av * av)) < 1e-7,
      `${example}: adjusted`,
    );
    assert.equal(truth, 2);
    assert.deepEqual(timingSample({ example, window }), study);
    assert.notDeepEqual(
      timingSample({ example, window, seed: 4218 }).data,
      data,
    );
  }
});

test("repeated timing estimates recover analytic regression limits and precision differences", () => {
  const sd = (values) =>
    Math.sqrt(mean(values.map((x) => (x - mean(values)) ** 2)));
  // With Var(A)=1/4 and independent unit-variance noises, partial-regression
  // limits are 1 for the mediator/outcome proxy, 0.8 for the middle collider,
  // and 0.5 for the post-outcome collider. These are not total-effect targets.
  const expected = {
    mediator: 1,
    outcome: 1,
    "collider-between": 0.8,
    "collider-after": 0.5,
  };
  for (const [example, window] of worlds.filter(
    ([e, w]) => !(e === "collider" && w === "before"),
  )) {
    const studies = Array.from({ length: 80 }, (_, i) =>
      timingSample({ example, window, seed: 200 + i }),
    );
    const without = studies.map((s) => s.unadjusted),
      withV = studies.map((s) => s.adjusted);
    const key = example === "collider" ? `${example}-${window}` : example;
    assert.ok(
      Math.abs(mean(withV) - (expected[key] ?? 2)) < 0.04,
      `${key}: adjusted mean ${mean(withV)}`,
    );
    if (example === "confounder") assert.ok(mean(without) > 3.5);
    else
      assert.ok(Math.abs(mean(without) - 2) < 0.04, `${key}: unadjusted mean`);
    if (["instrument", "treatment"].includes(example))
      assert.ok(sd(withV) > 1.15 * sd(without), `${key}: precision loss`);
    if (example === "predictor")
      assert.ok(sd(withV) < 0.7 * sd(without), `${key}: precision gain`);
  }
});

test("changing only the time window preserves worlds with the same arrows", () => {
  for (const [example, first, second] of [
    ["predictor", "before", "between"],
    ["treatment", "between", "after"],
  ]) {
    assert.deepEqual(
      timingSample({ example, window: first }),
      timingSample({ example, window: second }),
    );
  }
  assert.throws(
    () => timingSample({ example: "unknown" }),
    /Unknown timing world/,
  );
  assert.throws(
    () => timingSample({ example: "collider", window: "unknown" }),
    /Unknown timing world/,
  );
});
