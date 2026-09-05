import test from "node:test";
import assert from "node:assert/strict";
import { estimate } from "./simulation.js";
import {
  lessonBaseline,
  lessonResult,
  simulateLesson,
} from "./lesson-simulation.js";
import { aipwCalculation, aipwFormula } from "./aipw-calculation.js";

const close = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);

test("worked AIPW terms reconstruct every model combination without changing estimates", () => {
  for (const seed of [100, 101, 4217]) {
    for (const outcomeQuadratic of [false, true]) {
      for (const treatmentQuadratic of [false, true]) {
        const state = {
          ...lessonBaseline(6),
          seed,
          outcomeQuadratic,
          treatmentQuadratic,
        };
        const data = simulateLesson(state);
        const original = structuredClone(data);
        const fit = estimate(data, ["C"], state);
        const detailed = estimate(data, ["C"], { ...state, aipwDetails: true });
        assert.deepEqual(detailed.values, fit.values);
        assert.deepEqual(data, original);
        assert.equal(fit.aipwContributions, undefined);
        const rows = detailed.aipwContributions;
        assert.equal(rows.length, data.length);
        rows.forEach((row, i) => {
          assert.equal(row.person, i + 1);
          assert.equal(row.A, data[i].A);
          assert.equal(row.Y, data[i].Y);
          close(row.p, Math.max(0.02, Math.min(0.98, fit.propensities[i])));
          close(row.weight, fit.weights[i]);
          close(row.residual, row.Y - (row.A ? row.m1 : row.m0));
          close(row.correction, (row.A ? 1 : -1) * row.weight * row.residual);
          close(row.contrast, row.m1 - row.m0);
          close(row.contribution, row.contrast + row.correction);
        });
        const mean = (key) =>
          rows.reduce((s, d) => s + d[key], 0) / rows.length;
        close(mean("contrast"), fit.values[2]);
        close(mean("contrast") + mean("correction"), fit.values[4]);
        close(mean("contribution"), fit.values[4]);
        assert.deepEqual(lessonResult(state).aipwContributions, rows);
      }
    }
  }
});

test("worked corrections use both clipped tails and whole-sample normalization", () => {
  const state = { ...lessonBaseline(6), selection: 8 };
  const fit = estimate(simulateLesson(state), ["C"], {
    ...state,
    aipwDetails: true,
  });
  assert.ok(fit.clipped > 0);
  const rows = fit.aipwContributions;
  assert.ok(rows.some(({ p }) => p === 0.02));
  assert.ok(rows.some(({ p }) => p === 0.98));
  const mean = (key) => rows.reduce((s, d) => s + d[key], 0) / rows.length;
  rows.forEach((d) => close(d.weight, 1 / (d.A ? d.p : 1 - d.p)));
  close(mean("contribution"), fit.values[4]);
  assert.ok(
    Math.abs(fit.values[3] + mean("correction") - fit.values[4]) > 0.01,
  );
});

test("details remain specific to the double-robustness lesson", () => {
  for (const level of [3, 4, 5, 9, 10])
    assert.equal(
      lessonResult(lessonBaseline(level)).aipwContributions,
      undefined,
    );
});

test("worked rendering uses all people and labels unavailable calculations", () => {
  const rows = lessonResult(lessonBaseline(6)).aipwContributions;
  const original = structuredClone(rows);
  const html = aipwCalculation(rows);
  assert.match(html, /all 2,400 people/);
  const formula = aipwFormula();
  assert.match(formula, /Hájek normalization/);
  assert.match(formula, /<math display="block" aria-label=/);
  const mean = rows.reduce((s, d) => s + d.contribution, 0) / rows.length;
  assert.ok(html.includes(`id="aipw-worked-effect">${mean.toFixed(2)}`));
  assert.deepEqual(rows, original);
  for (const invalid of [
    [],
    rows.filter(({ A }) => A === 1),
    [{ ...rows[0], p: NaN }],
    [{ ...rows[0], contribution: Infinity }],
  ])
    assert.match(aipwCalculation(invalid), /unavailable/);
});
