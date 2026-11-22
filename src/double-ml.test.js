import test from "node:test";
import assert from "node:assert/strict";
import {
  doubleMlBaseline,
  doubleMlSample,
  doubleMlEstimates,
  doubleMlStudies,
  doubleMlSummary,
  knnRegression,
  knnNeighbors,
  foldAssignment,
  aipwScore,
  outcomeNeighbors,
  zoomRows,
  typicalRow,
} from "./double-ml.js";
import { isBiased, undercovers } from "./double-ml-view.js";

const close = (actual, expected, tol = 1e-12) =>
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `${actual} is not within ${tol} of ${expected}`,
  );

test("kNN regression averages the k nearest outcomes on C", () => {
  const rows = [
    { C: 0, Y: 1 },
    { C: 1, Y: 3 },
    { C: 2, Y: 5 },
    { C: 4, Y: 11 },
  ];
  close(knnRegression(rows, 1)(1.2), 3);
  close(knnRegression(rows, 2)(1.2), 4); // C = 1 and 2
  close(knnRegression(rows, 3)(3.1), (3 + 5 + 11) / 3);
  // Tie at 0.5 between C = 0 and C = 1 keeps the earlier row.
  assert.deepEqual(knnNeighbors(rows, 1)(0.5), [0]);
  assert.throws(() => knnRegression(rows, 5), RangeError);
  assert.throws(() => knnRegression(rows, 0), RangeError);
});

test("folds partition every row with balanced sizes", () => {
  const foldOf = foldAssignment(603, 5, 9);
  assert.equal(foldOf.length, 603);
  const sizes = [0, 1, 2, 3, 4].map(
    (f) => foldOf.filter((v) => v === f).length,
  );
  assert.equal(
    sizes.reduce((s, v) => s + v, 0),
    603,
  );
  assert.ok(Math.max(...sizes) - Math.min(...sizes) <= 1);
  assert.deepEqual(foldAssignment(603, 5, 9), foldOf);
  assert.throws(() => foldAssignment(3, 1, 9), RangeError);
});

test("AIPW score matches a hand calculation", () => {
  const nuisance = { m0: 1, m1: 3, p: 0.25 };
  close(aipwScore({ A: 1, Y: 4 }, nuisance), 2 + 4 * 1);
  close(aipwScore({ A: 0, Y: 0 }, nuisance), 2 - (1 / 0.75) * -1);
});

test("a cross-fitted prediction never uses its own observation", () => {
  const data = doubleMlSample({ n: 200, seed: 31007 });
  const settings = { n: 200, seed: 31007, outcomeK: 1, propensityK: 20 };
  const base = doubleMlEstimates(data, settings);
  for (const row of [0, 17, 123]) {
    const changed = structuredClone(data);
    changed[row].Y += 1000;
    const after = doubleMlEstimates(changed, settings);
    // Own outcome moves the score only through the residual Y − m̂(C):
    // the cross-fit residual shifts by exactly the perturbation.
    close(
      after.crossFit.residuals[row] - base.crossFit.residuals[row],
      1000,
      1e-9,
    );
    // In-sample with k = 1, a row is its own neighbour: residual stays 0.
    close(after.inSample.residuals[row], 0);
    const neighbors = outcomeNeighbors(data, row, {
      k: 5,
      foldOf: base.foldOf,
      crossFit: true,
    });
    assert.ok(neighbors.every((i) => base.foldOf[i] !== base.foldOf[row]));
    assert.ok(
      outcomeNeighbors(data, row, { k: 1, crossFit: false }).includes(row),
    );
  }
});

test("in-sample k = 1 residuals are exactly zero and the score equals the plug-in", () => {
  const data = doubleMlSample({ n: 300, seed: 31002 });
  const result = doubleMlEstimates(data, { outcomeK: 1, seed: 31002 });
  assert.ok(result.inSample.residuals.every((r) => r === 0));
  close(result.inSample.estimate, result.plugIn.estimate, 1e-12);
});

test("estimation does not mutate the data", () => {
  const data = doubleMlSample({ n: 200, seed: 31003 });
  const copy = structuredClone(data);
  doubleMlEstimates(data, { seed: 31003 });
  assert.deepEqual(data, copy);
});

test("too few people for the learner is reported as unavailable", () => {
  const data = doubleMlSample({ n: 60, seed: 31004 });
  const result = doubleMlEstimates(data, { propensityK: 60 });
  assert.equal(result.status, "unavailable");
  assert.match(result.reason, /fewer than 60/);
  const treatedOnly = data.map((d) => ({ ...d, A: 1 }));
  assert.equal(
    doubleMlEstimates(treatedOnly, { outcomeK: 1 }).status,
    "unavailable",
  );
});

// Repeated-sample claims taught in the lesson. 300 seeds; tolerances use MCSE.
const summaryAt = (outcomeK) =>
  doubleMlSummary(doubleMlStudies({ outcomeK }, 300));

test("smooth learners bias the plug-in; the orthogonal score removes most of it", () => {
  const s = summaryAt(40);
  assert.ok(s.plugIn.bias > 0.3, `plug-in bias ${s.plugIn.bias}`);
  assert.ok(Math.abs(s.crossFit.bias) < 3 * s.crossFit.mcse + 0.01);
  assert.ok(Math.abs(s.inSample.bias) < s.plugIn.bias / 4);
  assert.ok(isBiased(s.plugIn));
  assert.ok(!isBiased(s.inSample));
});

test("without cross-fitting, a flexible learner's intervals are too narrow", () => {
  const s = summaryAt(1);
  assert.ok(s.inSample.coverage < 0.8, `coverage ${s.inSample.coverage}`);
  assert.ok(s.inSample.meanSE < 0.7 * s.inSample.sd);
  assert.ok(s.crossFit.coverage > 0.9 && s.crossFit.coverage < 0.98);
  assert.ok(Math.abs(s.crossFit.bias) < 3 * s.crossFit.mcse);
  assert.ok(undercovers(s.inSample));
  assert.ok(!undercovers(s.crossFit));
});

test("cross-fitting keeps coverage near 95% across the lesson's k values", () => {
  for (const k of [2, 5, 10, 20]) {
    const s = summaryAt(k);
    assert.ok(
      s.crossFit.coverage > 0.9 && s.crossFit.coverage < 0.99,
      `k=${k} coverage ${s.crossFit.coverage}`,
    );
    assert.ok(Math.abs(s.crossFit.bias) < 3 * s.crossFit.mcse + 0.01);
  }
  assert.equal(doubleMlBaseline.folds, 5);
});

test("zoom rows are same-arm, include the selected row, and respect the size", () => {
  const data = doubleMlSample({ n: 200, seed: 31005 });
  for (const row of [0, 50, 199]) {
    const rows = zoomRows(data, row, 30);
    assert.equal(rows.length, 30);
    assert.ok(rows.includes(row));
    assert.ok(rows.every((i) => data[i].A === data[row].A));
    const far = Math.max(...rows.map((i) => Math.abs(data[i].C - data[row].C)));
    const outside = data.filter(
      (d, i) => d.A === data[row].A && !rows.includes(i),
    );
    assert.ok(outside.every((d) => Math.abs(d.C - data[row].C) >= far));
  }
});

test("the illustrated person is untreated, mid-range in C, and fixed", () => {
  const data = doubleMlSample();
  const estimates = doubleMlEstimates(data);
  const row = typicalRow(data, estimates);
  assert.equal(data[row].A, 0);
  assert.ok(Math.abs(data[row].C) < 0.5);
  assert.equal(typicalRow(data, doubleMlEstimates(data)), row);
  assert.notEqual(estimates.crossFit.residuals[row], 0);
});
