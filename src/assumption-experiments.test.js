import test from "node:test";
import assert from "node:assert/strict";
import {
  exchangeabilityWorld,
  armDistribution,
  treatmentComparison,
  supportWorld,
  coachingOutcome,
  coachingPolicy,
  peerOutcome,
} from "./assumption-experiments.js";

const near = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);

test("assignment changes comparisons, never the population or potential outcomes", () => {
  const baseline = exchangeabilityWorld();
  for (const mechanism of ["randomized", "measured", "hidden"]) {
    const rows = exchangeabilityWorld(mechanism);
    assert.deepEqual(
      rows.map(({ p, ...person }) => person),
      baseline.map(({ p, ...person }) => person),
    );
    near(
      rows.reduce((sum, row) => sum + row.mass * (row.y1 - row.y0), 0),
      2,
    );
    for (const arm of [0, 1])
      for (const outcome of ["y0", "y1"])
        near(
          armDistribution(rows, arm, outcome).reduce(
            (sum, bin) => sum + bin.share,
            0,
          ),
          1,
        );
  }
});

test("adjustment resolves measured selection but not hidden selection", () => {
  for (const outcome of ["y0", "y1"]) {
    const random = exchangeabilityWorld();
    assert.deepEqual(
      armDistribution(random, 0, outcome),
      armDistribution(random, 1, outcome),
    );
    for (const mechanism of ["measured", "hidden"]) {
      const rows = exchangeabilityWorld(mechanism);
      assert.notDeepEqual(
        armDistribution(rows, 0, outcome),
        armDistribution(rows, 1, outcome),
      );
      for (const c of [0, 1]) {
        const group = rows.filter((row) => row.c === c);
        const first = armDistribution(group, 0, outcome);
        const second = armDistribution(group, 1, outcome);
        if (mechanism === "measured")
          first.forEach((bin, i) => near(bin.share, second[i].share));
        else assert.notDeepEqual(first, second);
      }
    }
  }
  near(treatmentComparison(exchangeabilityWorld()), 2);
  near(treatmentComparison(exchangeabilityWorld("measured")), 4.4);
  near(treatmentComparison(exchangeabilityWorld("measured"), true), 2);
  const hidden = exchangeabilityWorld("hidden");
  near(treatmentComparison(hidden, true), 4.4);
  for (const c of [0, 1])
    near(
      hidden
        .filter((row) => row.c === c)
        .reduce((sum, row) => sum + row.mass * row.p, 0),
      0.25,
    );
});

test("clipping never changes support and cannot weight missing people", () => {
  for (const support of ["good", "weak", "absent"]) {
    const original = supportWorld(support);
    const clipped = supportWorld(support, true);
    original.forEach((group, c) => {
      near(
        group.arms.reduce((sum, arm) => sum + arm.count, 0),
        100,
      );
      assert.equal(group.p, clipped[c].p);
      group.arms.forEach((arm, a) => {
        assert.equal(arm.count, clipped[c].arms[a].count);
        if (arm.count === 0) assert.equal(clipped[c].arms[a].weight, null);
        else near(arm.count * arm.weight, 100);
      });
    });
  }
  assert.equal(supportWorld("weak")[0].arms[1].weight, 20);
  assert.equal(supportWorld("weak", true)[0].arms[1].weight, 10);
  assert.equal(supportWorld("absent", true)[1].arms[0].count, 0);
});

test("a specified version mixture has its own expected outcome", () => {
  assert.equal(coachingPolicy(0), coachingOutcome("brief"));
  assert.equal(coachingPolicy(1), coachingOutcome("intensive"));
  assert.equal(coachingPolicy(0.5), 58);
  assert.notEqual(coachingOutcome("brief"), coachingOutcome("intensive"));
});

test("peer treatment matters only with interference; direct and allocation effects differ", () => {
  for (const own of [false, true]) {
    assert.equal(peerOutcome(own, false, false), peerOutcome(own, true, false));
    assert.equal(
      peerOutcome(own, true, true) - peerOutcome(own, false, true),
      8,
    );
  }
  for (const peer of [false, true])
    assert.equal(
      peerOutcome(true, peer, true) - peerOutcome(false, peer, true),
      10,
    );
  assert.equal(
    peerOutcome(true, true, true) - peerOutcome(false, false, true),
    18,
  );
});
