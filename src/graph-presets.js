import { adjustmentScenarios } from "./adjustment-scenarios.js";
export function graphNode(id, label = id, options = {}) {
  return {
    id,
    label,
    observed: true,
    noise: 1,
    distribution: "normal",
    intercept: 0,
    ...options,
  };
}

const edge = (from, to, weight) => ({ from, to, weight });
const endpoints = () => [graphNode("A"), graphNode("Y")];

export const graphPresets = [
  ...adjustmentScenarios.map((scenario) => {
    const ids = Object.fromEntries(
      scenario.graph.nodes.map(([id], i) => [
        id,
        ["A", "Y"].includes(id) ? id : `v${i + 1}`,
      ]),
    );
    return {
      id: scenario.id,
      name: `Quiz: ${scenario.title}`,
      question: scenario.context,
      action: scenario.action,
      definitions: scenario.facts,
      positions: Object.fromEntries(
        scenario.graph.nodes.map(([id, x, y]) => [
          ids[id],
          { x: (x - 40) / 420, y: (y - 35) / 220 },
        ]),
      ),
      graph: {
        nodes: scenario.graph.nodes.map(([id]) =>
          graphNode(ids[id], id, {
            observed: !scenario.unmeasured.includes(id),
          }),
        ),
        edges: scenario.graph.edges.map(([a, b], i) =>
          edge(ids[a], ids[b], scenario.weights[i]),
        ),
      },
    };
  }),
  {
    id: "pkr",
    name: "P–K–R: a pretreatment collider",
    question: "Does adjusting for a pretreatment score help?",
    action: "Try adjusting for K. Then remove P → K and compare again.",
    graph: {
      nodes: [
        ...endpoints(),
        graphNode("v1", "P", { distribution: "uniform" }),
        graphNode("v2", "R", { distribution: "uniform" }),
        graphNode("v3", "K", { noise: 0.5 }),
      ],
      edges: [
        edge("v1", "A", 1.5),
        edge("v1", "v3", 1),
        edge("v2", "v3", 1),
        edge("v2", "Y", 1.5),
        edge("A", "Y", 2),
      ],
    },
  },
  {
    id: "observed",
    name: "Observed confounding",
    question: "Can adjustment recover the effect?",
    action: "Adjust for C, then change C → A or C → Y.",
    graph: {
      nodes: [
        graphNode("A", "A", { intercept: -0.8 }),
        graphNode("Y"),
        graphNode("v1", "C", { distribution: "uniform" }),
      ],
      edges: [edge("v1", "A", 1.2), edge("v1", "Y", 1.5), edge("A", "Y", 2)],
    },
  },
  {
    id: "hidden",
    name: "Hidden confounding",
    question: "What can adjustment do when a common cause is unmeasured?",
    action: "Make U measured, then include it in the analysis.",
    graph: {
      nodes: [
        graphNode("A", "A", { intercept: -0.8 }),
        graphNode("Y"),
        graphNode("v1", "U", { observed: false }),
      ],
      edges: [edge("v1", "A", 1.2), edge("v1", "Y", 1.5), edge("A", "Y", 2)],
    },
  },
  {
    id: "mediator",
    name: "A direct and a mediated path",
    question: "What happens when we adjust for part of the effect?",
    action: "Adjust for M. The target still includes the path through M.",
    graph: {
      nodes: [...endpoints(), graphNode("v1", "M")],
      edges: [edge("A", "Y", 1), edge("A", "v1", 1), edge("v1", "Y", 1)],
    },
  },
  {
    id: "blank",
    name: "Start blank",
    question: "Build your own causal world.",
    action: "Add a variable or connect A to Y to begin.",
    graph: { nodes: endpoints(), edges: [] },
  },
];

export function graphPreset(id) {
  return structuredClone(
    graphPresets.find((p) => p.id === id) ||
      graphPresets.find((p) => p.id === "pkr"),
  );
}
