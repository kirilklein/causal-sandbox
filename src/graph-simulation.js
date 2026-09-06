import { estimate, EstimationError, random } from "./simulation.js";

export const graphLimits = { nodes: 8, edges: 12, coefficient: 3 };

export function validateGraph(graph) {
  const fail = (error) => ({ error, order: [] });
  if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges))
    return fail("A graph needs variables and arrows.");
  const { nodes, edges } = graph;
  if (
    nodes.length < 2 ||
    nodes.length > graphLimits.nodes ||
    edges.length > graphLimits.edges
  )
    return fail("Use 2–8 variables and at most 12 arrows.");
  const ids = new Set(nodes.map((node) => node.id));
  if (ids.size !== nodes.length || !ids.has("A") || !ids.has("Y"))
    return fail(
      "Keep one treatment A and one outcome Y, with unique variable IDs.",
    );
  const labels = new Set();
  for (const node of nodes) {
    if (!/^(A|Y|v[1-9][0-9]*)$/.test(node.id))
      return fail("Invalid variable ID.");
    if (
      typeof node.label !== "string" ||
      !node.label.trim() ||
      node.label.length > 16 ||
      labels.has(node.label.trim().toLowerCase())
    )
      return fail("Use a unique variable name of 1–16 characters.");
    labels.add(node.label.trim().toLowerCase());
    if (
      typeof node.observed !== "boolean" ||
      (["A", "Y"].includes(node.id) &&
        (!node.observed || node.label !== node.id))
    )
      return fail(
        "Treatment A and outcome Y must stay measured and keep their names.",
      );
    if (
      !Number.isFinite(node.intercept) ||
      Math.abs(node.intercept) > 3 ||
      !Number.isFinite(node.noise) ||
      node.noise < 0.1 ||
      node.noise > 3 ||
      !["normal", "uniform"].includes(node.distribution)
    )
      return fail(
        "Use intercepts from −3 to 3 and noise scales from 0.1 to 3.",
      );
  }
  const pairs = new Set();
  for (const { from, to, weight } of edges) {
    if (!ids.has(from) || !ids.has(to))
      return fail("Both ends of an arrow must exist.");
    if (from === to) return fail("A variable cannot cause itself.");
    const pair = `${from}:${to}`;
    if (pairs.has(pair)) return fail("That arrow already exists.");
    pairs.add(pair);
    if (!Number.isFinite(weight) || Math.abs(weight) > graphLimits.coefficient)
      return fail("Arrow strengths must be between −3 and 3.");
  }
  const remaining = new Set(ids),
    order = [];
  while (remaining.size) {
    const ready = [...remaining]
      .filter((id) => !edges.some((e) => e.to === id && remaining.has(e.from)))
      .sort();
    if (!ready.length)
      return fail(
        "That arrow would create a cycle. Choose a different direction or remove a path first.",
      );
    for (const id of ready) {
      remaining.delete(id);
      order.push(id);
    }
  }
  return { error: null, order };
}

function nodeSeed(seed, id) {
  let hash = seed ^ 2166136261;
  for (const char of id) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash;
}

export function simulateGraph(graph, { n = 2400, seed = 4217 } = {}) {
  const { error, order } = validateGraph(graph);
  if (error) throw new Error(error);
  if (!Number.isInteger(n) || n < 1 || !Number.isInteger(seed))
    throw new Error("Invalid sample size or seed.");
  const draws = new Map(
    graph.nodes.map((node) => {
      const r = random(nodeSeed(seed, node.id));
      return [
        node.id,
        Array.from({ length: n }, () => {
          const u = r(),
            v = r();
          return {
            uniform: u,
            normal:
              Math.sqrt(-2 * Math.log(Math.max(u, 1e-12))) *
              Math.cos(2 * Math.PI * v),
          };
        }),
      ];
    }),
  );
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const parents = new Map(
    order.map((id) => [id, graph.edges.filter((e) => e.to === id)]),
  );
  function generate(i, intervention) {
    const row = {};
    for (const id of order) {
      if (id === "A" && intervention !== undefined) {
        row.A = intervention;
        continue;
      }
      const node = nodes.get(id),
        noise = draws.get(id)[i];
      const mean = parents
        .get(id)
        .reduce((sum, e) => sum + e.weight * row[e.from], node.intercept);
      row[id] =
        id === "A"
          ? +(noise.uniform < 1 / (1 + Math.exp(-mean)))
          : mean +
            node.noise *
              (node.distribution === "uniform"
                ? Math.sqrt(3) * (2 * noise.uniform - 1)
                : noise.normal);
    }
    return row;
  }
  const data = [],
    effects = [];
  for (let i = 0; i < n; i++) {
    data.push(generate(i));
    effects.push(generate(i, 1).Y - generate(i, 0).Y);
  }
  return { data, truth: effects.reduce((a, b) => a + b, 0) / n };
}

export function graphDescendants(graph, start, activeOnly = true) {
  const found = new Set(),
    pending = [start];
  while (pending.length) {
    const id = pending.pop();
    for (const edge of graph.edges) {
      if (
        edge.from !== id ||
        (activeOnly && edge.weight === 0) ||
        found.has(edge.to)
      )
        continue;
      found.add(edge.to);
      pending.push(edge.to);
    }
  }
  return found;
}

export function analyzeGraph(graph, data, adjustment) {
  const available = new Set(
    graph.nodes
      .filter((node) => node.observed && !["A", "Y"].includes(node.id))
      .map((node) => node.id),
  );
  if (
    new Set(adjustment).size !== adjustment.length ||
    adjustment.some((id) => !available.has(id))
  )
    throw new Error("Only measured covariates can enter adjustment.");
  // Copy only measured columns. Standardization improves conditioning along long paths.
  const moments = adjustment.map((id) => {
    const mean = data.reduce((s, row) => s + row[id], 0) / data.length;
    const sd = Math.sqrt(
      data.reduce((s, row) => s + (row[id] - mean) ** 2, 0) / data.length,
    );
    return { id, mean, sd: sd || 1 };
  });
  const observed = data.map((row) =>
    Object.fromEntries([
      ["A", row.A],
      ["Y", row.Y],
      ...moments.map(({ id, mean, sd }) => [id, (row[id] - mean) / sd]),
    ]),
  );
  try {
    const result = estimate(observed, adjustment, { strict: true });
    if (result.values.some((v) => !Number.isFinite(v)))
      throw new EstimationError(
        "The fit produced a nonfinite result. Reduce strengths or simplify the adjustment set.",
      );
    return { ...result, error: null };
  } catch (error) {
    if (!(error instanceof EstimationError)) throw error;
    const treated = data.filter((row) => row.A === 1),
      untreated = data.filter((row) => row.A === 0);
    const mean = (rows) => rows.reduce((s, row) => s + row.Y, 0) / rows.length;
    const raw = mean(treated) - mean(untreated);
    return { values: [raw, raw, NaN, NaN, NaN], error: error.message };
  }
}
