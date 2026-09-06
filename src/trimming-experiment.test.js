import test from "node:test";
import assert from "node:assert/strict";
import { trimmingSample, trimmingResult } from "./trimming-experiment.js";
import { clippingResult } from "./clipping-experiment.js";

const rows = [0.05, 0.1, 0.2, 0.4, 0.6, 0.8, 0.9, 0.95].map((p, i) =>
  Object.freeze({ p, A: i % 2, Y: [0, 4, 2, 8, 4, 10, 6, 12][i] }),
);
const effects = [1, 1, 2, 2, 4, 4, 8, 8];
const close = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);

test("inclusive trimming partitions people and uses subgroup arm denominators", () => {
  const result = trimmingResult(rows, effects, 0.2);
  assert.deepEqual(result.retained, [2, 3, 4, 5]);
  assert.deepEqual(result.excluded, [0, 1, 6, 7]);
  close(result.groups.retained.ipw, 16 / 3);
  close(result.groups.excluded.ipw, -2 / 3);
  assert.equal(result.groups.retained.truth, 3);
  assert.equal(result.groups.excluded.truth, 4.5);
  const { everyone, retained, excluded } = result.groups;
  close(
    everyone.n * everyone.truth,
    retained.n * retained.truth + excluded.n * excluded.truth,
  );
  assert.deepEqual(retained.counts, [2, 2]);
});

test("histogram splits a bin at the exact threshold and accounts for endpoints", () => {
  const data = [0, 0.099, 0.1, 0.101, 0.149, 0.15, 0.85, 0.851, 0.9, 1].map(
    (p, i) => ({ p, A: i % 2, Y: i }),
  );
  const result = trimmingResult(
    data,
    data.map(() => 2),
    0.15,
  );
  assert.deepEqual(result.retained, [5, 6]);
  assert.equal(result.histogram[1].retained[1], 1);
  assert.equal(result.histogram[1].excluded[1], 1);
  assert.equal(result.histogram[0].retained[8], 1);
  assert.equal(result.histogram[1].excluded[8], 1);
  assert.equal(result.histogram[1].excluded[9], 1);
  assert.equal(result.groups.retained.available, true);
  assert.equal(result.groups.everyone.available, false);
  assert.equal(result.groups.excluded.available, false);
  for (const arm of result.histogram)
    assert.equal(
      [...arm.retained, ...arm.excluded].reduce((a, b) => a + b, 0),
      arm.count,
    );
});

test("zero trimming, empty groups and single arms preserve meaningful truth", () => {
  const zero = trimmingResult(rows, effects);
  assert.deepEqual(zero.groups.retained, zero.groups.everyone);
  assert.equal(zero.groups.excluded.n, 0);
  assert.equal(zero.groups.excluded.truth, null);
  assert.equal(zero.groups.excluded.ipw, null);
  const empty = trimmingResult([], [], 0.5);
  assert.equal(empty.groups.everyone.truth, null);
  assert.equal(empty.groups.retained.available, false);
  const single = trimmingResult([{ A: 1, Y: 3, p: 0.5 }], [2], 0.5);
  assert.equal(single.groups.retained.n, 1);
  assert.equal(single.groups.retained.truth, 2);
  assert.equal(single.groups.retained.available, false);
  assert.match(single.groups.retained.reason, /Both treatment arms/);
  assert.equal(trimmingResult(rows, effects, 0.5).groups.retained.n, 0);
});

test("invalid partition inputs fail explicitly; unavailable estimates keep counts and truth", () => {
  for (const threshold of [-1, 0.501, NaN, Infinity])
    assert.throws(() => trimmingResult(rows, effects, threshold), RangeError);
  for (const p of [-0.1, 1.1, NaN, Infinity])
    assert.throws(() => trimmingResult([{ A: 0, p, Y: 1 }], [2]), RangeError);
  assert.throws(
    () => trimmingResult([{ A: 2, p: 0.5, Y: 1 }], [2]),
    RangeError,
  );
  assert.throws(() => trimmingResult(rows, [2]), RangeError);
  assert.throws(
    () =>
      trimmingResult(
        rows,
        effects.map(() => NaN),
      ),
    RangeError,
  );
  for (const patch of [
    { Y: NaN },
    { Y: Number.MAX_VALUE },
    { p: 0 },
    { p: 1 },
    { p: Number.MIN_VALUE, A: 1 },
  ]) {
    const result = trimmingResult(
      rows.map((row, i) => (i ? row : { ...row, ...patch })),
      effects,
    );
    assert.equal(result.groups.everyone.available, false);
    assert.equal(result.groups.everyone.ipw, null);
    assert.equal(result.groups.everyone.n, 8);
    assert.equal(result.groups.everyone.truth, 3.75);
  }
});

test("threshold changes are reversible, truth does not enter estimation, treatment reversal negates IPW", () => {
  const initial = trimmingResult(rows, effects);
  trimmingResult(rows, effects, 0.3);
  assert.deepEqual(trimmingResult(rows, effects), initial);
  assert.equal(
    trimmingResult(
      rows,
      effects.map(() => 999),
    ).groups.everyone.ipw,
    initial.groups.everyone.ipw,
  );
  const reversed = rows.map(({ A, p, Y }) => ({ A: 1 - A, p: 1 - p, Y }));
  close(
    trimmingResult(reversed, effects).groups.everyone.ipw,
    -initial.groups.everyone.ipw,
  );
});

test("paired simulation truth agrees with the constant-effect world and zero trimming with unclipped IPW", () => {
  for (const selection of [0, 3, 5]) {
    const sample = trimmingSample({ selection });
    sample.effects.forEach((effect) => close(effect, 2));
    const result = trimmingResult(sample.rows, sample.effects);
    close(result.groups.everyone.ipw, clippingResult(sample.rows, 0).ipw);
    assert.deepEqual(sample, trimmingSample({ selection }));
    for (const threshold of [0.01, 0.1, 0.2, 0.5]) {
      const trimmed = trimmingResult(sample.rows, sample.effects, threshold);
      for (const group of Object.values(trimmed.groups))
        if (group.n) close(group.truth, 2);
      assert.deepEqual(trimmed.groups.everyone, result.groups.everyone);
    }
  }
});
