import test from "node:test";
import assert from "node:assert/strict";
import { sandboxOverlap } from "./sandbox-overlap.js";
import {
  defaults,
  worlds,
  makeNoise,
  simulate,
  estimate,
} from "./simulation.js";

test("sandbox diagnostics count raw score bins and clipping boundaries by arm", () => {
  const propensities = [0, 0.02, 0.1, 0.5, 0.98, 1];
  const data = propensities.map((_, i) => ({ A: i < 3 ? 0 : 1 }));
  const weights = [1 / 0.98, 1 / 0.98, 1 / 0.9, 2, 1 / 0.98, 1 / 0.98];
  const arms = sandboxOverlap(data, { propensities, weights });
  assert.deepEqual(
    arms.map((arm) => arm.clipped),
    [1, 1],
  );
  assert.deepEqual(arms[0].bins, [2, 1, 0, 0, 0, 0, 0, 0, 0, 0]);
  assert.deepEqual(arms[1].bins, [0, 0, 0, 0, 0, 1, 0, 0, 0, 2]);
  assert.ok(
    Math.abs(
      arms[0].ess - (2 / 0.98 + 1 / 0.9) ** 2 / (2 / 0.98 ** 2 + 1 / 0.9 ** 2),
    ) < 1e-12,
  );
  assert.ok(
    Math.abs(arms[1].ess - (2 + 2 / 0.98) ** 2 / (4 + 2 / 0.98 ** 2)) < 1e-12,
  );
  const empty = sandboxOverlap([{ A: 1 }], {
    propensities: [0.5],
    weights: [2],
  });
  assert.equal(empty[0].count, 0);
  assert.equal(empty[0].ess, null);
  assert.equal(empty[0].clipped, 0);
});

test("sandbox diagnostics reconcile actual fits without mutating estimates", () => {
  const noise = makeNoise();
  for (const ca of [0, 1.2, 3]) {
    const data = simulate({ ...defaults, ca }, noise, worlds[0]);
    for (const adjustment of [[], ["C"], ["C", "M"], ["K"]]) {
      const result = estimate(data, adjustment);
      const before = structuredClone(result);
      const arms = sandboxOverlap(data, result);
      assert.deepEqual(result, before);
      assert.equal(arms[0].clipped + arms[1].clipped, result.clipped);
      for (const [a, arm] of arms.entries()) {
        assert.equal(
          arm.bins.reduce((s, n) => s + n, 0),
          arm.count,
        );
        const weights = data.flatMap((d, i) =>
          d.A === a ? [result.weights[i]] : [],
        );
        const sum = weights.reduce((s, w) => s + w, 0);
        const squares = weights.reduce((s, w) => s + w * w, 0);
        assert.ok(Math.abs(arm.ess - sum ** 2 / squares) < 1e-9);
      }
    }
  }
});
