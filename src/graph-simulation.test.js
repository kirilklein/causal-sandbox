import test from "node:test";
import assert from "node:assert/strict";
import { graphNode, graphPreset } from "./graph-presets.js";
import {
  simulateGraph,
  validateGraph,
  analyzeGraph,
  graphDescendants,
} from "./graph-simulation.js";
import { estimate, EstimationError } from "./simulation.js";

const mean = (xs) => xs.reduce((sum, x) => sum + x, 0) / xs.length;
const close = (a, b, tolerance = 1e-9) =>
  assert.ok(Math.abs(a - b) < tolerance, `${a} differs from ${b}`);
function cov(data, x, y) {
  const mx = mean(data.map((d) => d[x])),
    my = mean(data.map((d) => d[y]));
  return mean(data.map((d) => (d[x] - mx) * (d[y] - my)));
}

test("validate graph limits, IDs, coefficients, endpoints and cycles", () => {
  const base = graphPreset("pkr").graph;
  assert.equal(validateGraph(base).error, null);
  for (const edit of [
    (g) => g.edges.push({ from: "Y", to: "A", weight: 0 }),
    (g) => g.edges.push({ from: "A", to: "A", weight: 1 }),
    (g) => g.edges.push({ ...g.edges[0] }),
    (g) => {
      g.edges[0].from = "missing";
    },
    (g) => {
      g.edges[0].weight = NaN;
    },
    (g) => {
      g.edges[0].weight = 4;
    },
    (g) => {
      g.nodes[0].observed = false;
    },
    (g) => {
      g.nodes[1].id = "A";
    },
    (g) => {
      g.nodes[2].id = "__proto__";
    },
    (g) => {
      g.nodes[2].noise = 0;
    },
    (g) => {
      g.nodes[2].label = " A ";
    },
    (g) =>
      g.nodes.push(
        ...Array.from({ length: 4 }, (_, i) => graphNode(`v${i + 4}`)),
      ),
    (g) => g.edges.push(...Array(9).fill({ from: "A", to: "Y", weight: 1 })),
  ]) {
    const graph = structuredClone(base);
    edit(graph);
    assert.ok(validateGraph(graph).error);
  }
});

test("intervention truth includes every directed path and permits outcome descendants", () => {
  const graph = graphPreset("mediator").graph;
  graph.nodes.push(graphNode("v2", "N"), graphNode("v3", "K"));
  graph.edges.push(
    { from: "A", to: "v2", weight: -0.5 },
    { from: "v2", to: "v1", weight: 2 },
    { from: "Y", to: "v3", weight: 3 },
    { from: "A", to: "v3", weight: 1 },
  );
  const sample = simulateGraph(graph, { n: 100 });
  close(sample.truth, 1 + 1 * 1 + -0.5 * 2 * 1);
  close(simulateGraph(graphPreset("blank").graph).truth, 0);
  close(simulateGraph(graphPreset("hidden").graph).truth, 2);
  assert.ok(graphDescendants(graph, "A").has("v3"));
  graph.edges.find((e) => e.to === "v2").weight = 0;
  assert.equal(graphDescendants(graph, "A").has("v2"), false);
});

test("node ID noise is stable under additions, renaming, reordering, and measured status", () => {
  const graph = graphPreset("pkr").graph;
  const baseline = simulateGraph(graph, { n: 100 });
  const changed = structuredClone(graph);
  changed.nodes.reverse();
  changed.nodes.find((n) => n.id === "v1").label = "Renamed";
  changed.nodes.find((n) => n.id === "v1").observed = false;
  changed.nodes.push(graphNode("v4", "Extra"));
  const next = simulateGraph(changed, { n: 100 });
  for (let i = 0; i < 100; i++)
    for (const node of graph.nodes)
      assert.equal(next.data[i][node.id], baseline.data[i][node.id]);
  changed.nodes.pop();
  assert.deepEqual(simulateGraph(changed, { n: 100 }).data, baseline.data);
  assert.notDeepEqual(
    simulateGraph(graph, { n: 100, seed: 4218 }).data,
    baseline.data,
  );
});

test("P–K–R equations and regression match independent centered covariance calculations", () => {
  const graph = graphPreset("pkr").graph;
  const { data, truth } = simulateGraph(graph);
  close(truth, 2);
  const aa = cov(data, "A", "A"),
    kk = cov(data, "v3", "v3"),
    ay = cov(data, "A", "Y"),
    ak = cov(data, "A", "v3"),
    ky = cov(data, "v3", "Y");
  close(analyzeGraph(graph, data, []).values[2], ay / aa, 1e-7);
  close(
    analyzeGraph(graph, data, ["v3"]).values[2],
    (ay * kk - ak * ky) / (aa * kk - ak * ak),
    1e-7,
  );
  const saved = structuredClone(data);
  analyzeGraph(graph, data, ["v1", "v2"]);
  assert.deepEqual(data, saved);
});

test("P–K–R repeated studies recover the population collider contrast", () => {
  const graph = graphPreset("pkr").graph;
  let q = 0;
  for (let i = 0; i < 10000; i++) {
    const p = -Math.sqrt(3) + (2 * Math.sqrt(3) * (i + 0.5)) / 10000;
    q += p / (1 + Math.exp(-1.5 * p)) / 10000;
  }
  const expected = 2 - (1.5 * q) / (0.25 * 2.25 - q * q);
  const studies = Array.from({ length: 40 }, (_, i) => {
    const { data } = simulateGraph(graph, { seed: 100 + i });
    return [
      analyzeGraph(graph, data, []).values[2],
      analyzeGraph(graph, data, ["v3"]).values[2],
    ];
  });
  close(mean(studies.map((s) => s[0])), 2, 0.04);
  close(mean(studies.map((s) => s[1])), expected, 0.04);
});

test("measured confounding adjustment and mediation preserve their distinct targets", () => {
  const results = { observed: [], mediator: [], hidden: [] };
  for (const id of Object.keys(results)) {
    const graph = graphPreset(id).graph;
    for (let seed = 200; seed < 220; seed++) {
      const { data, truth } = simulateGraph(graph, { seed });
      const fit = analyzeGraph(graph, data, id === "hidden" ? [] : ["v1"]);
      assert.equal(fit.error, null);
      close(truth, 2);
      results[id].push(fit.values);
    }
  }
  for (const i of [2, 3, 4])
    close(mean(results.observed.map((s) => s[i])), 2, 0.08);
  close(mean(results.mediator.map((s) => s[2])), 1, 0.05);
  assert.ok(mean(results.hidden.map((s) => s[2])) > 2.5);
  const graph = graphPreset("hidden").graph,
    { data } = simulateGraph(graph);
  assert.throws(() => analyzeGraph(graph, data, ["v1"]), /measured/);
  assert.throws(() => analyzeGraph(graph, data, ["A"]), /measured/);
});

test("fit failures are explicit for empty arms, redundant variables and separation", () => {
  const graph = graphPreset("observed").graph;
  const { data } = simulateGraph(graph, { n: 100 });
  const oneArm = data.map((row) => ({ ...row, A: 1 }));
  assert.match(analyzeGraph(graph, oneArm, []).error, /Both treatment/);
  graph.nodes.push(graphNode("v2"));
  const duplicated = data.map((row) => ({ ...row, v2: row.v1 }));
  assert.match(analyzeGraph(graph, duplicated, ["v1", "v2"]).error, /Singular/);
  const separated = data.map((row, i) => ({
    ...row,
    v1: i < 50 ? -1 : 1,
    A: +(i >= 50),
  }));
  assert.match(analyzeGraph(graph, separated, ["v1"]).error, /converge/);
  assert.throws(() => estimate(oneArm, [], { strict: true }), EstimationError);
});
