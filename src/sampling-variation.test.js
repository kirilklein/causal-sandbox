import test from "node:test";
import assert from "node:assert/strict";
import {
  lessonBaseline,
  lessonResult,
  simulateLesson,
} from "./lesson-simulation.js";
import { samplingView } from "./sampling-variation.js";

test("repeated randomized studies have sampling spread; confounded studies retain bias", () => {
  const randomized = [];
  const confounded = [];
  for (let seed = 200; seed < 280; seed++) {
    const state = { ...lessonBaseline(1), seed };
    const result = lessonResult(state).unadjusted;
    const data = simulateLesson(state);
    const means = [0, 1].map((arm) => {
      const group = data.filter(({ A }) => A === arm);
      return group.reduce((sum, { Y }) => sum + Y, 0) / group.length;
    });
    assert.ok(Math.abs(result - (means[1] - means[0])) < 1e-12);
    randomized.push(result);
    confounded.push(
      lessonResult({ ...lessonBaseline(2), selection: 1.2, seed }).unadjusted,
    );
  }
  const mean = (values) =>
    values.reduce((sum, value) => sum + value, 0) / values.length;
  const average = mean(randomized);
  const sd = Math.sqrt(
    randomized.reduce((sum, value) => sum + (value - average) ** 2, 0) /
      (randomized.length - 1),
  );
  const p = 1 / (1 + Math.exp(0.8));
  // Unit outcome-noise variance and independent Bernoulli treatment assignment.
  const expectedSd = Math.sqrt(1 / (2400 * p * (1 - p)));
  assert.ok(Math.abs(average - 2) < 0.02);
  assert.ok(sd > expectedSd * 0.75 && sd < expectedSd * 1.25);
  assert.ok(randomized.some((value) => value < 2));
  assert.ok(randomized.some((value) => value > 2));
  assert.ok(mean(confounded) - 2 > 1.4);
  assert.equal(new Set(randomized).size, randomized.length);
  assert.equal(
    lessonResult({ ...lessonBaseline(1), seed: 200 }).unadjusted,
    randomized[0],
  );
  console.log(
    `Repeated studies: randomized mean ${average.toFixed(3)}, SD ${sd.toFixed(3)} (expected ${expectedSd.toFixed(3)}); confounded mean ${mean(confounded).toFixed(3)}.`,
  );
});

test("repeated-study display retains failures and off-scale values without false bounds", () => {
  const studies = [2.1, -2, 8, NaN, Infinity, null].map((estimate, seed) => ({
    estimate,
    seed,
  }));
  const view = samplingView(studies, 2);
  assert.match(view.summary, /6 studies/);
  assert.match(view.summary, /Mean estimate: 2.700/);
  assert.match(view.summary, /3 unavailable/);
  assert.match(view.summary, /2 off-scale/);
  assert.match(view.rows, /-2.000/);
  assert.match(view.rows, /8.000/);
  assert.equal((view.rows.match(/<tr>/g) || []).length, 6);
  assert.doesNotMatch(view.plot, /NaN|Infinity/);
  const unavailable = samplingView([{ seed: 1, estimate: NaN }], 0);
  assert.match(unavailable.summary, /Mean estimate: Unavailable/);
  assert.match(unavailable.rows, /Unavailable/);
  const negative = samplingView([{ seed: 1, estimate: -0.9 }], -1);
  assert.match(negative.rows, /0.100/);
  assert.match(negative.summary, /True effect: -1.000/);
});
