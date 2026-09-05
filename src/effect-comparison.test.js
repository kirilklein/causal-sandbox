import test from "node:test";
import assert from "node:assert/strict";
import { effectComparison } from "./effect-comparison.js";

test("error colors are symmetric and independent of the true effect", () => {
  for (const truth of [-2, 0, 2]) {
    assert.equal(effectComparison(truth, truth).tint, 0);
    assert.equal(effectComparison(truth + 1, truth).tint, 50);
    assert.equal(effectComparison(truth - 1, truth).tint, 50);
    assert.equal(effectComparison(truth + 10, truth).tint, 100);
  }
  assert.equal(effectComparison(1, 2).difference, "-1.00 from truth");
  assert.equal(effectComparison(3, 2).difference, "+1.00 from truth");
  assert.equal(effectComparison(-0.001, 0).difference, "0.00 from truth");
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
