import test from "node:test";
import assert from "node:assert/strict";
import {
  observedPatients,
  observedComparison,
  repeatedDifferences,
} from "./foundations-study.js";
import { BENEFIT } from "./trajectory-model.js";

test("assignment changes group composition while observed comparisons within severity recover the effect", () => {
  const baseline = observedPatients(1);
  for (const strength of [0, 0.25, 0.5, 0.75, 1]) {
    const rows = observedPatients(strength);
    rows.forEach(({ id, severity, treatment, score }, i) => {
      const before = baseline[i];
      assert.equal(id, before.id);
      assert.equal(severity, before.severity);
      assert.ok(
        Math.abs(
          score - before.score - BENEFIT * (treatment - before.treatment),
        ) < 1e-10,
      );
    });
    assert.ok(Math.abs(observedComparison(rows).standardized - 12) < 1e-10);
  }
  const { arms } = observedComparison(baseline);
  assert.equal((arms[1].mean - arms[0].mean).toFixed(2), "-2.93");
  assert.equal(
    observedComparison(baseline.filter((p) => p.severity || p.treatment))
      .standardized,
    null,
  );
  const edited = baseline.map((p) => ({ ...p, score: p.score + p.treatment }));
  assert.ok(Math.abs(observedComparison(edited).standardized - 13) < 1e-10);
});

test("larger samples tighten the crude comparison around its biased population value", () => {
  function summary(n) {
    const values = repeatedDifferences(n, 400);
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const variance =
      values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
    return { mean, variance };
  }
  const small = summary(100),
    large = summary(1600);
  assert.ok(Math.abs(small.mean + 2.93) < 0.6);
  assert.ok(Math.abs(large.mean + 2.93) < 0.2);
  assert.ok(large.variance < small.variance / 8);
});

test("random allocation uses the same patients and varies between trials", async () => {
  const { randomizedPatients } = await import("./foundations-study.js");
  const first = randomizedPatients(4218);
  const next = randomizedPatients(4219);
  assert.deepEqual(first, randomizedPatients(4218));
  assert.notDeepEqual(first, next);
  const baseline = observedPatients(1);
  first.forEach((p, i) => {
    assert.equal(p.id, baseline[i].id);
    assert.equal(p.severity, baseline[i].severity);
    assert.ok(
      Math.abs(
        p.score -
          baseline[i].score -
          BENEFIT * (p.treatment - baseline[i].treatment),
      ) < 1e-10,
    );
  });
});
