import test from "node:test";
import assert from "node:assert/strict";
import {
  differenceInference,
  bootstrapDifference,
  uncertaintyRows,
  normalInference,
  normalCritical,
  twoSidedP,
  uncertaintyStudy,
  coverageSummary,
} from "./uncertainty.js";
import { fmtBound, intervalPlot } from "./uncertainty-view.js";

const close = (actual, expected, tolerance = 1e-10) =>
  assert.ok(
    Math.abs(actual - expected) < tolerance,
    `${actual} != ${expected}`,
  );

test("mean difference and unequal-variance SE agree with a hand calculation", () => {
  const rows = [1, 2, 3]
    .map((Y) => ({ A: 0, Y }))
    .concat([3, 5, 7].map((Y) => ({ A: 1, Y })));
  const result = differenceInference(rows);
  close(result.estimate, 3);
  close(result.se, Math.sqrt(5 / 3));
  close(result.lower, 3 - normalCritical * Math.sqrt(5 / 3));
  close(result.upper, 3 + normalCritical * Math.sqrt(5 / 3));
  const reverse = differenceInference(rows.map((d) => ({ ...d, A: 1 - d.A })));
  close(reverse.estimate, -3);
  close(reverse.p, result.p);
  close(reverse.lower, -result.upper);
});

test("normal tail agrees with reference probabilities, including small tails", () => {
  for (const [z, expected] of [
    [0, 1],
    [1, 0.31731050786291415],
    [normalCritical, 0.05],
    [3, 0.0026997960632601866],
    [8, 1.244192114854348e-15],
  ]) {
    assert.ok(Math.abs(twoSidedP(z) / expected - 1) < 2e-7);
    close(twoSidedP(z), twoSidedP(-z));
  }
  assert.ok(twoSidedP(8) > 0);
  assert.throws(() => twoSidedP(NaN), TypeError);
});

test("matching intervals and tests agree across signs, scales, and the cutoff", () => {
  for (const se of [0.01, 0.25, 10])
    for (const z of [-5, -2, -1.959, 0, 1.959, 2, 5]) {
      const result = normalInference(z * se, se);
      assert.equal(result.lower > 0 || result.upper < 0, result.p < 0.05);
    }
  const boundary = normalInference(normalCritical, 1);
  close(boundary.lower, 0);
  close(boundary.p, 0.05, 1e-7);
});

test("invalid data fail explicitly and degenerate arms report unavailable", () => {
  assert.equal(differenceInference([]).status, "unavailable");
  assert.equal(
    differenceInference([
      { A: 1, Y: 1 },
      { A: 1, Y: 2 },
    ]).status,
    "unavailable",
  );
  assert.equal(
    differenceInference([0, 0, 1, 1].map((A) => ({ A, Y: 2 }))).status,
    "unavailable",
  );
  assert.throws(() => differenceInference([{ A: 2, Y: 3 }]), TypeError);
  assert.throws(() => differenceInference([{ A: 1, Y: NaN }]), TypeError);
  assert.throws(() => normalInference(2, 0), RangeError);
  assert.throws(() => uncertaintyStudy({ n: 1 }), RangeError);
});

test("changing a constant causal effect shifts estimates and intervals, not their SE", () => {
  const a = uncertaintyStudy({ effect: 0 });
  const b = uncertaintyStudy({ effect: 2 });
  close(b.estimate - a.estimate, 2);
  close(b.lower - a.lower, 2);
  close(b.se, a.se);
  assert.deepEqual(b, uncertaintyStudy({ effect: 2 }));
  assert.notEqual(
    b.estimate,
    uncertaintyStudy({ effect: 2, seed: 4218 }).estimate,
  );
});

test("normal intervals have approximate coverage and null p-values are calibrated", () => {
  for (const n of [200, 800]) {
    const studies = Array.from({ length: 2500 }, (_, i) =>
      uncertaintyStudy({ n, seed: 40000 + i, effect: 0 }),
    );
    const summary = coverageSummary(studies);
    assert.equal(summary.unavailable, 0);
    assert.ok(
      summary.covered / summary.valid > 0.93 &&
        summary.covered / summary.valid < 0.97,
    );
    for (const threshold of [0.01, 0.05, 0.1, 0.5]) {
      const rate =
        studies.filter((s) => s.p < threshold).length / studies.length;
      assert.ok(
        Math.abs(rate - threshold) < 0.025,
        `n=${n}, threshold=${threshold}, rate=${rate}`,
      );
    }
    const mean =
      studies.reduce((sum, s) => sum + s.estimate, 0) / studies.length;
    const sd = Math.sqrt(
      studies.reduce((sum, s) => sum + (s.estimate - mean) ** 2, 0) /
        (studies.length - 1),
    );
    const meanSE = studies.reduce((sum, s) => sum + s.se, 0) / studies.length;
    assert.ok(Math.abs(mean) < 0.02);
    assert.ok(Math.abs(meanSE / sd - 1) < 0.06);
  }
});

test("larger studies narrow intervals without removing confounding bias", () => {
  const summaries = [];
  for (const n of [200, 3200]) {
    const studies = Array.from({ length: 300 }, (_, i) =>
      uncertaintyStudy({ n, seed: 50000 + i, selection: 1.2 }),
    );
    summaries.push({
      bias:
        studies.reduce((sum, s) => sum + s.estimate - s.truth, 0) /
        studies.length,
      width:
        studies.reduce((sum, s) => sum + s.upper - s.lower, 0) / studies.length,
      coverage: coverageSummary(studies).covered / studies.length,
    });
  }
  assert.ok(summaries[0].bias > 1 && summaries[1].bias > 1);
  assert.ok(Math.abs(summaries[0].bias - summaries[1].bias) < 0.1);
  assert.ok(summaries[1].width < summaries[0].width * 0.3);
  assert.ok(summaries[1].coverage < 0.01);
});

test("the first interval plot does not reveal simulator truth", () => {
  const study = uncertaintyStudy();
  const hidden = intervalPlot([study]);
  assert.doesNotMatch(
    hidden,
    /inference-truth|covers truth|misses truth|Truth:/,
  );
  assert.match(hidden, /data-covered="unknown"/);
  assert.match(intervalPlot([study], { truth: true }), /Truth: 2.00/);
});

test("a nonzero confidence bound remains visibly nonzero near the test cutoff", () => {
  assert.equal(fmtBound(0), "0.00");
  assert.equal(Number(fmtBound(0.0037)), 0.0037);
  assert.equal(Number(fmtBound(-0.0002)), -0.0002);
});

test("bootstrap preserves observed people, treatment counts, and the first resampled estimate", () => {
  const rows = uncertaintyRows();
  const original = structuredClone(rows);
  const b = bootstrapDifference(rows);
  assert.deepEqual(rows, original);
  assert.deepEqual(b, bootstrapDifference(rows));
  assert.notDeepEqual(
    b.estimates,
    bootstrapDifference(rows, { seed: 7301 }).estimates,
  );
  for (const A of [0, 1]) {
    const indices = rows.flatMap((row, i) => (row.A === A ? [i] : []));
    assert.equal(
      indices.reduce((sum, i) => sum + b.firstCounts[i], 0),
      indices.length,
    );
  }
  assert.ok(b.firstCounts.includes(0));
  assert.ok(b.firstCounts.some((count) => count > 1));
  const firstRows = rows.flatMap((row, i) => Array(b.firstCounts[i]).fill(row));
  close(b.estimates[0], differenceInference(firstRows).estimate);
  const shifted = bootstrapDifference(
    rows.map((row) => ({ A: row.A, Y: row.Y + 4 * row.A })),
  );
  close(shifted.mean - b.mean, 4);
  close(shifted.se, b.se);
  close(shifted.lower - b.lower, 4);
  close(shifted.upper - b.upper, 4);
});

test("bootstrap spread agrees with the exact conditional variance of resampled means", () => {
  const rows = [1, 2, 3]
    .map((Y) => ({ A: 0, Y }))
    .concat([3, 5, 7].map((Y) => ({ A: 1, Y })));
  const b = bootstrapDifference(rows, { repetitions: 40000 });
  // Empirical arm variances are 2/3 and 8/3; each resampled mean averages three draws.
  close(b.mean, 3, 0.02);
  close(b.se, Math.sqrt(10 / 9), 0.015);
  assert.equal(bootstrapDifference([]).status, "unavailable");
  assert.throws(
    () => bootstrapDifference(rows, { repetitions: 1 }),
    RangeError,
  );
  assert.throws(() => bootstrapDifference([{ A: 2, Y: 1 }]), TypeError);
});

test("bootstrap percentile intervals have approximate coverage here but do not remove confounding", () => {
  for (const selection of [0, 1.2]) {
    let covered = 0,
      mean = 0,
      difference = 0;
    for (let i = 0; i < 400; i++) {
      const b = bootstrapDifference(
        uncertaintyRows({ seed: 60000 + i, selection }),
        { repetitions: 500, seed: 80000 + i },
      );
      covered += b.lower <= 2 && 2 <= b.upper;
      mean += b.mean / 400;
      difference += (b.mean - b.observed.estimate) / 400;
    }
    assert.ok(Math.abs(difference) < 0.01);
    if (selection === 0) {
      assert.ok(
        covered / 400 > 0.9 && covered / 400 < 0.98,
        `coverage: ${covered / 400}`,
      );
      assert.ok(Math.abs(mean - 2) < 0.05);
    } else {
      assert.ok(mean - 2 > 1);
      assert.ok(covered / 400 < 0.05);
    }
  }
});
