import test from "node:test";
import assert from "node:assert/strict";
import { effectComparison } from "./effect-comparison.js";

test("error colors are symmetric and independent of the true effect", () => {
  for (const truth of [-2, 0, 2]) {
    assert.equal(effectComparison(truth, truth).tint, 0);
    assert.equal(effectComparison(truth + 1, truth).tint, 0.5 ** 0.75 * 100);
    assert.equal(effectComparison(truth - 1, truth).tint, 0.5 ** 0.75 * 100);
    assert.equal(effectComparison(truth + 10, truth).tint, 100);
  }
  assert.equal(effectComparison(1, 2).difference, "-1.00 from truth");
  assert.equal(effectComparison(3, 2).difference, "+1.00 from truth");
  assert.equal(effectComparison(-0.001, 0).difference, "0.00 from truth");
});

test("small errors remain visible on a continuous, increasing scale", () => {
  const errors = [0, 0.15, 0.3, 1, 2];
  const tints = errors.map((error) => effectComparison(error, 0).tint);
  assert.ok(effectComparison(0.08, 0).tint < 10);
  assert.ok(tints[1] >= 14 && tints[1] <= 15);
  assert.ok(tints[2] >= 24 && tints[2] <= 25);
  assert.equal(tints.at(-1), 100);
  for (let i = 1; i < tints.length; i++) {
    assert.ok(tints[i] > tints[i - 1]);
    assert.equal(effectComparison(-errors[i], 0).tint, tints[i]);
  }
  assert.ok(effectComparison(0.000001, 0).tint < 0.1);
});

test("unavailable estimates or truth never appear as successful comparisons", () => {
  for (const missing of [NaN, Infinity, -Infinity, undefined, null]) {
    for (const comparison of [
      effectComparison(missing, 2),
      effectComparison(2, missing),
    ]) {
      assert.equal(comparison.value, "Unavailable");
      assert.equal(comparison.difference, "Cannot compare with truth");
      assert.equal(comparison.tint, 0);
    }
  }
});
