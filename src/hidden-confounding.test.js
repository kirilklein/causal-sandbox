import test from "node:test";
import assert from "node:assert/strict";
import { estimate, makeNoise } from "./simulation.js";
import {
  lessonBaseline,
  simulateLesson,
  lessonResult,
} from "./lesson-simulation.js";

test("level 9 keeps C measured and U hidden while strength changes only its two pathways", () => {
  const baseline = lessonBaseline(9);
  const noise = makeNoise(baseline.n, baseline.seed);
  const data = simulateLesson(baseline, noise);
  const analystData = (rows) => rows.map(({ A, C, Y }) => ({ A, C, Y }));
  assert.deepEqual(analystData(data), simulateLesson(lessonBaseline(4), noise));
  assert.deepEqual(Object.keys(data[0]).sort(), ["A", "C", "U", "Y"]);
  assert.ok(data.every((d) => d.U === 0 || d.U === 1));
  const state = { ...baseline, hiddenStrength: 2 };
  const strong = simulateLesson(state, noise);
  strong.forEach((d, i) => {
    assert.equal(d.C, data[i].C);
    assert.equal(d.U, data[i].U);
    const influence = 2 * (d.U - 0.5);
    const probability = 1 / (1 + Math.exp(0.8 - 1.2 * d.C - influence));
    assert.equal(d.A, +(noise[i].a < probability));
    assert.ok(
      Math.abs(d.Y - data[i].Y - 2 * (d.A - data[i].A) - influence) < 1e-12,
    );
  });
  const result = lessonResult(state, noise);
  const analysis = estimate(analystData(strong), ["C"]);
  for (const [method, index] of [
    ["ipw", 3],
    ["regression", 2],
    ["aipw", 4],
  ])
    assert.equal(result[method], analysis.values[index]);
  assert.ok(result.before.every(Number.isFinite));
  assert.ok(result.after.every(Number.isFinite));
  assert.equal(lessonBaseline(9).hiddenStrength, 0);
  assert.deepEqual(
    lessonResult({ ...state, hiddenStrength: 0 }),
    lessonResult(baseline),
  );
  assert.notDeepEqual(result, lessonResult({ ...state, seed: 4218 }));
  assert.deepEqual(
    strong,
    simulateLesson(
      state,
      noise.map((e) => ({ ...e, C2: 1e6, eM: 1e6, eK: 1e6 })),
    ),
  );
  const changedEffect = simulateLesson({ ...state, effect: 3 }, noise);
  strong.forEach((d, i) =>
    assert.ok(Math.abs(changedEffect[i].Y - d.Y - d.A) < 1e-12),
  );
});

test("hidden-confounding bias grows across 40 samples while diagnostic adjustment for U recovers truth", () => {
  let previous;
  for (const hiddenStrength of [0, 0.5, 1, 1.5, 2]) {
    const bias = { ipw: 0, regression: 0, aipw: 0 };
    const oracleBias = { ipw: 0, regression: 0, aipw: 0 };
    for (let seed = 100; seed < 140; seed++) {
      const state = { ...lessonBaseline(9), seed, hiddenStrength };
      const result = lessonResult(state);
      // Diagnostic only: the lesson never provides U to either model.
      const oracle = estimate(simulateLesson(state), ["C", "U"]);
      assert.equal(result.clipped, 0);
      for (const [method, index] of [
        ["ipw", 3],
        ["regression", 2],
        ["aipw", 4],
      ]) {
        assert.ok(Number.isFinite(result[method]));
        bias[method] += (result[method] - 2) / 40;
        oracleBias[method] += (oracle.values[index] - 2) / 40;
      }
    }
    for (const method in bias) {
      assert.ok(
        Math.abs(oracleBias[method]) < 0.06,
        JSON.stringify(oracleBias),
      );
      if (hiddenStrength === 0) assert.ok(Math.abs(bias[method]) < 0.06);
      if (hiddenStrength === 2) assert.ok(bias[method] > 0.8);
      if (previous)
        assert.ok(bias[method] > previous[method], JSON.stringify(bias));
    }
    previous = bias;
  }
});
