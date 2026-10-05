import test from "node:test";
import assert from "node:assert/strict";
import { didWorld, estimateDid, didHistory } from "./did.js";

test("the observed comparison constructs 50%, giving a 15 pp treated effect", () => {
  assert.deepEqual(estimateDid(didWorld().observed), {
    treatedChange: 25,
    comparisonChange: 10,
    counterfactual: 50,
    effect: 15,
  });
});

test("baseline gaps and shared changes cancel; differential change produces equal bias", () => {
  for (let gap = 10; gap <= 30; gap++) {
    for (let common = 0; common <= 20; common++) {
      for (let extra = -10; extra <= 10; extra++) {
        const { observed, truth } = didWorld({ gap, common, extra });
        const estimate = estimateDid(observed);
        assert.equal(estimate.effect - truth.effect, extra);
        assert.equal(observed.treatedAfter - truth.untreatedAfter, 15);
        for (const rate of [...Object.values(observed), truth.untreatedAfter]) {
          assert.ok(rate >= 0 && rate <= 100);
        }
      }
    }
  }
});

test("identical pre-trends can accompany a post-treatment violation", () => {
  const parallel = didHistory();
  const shock = didHistory("shock");
  assert.deepEqual(parallel.treated, shock.treated);
  assert.deepEqual(parallel.comparison, shock.comparison);
  assert.equal(estimateDid(parallel.observed).effect, 15);
  assert.equal(estimateDid(shock.observed).effect, 25);
  assert.equal(shock.truth.effect, 15);
  const drift = didHistory("drift");
  assert.equal(drift.treated[2] - drift.treated[1], 15);
  assert.equal(drift.comparison[2] - drift.comparison[1], 5);
  assert.deepEqual(drift.observed, shock.observed);
});

test("observations alone do not determine the true effect", () => {
  const { observed } = didWorld();
  const estimate = estimateDid(observed);
  // The same 65% observed endpoint is compatible with these two hidden worlds.
  const alternatives = [
    { untreated: 50, effect: 15 },
    { untreated: 60, effect: 5 },
  ];
  for (const world of alternatives) {
    assert.equal(world.untreated + world.effect, observed.treatedAfter);
    assert.equal(estimate.effect, 15);
  }
});
