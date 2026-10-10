import test from "node:test";
import assert from "node:assert/strict";
import {
  hospitalWorld,
  hospitalCounterfactuals,
  estimateHospitalDid,
  stratifiedHospitalDid,
} from "./did-adjustment.js";
import { didWorld, estimateDid, didRegression } from "./did.js";
const close = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} != ${expected}`);

test("12-hospital fixtures reconcile crude association, changes, and stratification", () => {
  const equal = hospitalWorld();
  assert.equal(equal.observed.length, 12);
  close(estimateHospitalDid(equal.observed).association, -0.05);
  close(estimateHospitalDid(equal.observed).effect, 0.15);
  for (const shock of [0, 0.1]) {
    const { observed, truth } = hospitalWorld({ capacityTrends: true, shock });
    const crude = estimateHospitalDid(observed);
    const adjusted = stratifiedHospitalDid(observed);
    close(crude.treatedChange, 0.3 + shock);
    close(crude.comparisonChange, 0.1);
    close(crude.effect, 0.2 + shock);
    close(adjusted.effect, 0.15 + shock);
    close(truth.effect, 0.15);
    adjusted.strata.forEach((s) => close(s.effect, 0.15 + shock));
    close(adjusted.strata[0].share, 2 / 3);
    close(adjusted.strata[1].share, 1 / 3);
    for (const h of observed) {
      assert.ok(h.before >= 0 && h.after <= 1);
      assert.equal("untreatedAfter" in h, false);
    }
  }
});

test("stable baseline gaps and shared changes cancel throughout supported worlds", () => {
  for (const gap of [0.1, 0.2, 0.3])
    for (const common of [0, 0.1, 0.2]) {
      const { observed } = hospitalWorld({ gap, common });
      close(estimateHospitalDid(observed).effect, 0.15);
      close(stratifiedHospitalDid(observed).effect, 0.15);
    }
});

test("reported comparison contributions recover stratification without changing outcomes", () => {
  const { observed } = hospitalWorld({ capacityTrends: true });
  const original = structuredClone(observed);
  observed.forEach(Object.freeze);
  Object.freeze(observed);
  const result = stratifiedHospitalDid(observed);
  const contribution = (h) =>
    result.contributions.find((w) => w.id === h.id).weight;
  for (const D of [0, 1])
    close(
      observed
        .filter((h) => h.D === D)
        .reduce((sum, h) => sum + contribution(h), 0),
      1,
    );
  close(
    contribution(observed.find((h) => !h.D && h.capacity === "high")),
    1 / 3,
  );
  close(
    contribution(observed.find((h) => !h.D && h.capacity === "low")),
    1 / 12,
  );
  const weighted = observed.reduce(
    (sum, h) => sum + (h.D ? 1 : -1) * contribution(h) * (h.after - h.before),
    0,
  );
  close(weighted, result.effect);
  estimateHospitalDid(observed);
  assert.deepEqual(observed, original);
});

test("unsupported treated profiles and invalid observations fail explicitly", () => {
  const { observed } = hospitalWorld();
  const unsupported = observed.filter((h) => h.D || h.capacity !== "high");
  assert.throws(
    () => stratifiedHospitalDid(unsupported),
    /No comparison hospitals with high capacity/,
  );
  for (const estimate of [estimateHospitalDid, stratifiedHospitalDid]) {
    assert.throws(() => estimate([]), /required/);
    assert.throws(() => estimate(observed.filter((h) => h.D)), /Both/);
    assert.throws(
      () => estimate([{ ...observed[0], after: NaN }, ...observed.slice(1)]),
      /finite risks/,
    );
    assert.throws(() => estimate([...observed, observed[0]]), /unique/);
  }
  assert.throws(() => hospitalWorld({ shock: 1 }), /between 0 and 1/);
  assert.throws(() => hospitalWorld({ common: NaN }), /finite/);
});

test("changing separate simulator truth cannot influence any observed-data estimate", () => {
  const world = hospitalWorld({ capacityTrends: true });
  const before = [
    estimateHospitalDid(world.observed),
    stratifiedHospitalDid(world.observed),
  ];
  world.truth.effect = -0.1;
  world.truth.untreated.forEach((h) => {
    h.after = 0.95;
  });
  assert.deepEqual(
    [
      estimateHospitalDid(world.observed),
      stratifiedHospitalDid(world.observed),
    ],
    before,
  );
});

test("regression reconstructs all four cells and DiD, even when parallel trends fails", () => {
  const examples = [];
  for (let gap = 10; gap <= 30; gap += 2)
    for (let common = 0; common <= 20; common += 2)
      for (const extra of [-10, 0, 10])
        examples.push(didWorld({ gap, common, extra }).observed);
  // Independent arbitrary supported means, including effects of either sign.
  for (let i = 0; i < 100; i++)
    examples.push({
      treatedBefore: i,
      treatedAfter: (i * 13) % 101,
      comparisonBefore: (i * 7) % 101,
      comparisonAfter: (i * 19) % 101,
    });
  for (const observed of examples) {
    const fit = didRegression(observed);
    for (const key of Object.keys(observed))
      close(fit.cells[key], observed[key]);
    close(fit.delta, estimateDid(observed).effect);
    close(fit.counterfactual, estimateDid(observed).counterfactual);
  }
  const fit = didRegression(didWorld().observed);
  assert.deepEqual(
    [fit.alpha, fit.beta, fit.gamma, fit.delta],
    [60, -20, 10, 15],
  );
});

test("distinct hospital baselines preserve the fixture contrasts and stay fixed across worlds", () => {
  const equal = hospitalWorld({ variedBaselines: true });
  const capacity = hospitalWorld({
    variedBaselines: true,
    capacityTrends: true,
  });
  const shocked = hospitalWorld({
    variedBaselines: true,
    capacityTrends: true,
    shock: 0.1,
  });
  for (const D of [0, 1]) {
    const arm = equal.observed.filter((h) => h.D === D);
    assert.equal(new Set(arm.map((h) => h.before)).size, 6);
    close(arm.reduce((sum, h) => sum + h.before, 0) / 6, D ? 0.4 : 0.6);
  }
  for (const world of [capacity, shocked]) {
    assert.deepEqual(
      world.observed.map(({ id, D, capacity, before }) => ({
        id,
        D,
        capacity,
        before,
      })),
      equal.observed.map(({ id, D, capacity, before }) => ({
        id,
        D,
        capacity,
        before,
      })),
    );
    close(world.truth.effect, equal.truth.effect);
    for (const h of world.observed) assert.ok(h.before >= 0 && h.after <= 1);
  }
  close(estimateHospitalDid(equal.observed).effect, 0.15);
  close(estimateHospitalDid(equal.observed).association, -0.05);
  close(estimateHospitalDid(capacity.observed).effect, 0.2);
  close(stratifiedHospitalDid(capacity.observed).effect, 0.15);
  close(stratifiedHospitalDid(shocked.observed).effect, 0.25);
});

test("borrowed endpoints reconcile individual gaps with the ATT estimators", () => {
  for (const capacityTrends of [false, true])
    for (const shock of [0, 0.1]) {
      const { observed } = hospitalWorld({
        capacityTrends,
        shock,
        variedBaselines: true,
      });
      const original = structuredClone(observed);
      for (const adjusted of [false, true]) {
        const rows = hospitalCounterfactuals(observed, { adjusted });
        assert.equal(rows.length, 6);
        close(
          rows.reduce((sum, row) => sum + row.gap, 0) / 6,
          adjusted
            ? stratifiedHospitalDid(observed).effect
            : estimateHospitalDid(observed).effect,
        );
        for (const row of rows) {
          const sources = observed.filter((h) => row.sourceIds.includes(h.id));
          assert.ok(
            sources.every(
              (h) => !h.D && (!adjusted || h.capacity === row.capacity),
            ),
          );
          close(
            row.borrowedChange,
            sources.reduce((sum, h) => sum + h.after - h.before, 0) /
              sources.length,
          );
          close(row.counterfactual, row.before + row.borrowedChange);
          close(row.gap, row.after - row.counterfactual);
        }
      }
      assert.deepEqual(observed, original);
    }
  const { observed } = hospitalWorld({
    capacityTrends: true,
    variedBaselines: true,
  });
  const crude = hospitalCounterfactuals(observed);
  const adjusted = hospitalCounterfactuals(observed, { adjusted: true });
  close(crude[0].counterfactual, 0.4);
  close(crude[0].gap, 0.25);
  close(adjusted[0].counterfactual, 0.5);
  close(adjusted[0].gap, 0.15);
  assert.deepEqual(adjusted[0].sourceIds, ["C1", "C2"]);
  assert.deepEqual(adjusted[5].sourceIds, ["C3", "C4", "C5", "C6"]);
  assert.throws(
    () =>
      hospitalCounterfactuals(
        observed.filter((h) => h.D || h.capacity === "low"),
        { adjusted: true },
      ),
    /No comparison/,
  );
});
