import test from "node:test";
import assert from "node:assert/strict";
import {
  positivitySensitivity,
  recoveryPopulation,
  propensityDistribution,
  positivityBounds,
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
  // The propensity model implies 60 retained treated, 40 excluded, and 90 controls.
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
    ...Array.from({ length: 90 }, (_, i) => ({
      a: 0,
      s: 1,
      y1: +(i < 54),
      y0: +(i < 36),
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

test("untreated recovery upper limits narrow the ATT set with attainable endpoints", () => {
  for (let limit = 0; limit <= 20; limit++) {
    const u = limit / 20;
    const [lower, upper] = positivityBounds(u);
    close(lower, (60 - (24 + 40 * u)) / 100);
    close(upper, (60 - 24) / 100);
    for (let fraction = 0; fraction <= 10; fraction++) {
      const q = (u * fraction) / 10;
      const effect = positivitySensitivity(0.6 - q).overallEffect;
      assert.ok(effect >= lower - 1e-12 && effect <= upper + 1e-12);
    }
  }
  close(positivityBounds(0.9)[0], 0);
  close(positivityBounds(0.8)[0], 0.04);
  for (const invalid of [-0.01, 1.01, NaN, Infinity, undefined, "0.8"]) {
    assert.throws(() => positivityBounds(invalid), RangeError);
  }
});
