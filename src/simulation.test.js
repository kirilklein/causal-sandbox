import test from "node:test";
import assert from "node:assert/strict";
import {
  defaults,
  presets,
  worlds,
  outcome,
  makeNoise,
  simulate,
  estimate,
} from "./simulation.js";
const noise = makeNoise();
test("fitted predictions hold C fixed and recover a known outcome surface", () => {
  for (const effect of [-2, 0, 3]) {
    const data = [-2, -1, 0, 1, 2].flatMap((C) =>
      [0, 1].map((A) => ({ C, A, Y: 4 + 1.5 * C + effect * A })),
    );
    const result = estimate(data, ["C"]);
    result.outcomePredictions.forEach(({ m0, m1 }, i) => {
      assert.ok(Math.abs(m0 - (4 + 1.5 * data[i].C)) < 1e-6);
      assert.ok(Math.abs(m1 - (4 + 1.5 * data[i].C + effect)) < 1e-6);
      assert.ok(Math.abs(m1 - m0 - effect) < 1e-6);
    });
    assert.ok(Math.abs(result.values[2] - effect) < 1e-6);
  }
});

const run = (i, adjust = presets[i].adjust) =>
  estimate(simulate(presets[i].p, noise), adjust);
test("fixed exogenous population and potential outcomes preserve the known ATE", () => {
  assert.deepEqual(noise, makeNoise());
  const p = { ...defaults, direct: 1.3, am: 1.2, my: 0.7 };
  for (const world of worlds)
    for (const e of noise) {
      assert.ok(
        Math.abs(
          outcome(p, e, 1, world) -
            outcome(p, e, 0, world) -
            (p.direct + p.am * p.my),
        ) < 1e-12,
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

test("world switches change mechanisms while preserving covariates and causal effect", () => {
  const base = simulate(defaults, noise);
  const outcomeWorld = simulate(defaults, noise, worlds[1]);
  const treatmentWorld = simulate(defaults, noise, worlds[2]);
  base.forEach((d, i) => {
    assert.equal(outcomeWorld[i].A, d.A);
    assert.equal(outcomeWorld[i].C1, d.C1);
    assert.equal(treatmentWorld[i].C2, d.C2);
    assert.ok(
      Math.abs(
        outcomeWorld[i].Y - d.Y - defaults.cy * worlds[1].outcome * d.C1 * d.C2,
      ) < 1e-12,
    );
  });
  assert.ok(treatmentWorld.some((d, i) => d.A !== base[i].A));
});

test("model choices affect only methods that use those models", () => {
  const data = simulate(defaults, noise, worlds[3]);
  const basic = estimate(data, ["C"]);
  const outcomeOnly = estimate(data, ["C"], { outcome: true });
  const treatmentOnly = estimate(data, ["C"], { treatment: true });
  assert.equal(basic.values[3], outcomeOnly.values[3]);
  assert.equal(basic.values[2], treatmentOnly.values[2]);
  assert.equal(basic.values[0], outcomeOnly.values[0]);
  assert.ok(Math.abs(basic.values[2] - outcomeOnly.values[2]) > 1);
  assert.ok(Math.abs(basic.values[3] - treatmentOnly.values[3]) > 1);
  // No leaking C or its product into the model when it is unadjusted/hidden.
  assert.deepEqual(
    estimate(data, [], { outcome: true, treatment: true }),
    estimate(data, []),
  );
});

test("double robustness across 40 independent populations, not a selected seed", () => {
  const specs = [
    {},
    { outcome: true },
    { treatment: true },
    { outcome: true, treatment: true },
  ];
  for (const world of worlds) {
    const sums = specs.map(() => [0, 0, 0]);
    for (let seed = 100; seed < 140; seed++) {
      const data = simulate(defaults, makeNoise(2400, seed), world);
      specs.forEach((spec, j) =>
        estimate(data, ["C"], spec)
          .values.slice(2)
          .forEach((v, k) => (sums[j][k] += v - 2)),
      );
    }
    specs.forEach((spec, j) => {
      const biases = sums[j].map((v) => v / 40);
      const correctOutcome = !world.outcome || spec.outcome;
      const correctTreatment = !world.treatment || spec.treatment;
      if (correctOutcome)
        assert.ok(
          Math.abs(biases[0]) < 0.1,
          `${world.id} regression: ${biases}`,
        );
      else
        assert.ok(
          Math.abs(biases[0]) > 0.25,
          `${world.id} missing outcome: ${biases}`,
        );
      if (correctTreatment)
        assert.ok(Math.abs(biases[1]) < 0.1, `${world.id} IPW: ${biases}`);
      else
        assert.ok(
          Math.abs(biases[1]) > 0.25,
          `${world.id} missing propensity: ${biases}`,
        );
      if (correctOutcome || correctTreatment)
        assert.ok(Math.abs(biases[2]) < 0.1, `${world.id} AIPW: ${biases}`);
      else
        assert.ok(
          Math.abs(biases[2]) > 0.5,
          `${world.id} both missing: ${biases}`,
        );
    });
  }
});

test("rich models cannot fix hidden confounding or collider adjustment in any world", () => {
  for (const world of worlds) {
    const rich = { outcome: true, treatment: true };
    const hidden = estimate(simulate(presets[2].p, noise, world), ["C"], rich);
    assert.ok(hidden.values.slice(2).every((v) => v > 3));
    const collider = estimate(
      simulate(presets[3].p, noise, world),
      ["C", "K"],
      rich,
    );
    assert.ok(collider.values.slice(2).every((v) => Math.abs(v - 2) > 0.8));
    const mediator = estimate(
      simulate(presets[4].p, noise, world),
      ["C", "M"],
      rich,
    );
    assert.ok(Math.abs(mediator.values[2] - 1) < 0.15);
  }
});

test("every world, feature choice, and adjustment set handles supported extremes", () => {
  for (const world of worlds)
    for (const spec of [
      {},
      { outcome: true },
      { treatment: true },
      { outcome: true, treatment: true },
    ]) {
      const data = simulate(
        { ...defaults, ca: 3, cy: 3, ua: 3, uy: 3, am: 2, my: 2, direct: -1 },
        noise,
        world,
      );
      for (const adjustment of [[], ["C"], ["M"], ["K"], ["C", "M", "K"]]) {
        const result = estimate(data, adjustment, spec);
        assert.ok(result.values.every(Number.isFinite));
      }
    }
});
