export const selectedNodes = (choice) =>
  choice?.startsWith("set:") ? choice.slice(4).split(",") : [];
export const adjustmentChoice = (nodes) =>
  nodes.length ? `set:${[...nodes].sort().join(",")}` : "none";
export function adjustmentLabel(choice) {
  return (
    {
      none: "No adjustment needed",
      impossible: "No valid measured adjustment set exists",
      unsure: "I’m not sure",
    }[choice] || `Adjust for ${selectedNodes(choice).join(", ")}`
  );
}
export function validAdjustmentChoice(question, choice) {
  if (typeof choice !== "string") return false;
  if (["none", "impossible", "unsure"].includes(choice)) return true;
  const nodes = selectedNodes(choice);
  return (
    nodes.length > 0 &&
    new Set(nodes).size === nodes.length &&
    adjustmentChoice(nodes) === choice &&
    nodes.every(
      (id) =>
        question.graph.nodes.some(([node]) => node === id) &&
        !["A", "Y", ...(question.unmeasured || [])].includes(id),
    )
  );
}
function descendants(graph, start) {
  const found = new Set(),
    pending = [start];
  while (pending.length) {
    const current = pending.pop();
    for (const [from, to] of graph.edges)
      if (from === current && !found.has(to)) {
        found.add(to);
        pending.push(to);
      }
  }
  return found;
}
function paths(graph) {
  const result = [];
  function visit(path) {
    const last = path.at(-1);
    if (last === "Y") {
      result.push(path);
      return;
    }
    for (const [a, b] of graph.edges) {
      const next = a === last ? b : b === last ? a : null;
      if (next && !path.includes(next)) visit([...path, next]);
    }
  }
  visit(["A"]);
  return result;
}
// These authored questions ask for ordinary backdoor adjustment, with all
// treatment descendants on causal paths. This is not a general identification engine.
export function inspectAdjustment(question, selected) {
  const graph = question.graph;
  const edge = (a, b) =>
    graph.edges.some(([from, to]) => from === a && to === b);
  const pathLabel = (path) =>
    path
      .map((id, i) => (i ? `${edge(path[i - 1], id) ? "→" : "←"} ${id}` : id))
      .join(" ");
  const allPaths = paths(graph);
  const causal = allPaths.filter((path) =>
    path.slice(1).every((node, i) => edge(path[i], node)),
  );
  const blocked = causal.find((path) =>
    path.slice(1, -1).some((node) => selected.includes(node)),
  );
  if (blocked)
    return {
      correct: false,
      path: blocked,
      message: `This adjustment blocks part of the total effect along ${pathLabel(blocked)} (highlighted).`,
    };
  const open = allPaths
    .filter((path) => edge(path[1], "A"))
    .find((path) =>
      path.slice(1, -1).every((node, i) => {
        const collider = edge(path[i], node) && edge(path[i + 2], node);
        return collider
          ? [node, ...descendants(graph, node)].some((id) =>
              selected.includes(id),
            )
          : !selected.includes(node);
      }),
    );
  if (open)
    return {
      correct: false,
      path: open,
      message: `The backdoor path ${pathLabel(open)} (highlighted) is open under your adjustment choice. It can transmit noncausal association.`,
    };
  return {
    correct: true,
    path: [],
    message:
      "Your set blocks every backdoor path while preserving the causal paths. Other valid sets may also exist.",
  };
}
export function validAdjustmentSets(question) {
  const ids = question.graph.nodes
    .map(([id]) => id)
    .filter((id) => !["A", "Y", ...(question.unmeasured || [])].includes(id));
  return Array.from({ length: 2 ** ids.length }, (_, mask) =>
    ids.filter((_, i) => mask & (1 << i)),
  ).filter((set) => inspectAdjustment(question, set).correct);
}
export function gradeAdjustment(question, choice) {
  if (!validAdjustmentChoice(question, choice))
    throw new Error("Unknown adjustment answer");
  if (choice === "unsure")
    return {
      correct: false,
      path: [],
      message:
        "Trace each backdoor path and look for a measured variable that can close it without blocking the effect.",
    };
  if (choice === "impossible") {
    const correct = validAdjustmentSets(question).length === 0;
    return {
      correct,
      path: [],
      message: correct
        ? "No measured adjustment set blocks all backdoor paths in this graph."
        : "A valid measured adjustment set exists. Look for a way to close each backdoor path.",
    };
  }
  return inspectAdjustment(question, selectedNodes(choice));
}
export function adjustmentSolutions(question) {
  const sets = validAdjustmentSets(question);
  // Show minimal sets without rejecting valid supersets in grading.
  const minimal = sets.filter(
    (set) =>
      !sets.some(
        (other) =>
          other.length < set.length && other.every((id) => set.includes(id)),
      ),
  );
  return minimal.length
    ? `Valid minimal sets: ${minimal.map((set) => (set.length ? `{${set.join(", ")}}` : "no adjustment")).join("; ")}. Other valid sets are accepted too.`
    : "No valid measured adjustment set exists.";
}
export function experimentUrl(question, choice) {
  const params = new URLSearchParams({
    sandbox: "graph-lab",
    preset: question.scenarioId || question.id,
    adjust: selectedNodes(choice).join(","),
  });
  return `?${params}`;
}
