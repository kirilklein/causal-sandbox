import test from "node:test";
import assert from "node:assert/strict";
import {
  health,
  cohort,
  profiles,
  treatmentProbability,
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

test("ten retained profiles preserve identities and use only their factual outcomes in the pool", () => {
  const baseline = profiles();
  assert.equal(baseline.length, 10);
  assert.deepEqual(
    baseline.map((p) => p.severity),
    SEVERITIES,
  );
  // Hand calculation: treated severities 2,6,7,8,9; untreated 0,1,3,4,5.
  const result = comparison(1, 1, baseline);
  assert.deepEqual(
    baseline.filter((p) => p.treatment).map((p) => p.severity),
    [2, 6, 7, 8, 9],
  );
  close(result.means[1], 90 - (48 / 9) * (32 / 5));
  close(result.means[0], 78 - (48 / 9) * (13 / 5));
  close(result.difference, -124 / 15);
  for (const strength of [0, 0.25, 0.5, 0.75, 1]) {
    const retained = profiles(strength);
    assert.deepEqual(
      retained.map((p) => p.id),
      baseline.map((p) => p.id),
    );
    const summary = comparison(strength, 1, retained);
    assert.equal(
      summary.armCounts.reduce((a, b) => a + b),
      10,
    );
    assert.ok(summary.armCounts.every((n) => n > 0));
    for (const patient of retained) {
      assert.deepEqual(
        cohort(strength).find((p) => p.id === patient.id),
        patient,
      );
      close(
        health(patient.severity, 12, 1) - health(patient.severity, 12, 0),
        12,
      );
      const group = cohort(strength).filter(
        (p) => p.severity === patient.severity,
      );
      close(
        group.filter((p) => p.treatment).length / 10,
        treatmentProbability(patient.severity, strength),
      );
    }
  }
  // Equal assignment probability does not force balance in the ten retained people.
  close(comparison(0, 1, profiles(0)).difference, 128 / 9);
});

test("prognostic strength changes both outcomes but preserves the paired benefit", () => {
  for (const prognosis of [0, 0.25, 0.5, 0.75, 1]) {
    for (const severity of SEVERITIES) {
      close(
        health(severity, 0, 0, prognosis),
        90 - (20 * prognosis * severity) / 9,
      );
      close(
        health(severity, 12, 0, prognosis),
        78 - (48 * prognosis * severity) / 9,
      );
      for (let day = 0; day <= 12; day += 0.5) {
        close(
          health(severity, day, 1, prognosis) -
            health(severity, day, 0, prognosis),
          health(0, day, 1) - health(0, day, 0),
        );
        if (prognosis === 0) {
          for (const treatment of [0, 1])
            close(
              health(severity, day, treatment, prognosis),
              health(0, day, treatment),
            );
        }
      }
    }
    // The ten retained profiles have treated mean severity 6.4 vs untreated 2.6.
    close(
      comparison(1, prognosis, profiles(1)).difference,
      12 - (48 * prognosis * 3.8) / 9,
    );
  }
  for (const selection of [0, 0.25, 0.5, 0.75, 1])
    close(comparison(selection, 0, profiles(selection)).difference, 12);
});
