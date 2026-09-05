import test from "node:test";
import assert from "node:assert/strict";
import {
  defaults,
  presets,
  makeNoise,
  simulate,
  estimate,
} from "./simulation.js";
const noise = makeNoise();
const run = (i, adjust = presets[i].adjust) =>
  estimate(simulate(presets[i].p, noise), adjust);
test("fixed exogenous population and potential outcomes preserve the known ATE", () => {
  assert.deepEqual(noise, makeNoise());
  const p = { ...defaults, direct: 1.3, am: 1.2, my: 0.7 };
  for (const e of noise) {
    const outcome = (a) =>
      p.direct * a + p.cy * e.C + p.uy * e.U + p.my * (p.am * a + e.eM) + e.eY;
    assert.ok(
      Math.abs(outcome(1) - outcome(0) - (p.direct + p.am * p.my)) < 1e-12,
    );
  }
});
test("randomized treatment recovers truth with all methods", () => {
  for (const v of run(0).values) assert.ok(Math.abs(v - 2) < 0.1);
});
test("observed confounding is removed by C and returns without C", () => {
  assert.ok(run(1).values[0] > 3);
  for (const v of run(1, ["C"]).values.slice(2))
    assert.ok(Math.abs(v - 2) < 0.15);
  for (const v of run(1, []).values) assert.ok(v > 3);
});
test("observed adjustment cannot remove hidden confounding", () => {
  for (const v of run(2).values.slice(2)) assert.ok(v - 2 > 1);
});
test("collider adjustment introduces bias under randomization", () => {
  assert.ok(Math.abs(run(3, []).values[2] - 2) < 0.1);
  for (const v of run(3).values.slice(2)) assert.ok(Math.abs(v - 2) > 1);
});
test("mediator regression targets direct effect rather than total effect", () => {
  assert.ok(Math.abs(run(4).values[2] - 1) < 0.1);
  assert.ok(Math.abs(run(4, []).values[2] - 2) < 0.1);
});
test("extreme supported worlds return finite estimates and flag poor overlap", () => {
  for (const p of [
    { ...defaults, ca: 3, cy: 3, ua: 3, uy: 3, am: 2, my: 2, direct: 4 },
    { ...defaults, direct: -1 },
  ]) {
    for (const set of [[], ["C"], ["M"], ["K"], ["C", "M", "K"]]) {
      const r = estimate(simulate(p, noise), set);
      assert.ok(r.values.every(Number.isFinite));
      assert.ok(r.ess > 0 && r.ess <= noise.length + 1e-6);
    }
  }
  assert.ok(
    estimate(simulate({ ...defaults, ca: 3 }, noise), ["C"]).clipped > 0,
  );
});
