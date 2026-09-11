import test from "node:test";
import assert from "node:assert/strict";
import {
  health,
  cohort,
  comparison,
  BENEFIT,
  SEVERITIES,
} from "./trajectory-model.js";
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);
test("paired histories coincide before treatment and peel away smoothly", () => {
  for (const c of SEVERITIES) {
    for (let day = 0; day <= 4; day += 0.125)
      close(health(c, day, 0), health(c, day, 1));
    close(health(c, 12, 1) - health(c, 12, 0), BENEFIT);
    assert.ok(health(c, 4.001, 1) - health(c, 4.001, 0) < 1e-5);
    for (let day = 0; day <= 12; day += 0.125)
      assert.ok(health(c, day, 1) >= health(c, day, 0));
  }
});
test("the constructed population reverses the pooled contrast but has a fixed positive effect", () => {
  const result = comparison();
  close(result.means[0], 61.46666666666667);
  close(result.means[1], 58.53333333333333);
  close(result.difference, -2.93333333333333);
  assert.deepEqual(result.counts, [1, 2, 3, 4, 5, 5, 6, 7, 8, 9]);
  assert.deepEqual(result.standardized, [54, 66]);
});
test("every selection setting preserves people, balanced arm counts, overlap and effect", () => {
  for (const strength of [0, 0.25, 0.5, 0.75, 1]) {
    const people = cohort(strength);
    assert.equal(people.length, 100);
    assert.equal(people.filter((p) => p.treatment).length, 50);
    assert.deepEqual(
      people.map(({ treatment, ...p }) => p),
      cohort(0).map(({ treatment, ...p }) => p),
    );
    for (const c of SEVERITIES)
      for (const a of [0, 1])
        assert.ok(people.some((p) => p.severity === c && p.treatment === a));
    close(comparison(strength, 0).difference, 12);
    close(
      comparison(strength).standardized[1] -
        comparison(strength).standardized[0],
      12,
    );
  }
  close(comparison(0).difference, 12);
});
