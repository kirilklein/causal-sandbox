import { validateGraph } from "./graph-simulation.js";

export function automaticPositions(graph, columns = 3) {
  const depth = {},
    positions = {};
  for (const id of validateGraph(graph).order)
    depth[id] = Math.max(
      0,
      ...graph.edges.filter((e) => e.to === id).map((e) => depth[e.from] + 1),
    );
  const levels = Math.max(...Object.values(depth)) + 1;
  const rows = [];
  for (let level = 0; level < levels; level++) {
    const row = graph.nodes.filter((node) => depth[node.id] === level);
    for (let start = 0; start < row.length; start += columns)
      rows.push(row.slice(start, start + columns));
  }
  rows.forEach((row, level) => {
    row.forEach((node, i) => {
      positions[node.id] = {
        x: (i + 0.5) / row.length,
        y: rows.length === 1 ? 0.5 : level / (rows.length - 1),
      };
    });
  });
  return positions;
}

// Each arrow has its own curve. Prefer a straight path unless a node or label obstructs it.
export function edgeGeometry(edge, points, labels, width, height) {
  const a = points[edge.from],
    b = points[edge.to];
  const distance = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const normal = { x: -(b.y - a.y) / distance, y: (b.x - a.x) / distance };
  let best;
  for (const bend of [0, 45, -45, 90, -90, 150, -150, 220, -220]) {
    const c = {
      x: (a.x + b.x) / 2 + normal.x * bend,
      y: (a.y + b.y) / 2 + normal.y * bend,
    };
    const startLength = Math.hypot(c.x - a.x, c.y - a.y) || 1;
    const endLength = Math.hypot(b.x - c.x, b.y - c.y) || 1;
    const start = {
      x: a.x + ((c.x - a.x) / startLength) * 29,
      y: a.y + ((c.y - a.y) / startLength) * 29,
    };
    const end = {
      x: b.x - ((b.x - c.x) / endLength) * 35,
      y: b.y - ((b.y - c.y) / endLength) * 35,
    };
    const at = (t) => ({
      x: (1 - t) ** 2 * start.x + 2 * t * (1 - t) * c.x + t * t * end.x,
      y: (1 - t) ** 2 * start.y + 2 * t * (1 - t) * c.y + t * t * end.y,
    });
    const middle = at(0.5),
      label = { x: middle.x + normal.x * 13, y: middle.y + normal.y * 13 };
    let score = Math.abs(bend) * 0.05;
    for (let i = 1; i < 20; i++) {
      const p = at(i / 20);
      if (p.x < 10 || p.x > width - 10 || p.y < 10 || p.y > height - 10)
        score += 100;
      for (const [id, node] of Object.entries(points)) {
        if (id !== edge.from && id !== edge.to)
          score +=
            Math.max(0, 40 - Math.hypot(p.x - node.x, p.y - node.y)) * 10;
      }
    }
    for (const p of [...labels, ...Object.values(points)])
      score += Math.max(0, 40 - Math.hypot(label.x - p.x, label.y - p.y)) * 20;
    if (!best || score < best.score)
      best = {
        score,
        label,
        path: `M${start.x} ${start.y}Q${c.x} ${c.y} ${end.x} ${end.y}`,
      };
  }
  return best;
}
