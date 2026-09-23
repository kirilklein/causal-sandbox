import test from "node:test";
import assert from "node:assert/strict";
import {
  studyRange,
  studyDotOffsets,
  studyPlotDomain,
  studyDistributions,
} from "./instrument-study-view.js";
import { studySummary } from "./instrument-simulation.js";

test("study ranges interpolate empirical percentiles and exclude unavailable fits", () => {
  assert.deepEqual(
    studyRange(Array.from({ length: 101 }, (_, i) => i)),
    [5, 95],
  );
  assert.deepEqual(studyRange([10, 0, NaN, Infinity]), [0.5, 9.5]);
  assert.deepEqual(studyRange([2]), [2, 2]);
  assert.equal(studyRange([NaN, Infinity]), null);
});

test("shared effect axis stays fixed near truth and expands to retain outliers", () => {
  assert.deepEqual(studyPlotDomain([[[1.9, 2]], [[2.1]]]), [1.75, 2.25]);
  assert.deepEqual(studyPlotDomain([[[1.2, NaN]], [[2.3]]]), [1, 3]);
  assert.deepEqual(studyPlotDomain([[[6.3]], [[]]]), [-2.5, 6.5]);
  assert.deepEqual(studyPlotDomain([[[NaN]], [[]]]), [1.75, 2.25]);
});

test("unavailable fits produce neither fabricated dots nor ranges", () => {
  const values = [[[NaN, 2, Infinity]], [[NaN, NaN, NaN]]];
  const stats = values.map((arm) => arm.map((v) => studySummary(v)));
  const html = studyDistributions(values, stats, ["IPW"], 100);
  assert.equal((html.match(/class="study-dot"/g) || []).length, 1);
  assert.match(html, /Study 101: 2.000/);
  assert.equal((html.match(/class="study-range"/g) || []).length, 1);
  assert.match(html, /0 study estimates; middle 90% unavailable/);
  assert.doesNotMatch(html, /NaN|Infinity/);
});

test("dot packing is deterministic, preserves study indices, and stacks concentrations", () => {
  const values = [2, 2, NaN, 2.2, 2.001, 1.8];
  const offsets = studyDotOffsets(values, [1.75, 2.25]);
  assert.deepEqual(studyDotOffsets(values, [1.75, 2.25]), offsets);
  assert.equal(offsets[0], 0);
  assert.equal(offsets[2], null);
  assert.equal(offsets[3], 0);
  assert.equal(offsets[5], 0);
  assert.equal(Math.abs(offsets[1]), 5.5);
  for (let i = 0; i < values.length; i++)
    for (let j = i + 1; j < values.length; j++) {
      if (!Number.isFinite(values[i]) || !Number.isFinite(values[j])) continue;
      const dx = (552 * (values[i] - values[j])) / 0.5;
      assert.ok(dx ** 2 + (offsets[i] - offsets[j]) ** 2 >= 5.5 ** 2 - 1e-8);
    }
});

test("spread summaries follow measured SD and do not assert an increase for every batch", () => {
  const values = [[[1, 2, 3]], [[1, 2, 3]]];
  const render = (before, after) =>
    studyDistributions(
      values,
      [[{ count: 3, sd: before }], [{ count: 3, sd: after }]],
      ["IPW"],
      100,
    );
  assert.match(render(1, 1.6), /60% more spread with Z/);
  assert.match(render(1, 0.8), /20% less spread with Z/);
  assert.match(render(1, 1.001), /Nearly the same spread/);
  assert.match(render(0, 1), /Spread comparison unavailable/);
});
