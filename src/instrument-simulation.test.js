import test from "node:test";
import assert from "node:assert/strict";
import { instrumentAdjustment, studySummary } from "./instrument-simulation.js";
import { makeNoise, estimate } from "./simulation.js";

test("sampling SD uses study count minus one and RMSE measures error against truth", () => {
  const r = studySummary([2, 4, 6, NaN]);
  assert.equal(r.mean, 4);
  assert.equal(r.sd, 2);
  assert.equal(r.rmse, Math.sqrt(20 / 3));
  assert.equal(r.count, 3);
  assert.equal(r.unavailable, 1);
  assert.equal(studySummary([]).sd, null);
  assert.equal(studySummary([]).mean, null);
  assert.equal(studySummary([2]).sd, null);
  assert.equal(studySummary([2]).rmse, 0);
});
test("binary C is retained and hidden U never reaches the fitted data", () => {
  const a = instrumentAdjustment();
  const b = instrumentAdjustment({ hidden: 1 });
  assert.deepEqual(instrumentAdjustment(), a);
  a.data.forEach((d, i) => {
    assert.ok([-1, 1].includes(d.C));
    assert.equal(d.C, b.data[i].C);
    assert.equal(d.Z, b.data[i].Z);
    assert.deepEqual(Object.keys(d), ["C", "Z", "A", "Y"]);
  });
});
test("study comparisons stay centered near truth with greater SD after adding Z", () => {
  const values = Array.from({ length: 2 }, () =>
    Array.from({ length: 3 }, () => []),
  );
  for (let seed = 100; seed < 1100; seed++) {
    const { fits } = instrumentAdjustment({ seed });
    fits.forEach((f, j) => {
      assert.equal(f.clipped, 0);
      [3, 2, 4].forEach((index, k) => values[j][k].push(f.values[index]));
    });
  }
  const stats = values.map((arm) => arm.map((a) => studySummary(a)));
  for (let k = 0; k < 3; k++) {
    assert.ok(Math.abs(stats[0][k].mean - 2) < 0.006);
    assert.ok(Math.abs(stats[1][k].mean - 2) < 0.006);
    assert.ok(stats[1][k].sd > stats[0][k].sd * 1.04);
    assert.ok(stats[1][k].rmse > stats[0][k].rmse);
    assert.equal(stats[0][k].unavailable, 0);
    assert.equal(stats[1][k].unavailable, 0);
  }
});

test("hidden-confounding bias increases with Z while diagnostic adjustment for U recovers truth", () => {
  const means = [
    [0, 0, 0],
    [0, 0, 0],
  ];
  let diagnostic = 0;
  for (let seed = 100; seed < 180; seed++) {
    const { data, fits } = instrumentAdjustment({ seed, hidden: 1 });
    const noise = makeNoise(2400, seed);
    data.forEach((d, i) => {
      assert.ok(
        Math.abs(d.Y - 2 * d.A - 1.5 * d.C - 1.5 * noise[i].U - noise[i].eY) <
          1e-12,
      );
    });
    fits.forEach((fit, j) => {
      assert.equal(fit.clipped, 0);
      [3, 2, 4].forEach((index, k) => (means[j][k] += fit.values[index] / 80));
    });
    // U is supplied only to this diagnostic, never to the lesson's fits.
    diagnostic +=
      estimate(
        data.map((d, i) => ({ ...d, U: noise[i].U })),
        ["C", "Z", "U"],
      ).values[2] / 80;
  }
  for (let k = 0; k < 3; k++) {
    assert.ok(means[0][k] > 3);
    assert.ok(means[1][k] > means[0][k] + 0.1);
  }
  assert.ok(Math.abs(diagnostic - 2) < 0.03);
});
