import assert from "node:assert/strict";
import test from "node:test";
import {
  upliftWorlds,
  upliftRules,
  upliftPopulation,
  upliftStudy,
  fitUplift,
  allocateContacts,
  campaignTruth,
  evaluateCampaign,
} from "./uplift.js";

test("equal budgets can buy many conversions while preventing purchases", () => {
  const population = upliftPopulation();
  const conversion = allocateContacts(
    population,
    population,
    "conversion",
    100,
  );
  const uplift = allocateContacts(population, population, "uplift", 100);
  assert.deepEqual(conversion, [0, 0, 0, 100]);
  assert.deepEqual(uplift, [0, 100, 0, 0]);
  assert.deepEqual(campaignTruth(population, conversion), {
    without: 95,
    withContact: 90,
    effect: -5,
  });
  assert.deepEqual(campaignTruth(population, uplift), {
    without: 35,
    withContact: 65,
    effect: 30,
  });
  assert.deepEqual(
    allocateContacts(population, [], "random", 100),
    [25, 25, 25, 25],
  );
});

test("allocations respect capacity, ties, empty/full budgets, and all three worlds", () => {
  for (const world of Object.keys(upliftWorlds)) {
    const population = upliftPopulation(world);
    for (const row of population) {
      assert.ok(row.p0 >= 0 && row.p0 <= 1 && row.p1 >= 0 && row.p1 <= 1);
    }
    for (const rule of Object.keys(upliftRules)) {
      for (const budget of [0, 50, 100, 200, 300, 400]) {
        const contacts = allocateContacts(population, population, rule, budget);
        assert.equal(
          contacts.reduce((a, b) => a + b, 0),
          budget,
        );
        assert.ok(contacts.every((n) => n >= 0 && n <= 100));
        if (budget === 400) assert.deepEqual(contacts, [100, 100, 100, 100]);
        if (world === "null")
          assert.equal(campaignTruth(population, contacts).effect, 0);
      }
    }
  }
  const aligned = upliftPopulation("aligned");
  assert.deepEqual(
    allocateContacts(aligned, aligned, "uplift", 100),
    [0, 0, 0, 100],
  );
  const nullWorld = upliftPopulation("null");
  assert.deepEqual(
    allocateContacts(nullWorld, nullWorld, "uplift", 200),
    [100, 100, 0, 0],
  );
  assert.throws(() => upliftPopulation("missing"), RangeError);
  assert.throws(
    () => allocateContacts(aligned, aligned, "uplift", 401),
    RangeError,
  );
  assert.throws(
    () => allocateContacts(aligned, aligned, "auc", 100),
    RangeError,
  );
});

test("T-learner fits observed arm means and reports missing comparisons", () => {
  const study = [
    {
      group: 0,
      arms: [
        { n: 20, purchases: 7 },
        { n: 20, purchases: 13 },
      ],
    },
  ];
  const before = structuredClone(study);
  const [fit] = fitUplift(study);
  assert.equal(fit.p0, 0.35);
  assert.equal(fit.p1, 0.65);
  assert.ok(Math.abs(fit.effect - 0.3) < 1e-12);
  assert.deepEqual(study, before);
  study[0].arms[1].n = 0;
  assert.equal(fitUplift(study)[0].effect, null);
  assert.throws(() =>
    allocateContacts(
      [{ group: 0, size: 100 }],
      fitUplift(study),
      "uplift",
      100,
    ),
  );
});

test("holdout evaluation reconciles with hand-calculated mean and variance", () => {
  const study = [
    {
      group: 0,
      arms: [
        { n: 100, purchases: 20 },
        { n: 100, purchases: 50 },
      ],
    },
    {
      group: 1,
      arms: [
        { n: 200, purchases: 140 },
        { n: 200, purchases: 120 },
      ],
    },
  ];
  const result = evaluateCampaign(study, [40, 60]);
  assert.ok(Math.abs(result.effect - 6) < 1e-12);
  const variance = (1600 * (0.16 + 0.25)) / 99 + (3600 * (0.21 + 0.24)) / 199;
  assert.ok(Math.abs(result.se ** 2 - variance) < 1e-12);
  assert.ok(Math.abs(result.lower - (6 - 1.96 * Math.sqrt(variance))) < 1e-12);
  assert.deepEqual(evaluateCampaign(study, [0, 0]), {
    effect: 0,
    se: 0,
    lower: 0,
    upper: 0,
  });
  study[0].arms[0].n = 1;
  assert.equal(evaluateCampaign(study, [40, 60]), null);
});

test("independent holdouts recover learned policy effects across repeated studies", () => {
  for (const world of Object.keys(upliftWorlds)) {
    const population = upliftPopulation(world);
    const errors = { conversion: 0, uplift: 0, random: 0 };
    const coverage = { conversion: 0, uplift: 0, random: 0 };
    const repetitions = 500;
    for (let i = 0; i < repetitions; i++) {
      const fit = fitUplift(upliftStudy(population, 2000 + i));
      const holdout = upliftStudy(population, 100000 + i);
      for (const rule of Object.keys(upliftRules)) {
        const contacts = allocateContacts(population, fit, rule, 100);
        const truth = campaignTruth(population, contacts).effect;
        const result = evaluateCampaign(holdout, contacts);
        errors[rule] += result.effect - truth;
        coverage[rule] += +(result.lower <= truth && truth <= result.upper);
      }
    }
    for (const rule of Object.keys(upliftRules)) {
      assert.ok(
        Math.abs(errors[rule] / repetitions) < 0.5,
        `${world}/${rule}: biased evaluation`,
      );
      assert.ok(
        coverage[rule] / repetitions > 0.9 &&
          coverage[rule] / repetitions < 0.99,
        `${world}/${rule}: interval coverage`,
      );
    }
  }
});

test("studies reproduce by seed and do not mutate the target population", () => {
  const population = upliftPopulation();
  const before = structuredClone(population);
  const study = upliftStudy(population, 4217);
  assert.deepEqual(study, upliftStudy(population, 4217));
  assert.notDeepEqual(study, upliftStudy(population, 90123));
  assert.deepEqual(population, before);
  assert.ok(
    study.every(({ arms }) =>
      arms.every(
        ({ n, purchases }) => n === 400 && purchases >= 0 && purchases <= n,
      ),
    ),
  );
});
