import test from "node:test";
import assert from "node:assert/strict";
import {
  positivitySensitivity,
  recoveryPopulation,
  propensityDistribution,
  positivityBounds,
  tippingLimit,
  simulationTruth,
} from "./positivity-sensitivity.js";

const close = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} != ${expected}`);

test("propensity distributions obey Bayes' rule and the recovery study's treated shares", () => {
  const { profiles, treatedProbability } = propensityDistribution();
  const sum = (key, rows = profiles) =>
    rows.reduce((total, row) => total + row[key], 0);
  close(sum("populationShare"), 1);
  close(sum("treatedShare"), 1);
  close(sum("controlShare"), 1);
  close(treatedProbability, 10 / 19);
  close(
    sum(
      "treatedShare",
      profiles.filter((p) => p.retained),
    ),
    recoveryPopulation.retainedShare,
  );
  close(
    sum(
      "controlShare",
      profiles.filter((p) => !p.retained),
    ),
    0,
  );
  for (const profile of profiles) {
    const treatedMass = profile.treatedShare * treatedProbability;
    const controlMass = profile.controlShare * (1 - treatedProbability);
    close(treatedMass / (treatedMass + controlMass), profile.score);
    assert.equal(profile.retained, profile.score < 1);
  }
});

test("histogram bins preserve each arm's mass and isolate the always-treated group", () => {
  const { bins } = propensityDistribution();
  close(
    bins.reduce((sum, bin) => sum + bin.treated, 0),
    1,
  );
  close(
    bins.reduce((sum, bin) => sum + bin.control, 0),
    1,
  );
  close(bins[1].treated, 0.0375);
  close(bins[1].control, 17 / 72);
  close(bins[6].treated, 0.1625);
  close(bins[9].treated, 0.4);
  close(bins[9].excluded, 0.4);
  close(bins[9].control, 0);
  for (const i of [0, 7, 8]) {
    close(bins[i].treated, 0);
    close(bins[i].control, 0);
  }
});

test("ATT decomposition uses treated shares and reaches the hand-calculated tipping point", () => {
  const same = positivitySensitivity(0.35);
  close(same.retainedEffect, 0.2);
  close(same.excludedEffect, 0.2);
  close(same.overallEffect, 0.6 * 0.2 + 0.4 * 0.2);
  close(tippingLimit, 0.85);
  close(positivitySensitivity(0.85).overallEffect, 0);
});

test("binary-outcome bounds are attained and all intermediate scenarios remain feasible", () => {
  const original = { ...recoveryPopulation };
  const low = positivitySensitivity(1);
  const high = positivitySensitivity(0);
  close(low.excludedEffect, -0.45);
  close(high.excludedEffect, 0.55);
  close(low.overallEffect, -0.06);
  close(high.overallEffect, 0.34);
  for (let points = 0; points <= 100; points += 5) {
    const result = positivitySensitivity(points / 100);
    assert.ok(
      result.overallEffect >= low.overallEffect - 1e-12 &&
        result.overallEffect <= high.overallEffect + 1e-12,
    );
    close(result.retainedEffect, 0.2);
  }
  assert.deepEqual(recoveryPopulation, original);
});

test("different counterfactual worlds reproduce the same observed records but opposite overall effects", () => {
  // The propensity model implies 60 retained treated, 40 excluded, and 90 controls.
  const world = (excludedRecoverWithout) => [
    ...Array.from({ length: 60 }, (_, i) => ({
      a: 1,
      s: 1,
      y1: +(i < 42),
      y0: +(i < 30),
    })),
    ...Array.from({ length: 40 }, (_, i) => ({
      a: 1,
      s: 0,
      y1: +(i < 22),
      y0: +(i < excludedRecoverWithout),
    })),
    ...Array.from({ length: 90 }, (_, i) => ({
      a: 0,
      s: 1,
      y1: +(i < 63),
      y0: +(i < 45),
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
  close(att(benefit), positivitySensitivity(0).overallEffect);
  close(att(harm), positivitySensitivity(1).overallEffect);
  assert.ok(att(benefit) > 0 && att(harm) < 0);
});

test("impossible or nonnumeric outcome probabilities fail explicitly", () => {
  for (const value of [
    -0.01,
    1.01,
    NaN,
    Infinity,
    -Infinity,
    undefined,
    "0.2",
  ]) {
    assert.throws(() => positivitySensitivity(value), RangeError);
  }
});

test("untreated outcome upper limits narrow the ATT set with attainable endpoints", () => {
  for (let limit = 0; limit <= 20; limit++) {
    const u = limit / 20;
    const [lower, upper] = positivityBounds(u);
    close(lower, (64 - (30 + 40 * u)) / 100);
    close(upper, (64 - 30) / 100);
    for (let fraction = 0; fraction <= 10; fraction++) {
      const q = (u * fraction) / 10;
      const effect = positivitySensitivity(q).overallEffect;
      assert.ok(effect >= lower - 1e-12 && effect <= upper + 1e-12);
    }
  }
  close(positivityBounds(0.85)[0], 0);
  close(positivityBounds(0.8)[0], 0.02);
  for (const invalid of [-0.01, 1.01, NaN, Infinity, undefined, "0.8"]) {
    assert.throws(() => positivityBounds(invalid), RangeError);
  }
});

test("fixed simulation truth reconciles outcome contrasts and is excluded only by false limits", () => {
  close(simulationTruth.excludedUntreated, 0.75);
  close(simulationTruth.retainedEffect, (42 - 30) / 60);
  close(simulationTruth.excludedEffect, (22 - 30) / 40);
  close(simulationTruth.overallEffect, (64 - 60) / 100);
  const original = { ...simulationTruth };
  for (let i = 0; i <= 20; i++) {
    const limit = i / 20;
    const [lower, upper] = positivityBounds(limit);
    const containsTruth =
      simulationTruth.overallEffect >= lower - 1e-12 &&
      simulationTruth.overallEffect <= upper + 1e-12;
    assert.equal(containsTruth, limit >= 0.75);
  }
  assert.deepEqual(simulationTruth, original);
});
