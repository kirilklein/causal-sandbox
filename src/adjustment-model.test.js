import test from "node:test";
import assert from "node:assert/strict";
import { adjustmentScenarios, graphWarmup } from "./adjustment-scenarios.js";
import {
  adjustmentChoice,
  gradeAdjustment,
  validAdjustmentChoice,
  validAdjustmentSets,
  experimentUrl,
} from "./adjustment-model.js";
import { graphPreset } from "./graph-presets.js";
import {
  simulateGraph,
  analyzeGraph,
  validateGraph,
} from "./graph-simulation.js";

const expected = {
  adjustment: (s) => (s.has("C") || s.has("L")) && !s.has("M"),
  "two-paths": (s) => s.has("C") && s.has("L"),
  "preserve-mediation": (s) => s.has("L") && !s.has("M"),
  "collider-trap": (s) =>
    s.has("C") && (!s.has("K") || s.has("P") || s.has("R")),
  "no-valid-set": () => false,
  "entry-adjustment": (s) => s.has("C") && !s.has("M"),
  "entry-challenge": (s) =>
    (s.has("C") || s.has("L")) && (!s.has("K") || s.has("P") || s.has("R")),
};
test("every measured subset agrees with independently authored adjustment rules", () => {
  for (const q of adjustmentScenarios) {
    const ids = q.graph.nodes
      .map(([id]) => id)
      .filter((id) => !["A", "Y", ...q.unmeasured].includes(id));
    for (let mask = 0; mask < 2 ** ids.length; mask++) {
      const selected = ids.filter((_, i) => mask & (1 << i));
      assert.equal(
        gradeAdjustment(q, adjustmentChoice(selected)).correct,
        expected[q.id](new Set(selected)),
        `${q.id}: ${selected}`,
      );
    }
    assert.equal(
      gradeAdjustment(q, "impossible").correct,
      q.id === "no-valid-set",
    );
    assert.equal(gradeAdjustment(q, "unsure").correct, false);
    for (const invalid of [
      null,
      {},
      "set:",
      "set:A",
      "set:Y",
      "set:U",
      "set:C,C",
      "set:<script>",
      "set:L,C",
    ])
      assert.equal(validAdjustmentChoice(q, invalid), false);
  }
});
test("no adjustment and no valid set are different, and feedback traces the actual path", () => {
  const randomized = structuredClone(graphWarmup);
  randomized.graph.edges = [
    ["C", "Y"],
    ["A", "Y"],
  ];
  assert.equal(gradeAdjustment(randomized, "none").correct, true);
  assert.equal(gradeAdjustment(randomized, "impossible").correct, false);
  const collider = adjustmentScenarios.find((q) => q.id === "collider-trap");
  assert.deepEqual(gradeAdjustment(collider, "set:C,K").path, [
    "A",
    "P",
    "K",
    "R",
    "Y",
  ]);
  assert.equal(gradeAdjustment(collider, "set:C,K,P").correct, true);
  assert.deepEqual(gradeAdjustment(adjustmentScenarios[0], "set:C,M").path, [
    "A",
    "M",
    "Y",
  ]);
});
test("building-box templates preserve every quiz edge, variable, measured status and URL selection", () => {
  for (const q of adjustmentScenarios) {
    const preset = graphPreset(q.id);
    assert.equal(validateGraph(preset.graph).error, null);
    const name = (id) => preset.graph.nodes.find((n) => n.id === id).label;
    assert.deepEqual(
      preset.graph.edges.map((e) => [name(e.from), name(e.to)]),
      q.graph.edges,
    );
    assert.deepEqual(
      preset.graph.nodes.filter((n) => !n.observed).map((n) => n.label),
      q.unmeasured,
    );
    const url = new URL(experimentUrl(q, "set:C"), "https://example.org/");
    assert.equal(url.searchParams.get("preset"), q.id);
    assert.equal(url.searchParams.get("adjust"), "C");
  }
});
test("valid adjustment recovers the total effect across samples; authored traps retain bias", () => {
  for (const q of adjustmentScenarios) {
    const graph = graphPreset(q.id).graph;
    const ids = (labels) =>
      graph.nodes.filter((n) => labels.includes(n.label)).map((n) => n.id);
    const valid = validAdjustmentSets(q);
    const means = new Map(valid.map((set) => [set.join(","), 0]));
    const traps = {
      adjustment: ["C", "M"],
      "two-paths": ["C"],
      "preserve-mediation": ["L", "M"],
      "collider-trap": ["C", "K"],
      "no-valid-set": ["C", "Z"],
      "entry-adjustment": ["C", "M"],
      "entry-challenge": ["C", "K"],
    };
    let rawBias = 0,
      trapBias = 0;
    for (let seed = 0; seed < 20; seed++) {
      const sample = simulateGraph(graph, { seed: 7000 + seed, n: 2400 });
      rawBias += analyzeGraph(graph, sample.data, []).values[2] - sample.truth;
      const trap = analyzeGraph(graph, sample.data, ids(traps[q.id]));
      assert.equal(trap.error, null);
      trapBias += trap.values[2] - sample.truth;
      for (const set of valid) {
        const result = analyzeGraph(graph, sample.data, ids(set));
        assert.equal(result.error, null);
        means.set(
          set.join(","),
          means.get(set.join(",")) + result.values[2] - sample.truth,
        );
      }
    }
    assert.ok(
      Math.abs(rawBias / 20) > 0.3,
      `${q.id}: raw bias should be visible`,
    );
    assert.ok(
      Math.abs(trapBias / 20) > 0.15,
      `${q.id}: selected trap bias ${trapBias / 20}`,
    );
    for (const [set, bias] of means)
      assert.ok(
        Math.abs(bias / 20) < 0.09,
        `${q.id}: ${set} mean regression bias ${bias / 20}`,
      );
  }
});
