import test from "node:test";
import assert from "node:assert/strict";
import {
  studyRange,
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
