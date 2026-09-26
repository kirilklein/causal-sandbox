import test from "node:test";
import assert from "node:assert/strict";
import {
  positivitySensitivity,
  recoveryPopulation,
} from "./positivity-sensitivity.js";

const close = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} != ${expected}`);

test("ATT decomposition uses treated shares and reaches the hand-calculated tipping point", () => {
  const same = positivitySensitivity(0.2);
  close(same.retainedEffect, 0.2);
  close(same.retainedContribution, 0.12);
  close(same.excludedContribution, 0.08);
  close(same.overallEffect, 0.2);
  close(same.excludedUntreated, 0.4);
  close(same.tippingEffect, -0.3);
  close(positivitySensitivity(-0.3).overallEffect, 0);
});

test("binary-outcome bounds are attained and all intermediate scenarios remain feasible", () => {
  const original = { ...recoveryPopulation };
  const low = positivitySensitivity(-0.4);
  const high = positivitySensitivity(0.6);
  close(low.excludedUntreated, 1);
  close(high.excludedUntreated, 0);
  close(low.overallEffect, -0.04);
  close(high.overallEffect, 0.36);
  for (let points = -40; points <= 60; points += 5) {
    const result = positivitySensitivity(points / 100);
    assert.ok(result.excludedUntreated >= 0 && result.excludedUntreated <= 1);
    close(result.overallBounds[0], low.overallEffect);
    close(result.overallBounds[1], high.overallEffect);
    close(result.retainedEffect, 0.2);
  }
  assert.deepEqual(recoveryPopulation, original);
});

test("different counterfactual worlds reproduce the same observed records but opposite overall effects", () => {
  // 60 retained treated, 40 excluded treated, and 60 retained controls.
  const world = (excludedRecoverWithout) => [
    ...Array.from({ length: 60 }, (_, i) => ({
      a: 1,
      s: 1,
      y1: +(i < 36),
      y0: +(i < 24),
    })),
    ...Array.from({ length: 40 }, (_, i) => ({
      a: 1,
      s: 0,
      y1: +(i < 24),
      y0: +(i < excludedRecoverWithout),
    })),
    ...Array.from({ length: 60 }, (_, i) => ({
      a: 0,
      s: 1,
      y1: +(i < 36),
      y0: +(i < 24),
    })),
  ];
  const benefit = world(0);
  const harm = world(40);
  const observed = (rows) =>
    rows.map(({ a, s, y1, y0 }) => ({ a, s, y: a ? y1 : y0 }));
  const att = (rows) =>
    rows.filter(({ a }) => a).reduce((sum, row) => sum + row.y1 - row.y0, 0) /
    100;
  assert.deepEqual(observed(benefit), observed(harm));
  close(att(benefit), positivitySensitivity(0.6).overallEffect);
  close(att(harm), positivitySensitivity(-0.4).overallEffect);
  assert.ok(att(benefit) > 0 && att(harm) < 0);
});

test("impossible or nonnumeric effects fail explicitly", () => {
  for (const value of [
    -0.41,
    0.61,
    NaN,
    Infinity,
    -Infinity,
    undefined,
    "0.2",
  ]) {
    assert.throws(() => positivitySensitivity(value), RangeError);
  }
});
