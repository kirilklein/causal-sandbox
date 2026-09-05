import test from "node:test";
import assert from "node:assert/strict";
import { makeNoise } from "./simulation.js";
import {
  lessonBaseline,
  simulateLesson,
  lessonResult,
} from "./lesson-simulation.js";

test("beginner worlds contain only the stated variables and mechanisms", () => {
  const noise = makeNoise();
  const baseline = lessonBaseline(1);
  const random = simulateLesson(baseline, noise);
  assert.deepEqual(Object.keys(random[0]).sort(), ["A", "Y"]);
  const changed = simulateLesson({ ...baseline, effect: 3 }, noise);
  random.forEach((d, i) => {
    assert.equal(changed[i].A, d.A);
    assert.ok(Math.abs(changed[i].Y - d.Y - d.A) < 1e-12);
  });
  const health = simulateLesson(lessonBaseline(2), noise);
  assert.deepEqual(Object.keys(health[0]).sort(), ["A", "C", "Y"]);
  health.forEach((d, i) => {
    assert.equal(d.C, noise[i].C1);
    assert.equal(d.A, random[i].A);
    assert.ok(Math.abs(d.Y - random[i].Y - 1.5 * d.C) < 1e-12);
  });
  const alternativeNoise = noise.map((e) => ({
    ...e,
    C2: 1e6,
    U: 1e6,
    eM: 1e6,
    eK: 1e6,
  }));
  assert.deepEqual(
    simulateLesson(lessonBaseline(3), alternativeNoise),
    simulateLesson(lessonBaseline(3), noise),
  );
});

test("baseline, adjustment, and redraw do not leak state or alter the world", () => {
  const baseline = lessonBaseline(3);
  const before = simulateLesson(baseline);
  assert.deepEqual(before, simulateLesson({ ...baseline, adjusted: true }));
  assert.notDeepEqual(before, simulateLesson({ ...baseline, seed: 4218 }));
  baseline.effect = -1;
  baseline.adjusted = true;
  assert.deepEqual(lessonBaseline(3), {
    level: 3,
    seed: 4217,
    n: 2400,
    effect: 2,
    selection: 1.2,
    outcomeInfluence: 1.5,
    adjusted: false,
  });
  assert.throws(() => lessonBaseline(4), /Unknown lesson/);
});

test("randomization, confounding, and weighting contrasts hold across 40 samples", () => {
  const sums = { random: 0, health: 0, raw: 0, ipw: 0, before: 0, after: 0 };
  let improved = 0;
  for (let seed = 100; seed < 140; seed++) {
    const r1 = lessonResult({ ...lessonBaseline(1), seed });
    const r2 = lessonResult({ ...lessonBaseline(2), seed });
    const baseline = { ...lessonBaseline(3), seed };
    const off = lessonResult(baseline);
    const on = lessonResult({ ...baseline, adjusted: true });
    assert.ok(Math.abs(off.ipw - off.unadjusted) < 1e-10);
    assert.deepEqual(off.before, on.before);
    assert.equal(off.unadjusted, on.unadjusted);
    assert.equal(on.clipped, 0);
    sums.random += r1.unadjusted - 2;
    sums.health += r2.unadjusted - 2;
    sums.raw += on.unadjusted - 2;
    sums.ipw += on.ipw - 2;
    sums.before += Math.abs(on.before[1] - on.before[0]);
    sums.after += Math.abs(on.after[1] - on.after[0]);
    if (Math.abs(on.ipw - 2) < Math.abs(on.unadjusted - 2)) improved++;
  }
  for (const key of ["random", "health", "ipw"])
    assert.ok(Math.abs(sums[key] / 40) < 0.06, `${key}: ${sums[key] / 40}`);
  assert.ok(sums.raw / 40 > 1);
  assert.ok(sums.after / 40 < 0.06);
  assert.ok(sums.before / 40 > 0.7);
  assert.ok(improved >= 36);
  console.log(
    "Lesson validation, mean bias and balance over 40 samples:",
    Object.fromEntries(Object.entries(sums).map(([k, v]) => [k, v / 40])),
  );
});
