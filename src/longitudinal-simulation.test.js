import test from "node:test";
import assert from "node:assert/strict";
import {
  longitudinalSample,
  longitudinalEstimates,
} from "./longitudinal-simulation.js";
import { studySummary } from "./instrument-simulation.js";

const close = (actual, expected, tolerance = 1e-10) =>
  assert.ok(
    Math.abs(actual - expected) < tolerance,
    `${actual} versus ${expected}`,
  );

function population(confounded) {
  const data = [];
  for (const A1 of [0, 1])
    for (const L of [0, 1])
      for (const A2 of [0, 1]) {
        const severity = A1 ? 0.3 : 0.7;
        const treatment = confounded ? (L ? 0.8 : 0.2) : 0.5;
        const count = Math.round(
          10000 *
            0.5 *
            (L ? severity : 1 - severity) *
            (A2 ? treatment : 1 - treatment),
        );
        for (let i = 0; i < count; i++)
          data.push({ A1, L, A2, Y: 6 - A1 - A2 + 2 * L });
      }
  return data;
}

test("exact population separates confounding from blocking the mediated benefit", () => {
  const randomized = longitudinalEstimates(population(false));
  const confounded = longitudinalEstimates(population(true), true);
  const treatedMean = 0.7 * 4 + 0.3 * 6;
  const untreatedMean = 0.3 * 6 + 0.7 * 8;
  close(treatedMean - untreatedMean, -2.8);
  close(randomized.unadjusted, -2.8);
  close(randomized.adjusted, -2);
  close(randomized.ipw, -2.8);
  close(confounded.unadjusted, -2 + 2 * (0.24 / 0.38 - 0.14 / 0.38));
  close(confounded.adjusted, -2);
  close(confounded.ipw, -2.8);
});

test("weights use actual treatment including no treatment and normalize within strategy", () => {
  const data = population(true);
  const fit = longitudinalEstimates(data, true);
  const sums = [0, 0],
    totals = [0, 0];
  data.forEach((d, i) => {
    const p = d.L ? 0.8 : 0.2;
    const w = 2 / (d.A2 ? p : 1 - p);
    close(fit.weights[i].weight, w);
    if (d.A1 === d.A2) {
      sums[d.A1] += w * d.Y;
      totals[d.A1] += w;
    }
  });
  close(fit.ipw, sums[1] / totals[1] - sums[0] / totals[0]);
  // High severity in the both-treated group retains its intervention prevalence.
  const both = data
    .map((d, i) => ({ ...d, w: fit.weights[i].weight }))
    .filter((d) => d.A1 && d.A2);
  close(
    both.reduce((s, d) => s + d.w * d.L, 0) / both.reduce((s, d) => s + d.w, 0),
    0.3,
  );
});

test("changing the second assignment rule preserves first treatment, severity, and paired noise", () => {
  const r = longitudinalSample();
  assert.deepEqual(r, longitudinalSample());
  const c = longitudinalSample({ confounded: true });
  r.data.forEach((d, i) => {
    assert.equal(d.A1, c.data[i].A1);
    assert.equal(d.L, c.data[i].L);
    close(d.Y + d.A2, c.data[i].Y + c.data[i].A2);
  });
  assert.equal(r.truth, c.truth);
  assert.notDeepEqual(r.data, c.data);
});

test("independent repeated samples recover population limits", () => {
  for (const confounded of [false, true]) {
    const samples = Array.from({ length: 160 }, (_, i) =>
      longitudinalSample({ seed: 700 + i, confounded }),
    );
    const targets = {
      unadjusted: confounded ? -1.4736842105263157 : -2.8,
      adjusted: -2,
      ipw: -2.8,
    };
    for (const [method, target] of Object.entries(targets)) {
      const summary = studySummary(
        samples.map((r) => r[method]),
        target,
      );
      assert.equal(summary.unavailable, 0);
      close(summary.mean, target, 0.025);
      assert.ok(summary.sd > 0.02);
    }
  }
});

test("empty or unsupported histories report unavailable estimates", () => {
  for (const data of [[], [{ A1: 0, L: 0, A2: 0, Y: 6 }]]) {
    const fit = longitudinalEstimates(data, true);
    assert.equal(fit.supported, false);
    assert.ok(Number.isNaN(fit.ipw));
    assert.ok(Number.isNaN(fit.adjusted));
    assert.ok(Number.isNaN(fit.unadjusted));
  }
});
