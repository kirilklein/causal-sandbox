import { jointRatioApproximation } from "./delta-method.js";

const path = (points) =>
  points
    .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
const line = (fn, count = 32) =>
  Array.from({ length: count + 1 }, (_, i) => fn(i / count));

// Rotate normalized data coordinates, then fit the entire frame without changing
// its aspect ratio. The third coordinate orders translucent surface cells by depth.
export function createJointProjection(
  width,
  height,
  { yaw = 0, pitch = 0 } = {},
) {
  const rotate = (x, y, z) => {
    const rx = Math.cos(yaw) * x - Math.sin(yaw) * y;
    const ry = Math.sin(yaw) * x + Math.cos(yaw) * y;
    return [
      rx,
      Math.cos(pitch) * ry - Math.sin(pitch) * z,
      Math.sin(pitch) * ry + Math.cos(pitch) * z,
    ];
  };
  const raw = (x, y, z) => {
    const [rx, ry, rz] = rotate(x, y, z);
    return [
      width * (0.56 * rx + 0.22 * ry),
      height * (0.1 * rx - 0.1 * ry - 0.62 * rz),
      -0.1364 * rx + 0.3472 * ry - 0.078 * rz,
    ];
  };
  const corners = [-0.5, 0.5].flatMap((x) =>
    [-0.5, 0.5].flatMap((y) => [-0.5, 0.5].map((z) => raw(x, y, z))),
  );
  const scale = Math.min(
    (width * 0.39) / Math.max(...corners.map(([x]) => Math.abs(x))),
    (height * 0.41) / Math.max(...corners.map(([, y]) => Math.abs(y))),
  );
  return (revenue, orders, ratio = 0) => {
    const [x, y, depth] = raw(
      (revenue - 14) / 12 - 0.5,
      (orders - 1.4) / 1.2 - 0.5,
      ratio / 20 - 0.5,
    );
    return [width * 0.48 + x * scale, height * 0.49 + y * scale, depth];
  };
}

// Every surface vertex is lifted from the floor to its computed ratio.
export function jointSurfacePlot(rho, stage, width, progress = 1, view = {}) {
  const model = jointRatioApproximation(rho);
  const height = width < 500 ? 390 : 480;
  const project = createJointProjection(width, height, view);
  const segment = (a, b, cls = "dm-axis") =>
    `<path class="${cls}" d="${path([a, b])}"/>`;
  const label = (point, text, dx = 0, dy = 0, anchor = "middle") => {
    const textWidth = String(text).length * 8;
    const before =
      anchor === "end" ? textWidth : anchor === "middle" ? textWidth / 2 : 0;
    const after =
      anchor === "start" ? textWidth : anchor === "middle" ? textWidth / 2 : 0;
    const x = Math.max(4 + before, Math.min(width - 4 - after, point[0] + dx));
    const y = Math.max(16, Math.min(height - 5, point[1] + dy));
    return `<text x="${x}" y="${y}" text-anchor="${anchor}">${text}</text>`;
  };
  const grid = [];
  for (const revenue of [14, 18, 22, 26]) {
    grid.push(segment(project(revenue, 1.4), project(revenue, 2.6)));
    grid.push(segment(project(revenue, 2.6), project(revenue, 2.6, 20)));
  }
  for (const orders of [1.4, 1.8, 2.2, 2.6]) {
    grid.push(segment(project(14, orders), project(26, orders)));
    grid.push(segment(project(14, orders), project(14, orders, 20)));
  }
  for (const z of [0, 5, 10, 15, 20]) {
    grid.push(segment(project(14, 1.4, z), project(14, 2.6, z)));
    grid.push(segment(project(14, 2.6, z), project(26, 2.6, z)));
  }
  const surface = [];
  if (stage >= 1) {
    const lift = stage === 1 ? progress : 1;
    const vertex = (r, o) => project(r, o, model.transform(r, o) * lift);
    // Sort translucent cells by camera depth after building the mesh.
    for (let j = 11; j >= 0; j--) {
      for (let i = 0; i < 12; i++) {
        const r = 14 + i,
          o = 1.4 + j * 0.1;
        surface.push({
          depth: vertex(r + 0.5, o + 0.05)[2],
          markup: `<path class="dm-ratio-surface" d="${path([vertex(r, o), vertex(r + 1, o), vertex(r + 1, o + 0.1), vertex(r, o + 0.1)])}Z"/>`,
        });
      }
    }
  }
  const ellipse = path(
    line((t) => {
      const pair = model.contour(t * 2 * Math.PI);
      return project(pair.revenue, pair.orders);
    }, 100),
  );
  const pairs = [
    {
      revenue: 20,
      orders: 2,
      name: "Population center",
      cls: "dm-center-point",
    },
    { ...model.example, name: "Illustrative pair", cls: "dm-example-point" },
  ];
  const dots = pairs
    .map(({ revenue, orders, name, cls }) => {
      const floor = project(revenue, orders);
      const ratio = model.transform(revenue, orders);
      const top = project(
        revenue,
        orders,
        ratio * (stage === 2 ? progress : 1),
      );
      return `<circle class="${cls}" cx="${floor[0]}" cy="${floor[1]}" r="4"><title>${name}: €${revenue.toFixed(2)} and ${orders.toFixed(2)} orders per visitor</title></circle>${stage >= 2 ? `<path class="dm-projection ${cls}" d="${path([floor, top])}"/><circle class="${cls}" cx="${top[0]}" cy="${top[1]}" r="4"><title>${name}: €${ratio.toFixed(2)} per order</title></circle>` : ""}`;
    })
    .join("");
  const tangents = [];
  if (stage >= 3) {
    const extent = stage === 3 ? progress : 1;
    tangents.push(
      `<path class="dm-revenue-tangent" d="${path(
        line((t) => {
          const revenue = 20 + (t - 0.5) * 10 * extent;
          return project(revenue, 2, model.tangent(revenue, 2));
        }),
      )}"/>`,
    );
  }
  if (stage >= 4) {
    const extent = stage === 4 ? progress : 1;
    tangents.push(
      `<path class="dm-order-tangent" d="${path(
        line((t) => {
          const orders = 2 + (t - 0.5) * extent;
          return project(20, orders, model.tangent(20, orders));
        }),
      )}"/>`,
    );
  }
  const spreads = [];
  const center = project(20, 2, 10);
  for (const [reveal, revenue, orders, key, text, dy] of [
    [3, 22, 2, "revenue", "σR = €2", -20],
    [4, 20, 2.2, "orders", "σO = 0.2", 28],
  ]) {
    if (stage < reveal) continue;
    const extent = stage === reveal ? progress : 1;
    const r = 20 + (revenue - 20) * extent;
    const o = 2 + (orders - 2) * extent;
    const tip = project(r, o, model.tangent(r, o));
    const annotation = label(tip, text, 0, dy).replace(
      /σ([RO])/,
      'σ<tspan baseline-shift="sub" font-size="10">$1</tspan>',
    );
    spreads.push(
      `<g class="dm-${key}-spread"><path d="${path([center, tip])}" marker-end="url(#dm-${key}-arrow)"/>${extent === 1 ? annotation : ""}<title>One input standard error along the ${key} tangent; the output changes by ${key === "revenue" ? "+" : "−"}€1 per order.</title></g>`,
    );
  }
  return `<svg class="dm-chart dm-joint-chart" viewBox="0 0 ${width} ${height}" role="img" data-yaw="${view.yaw || 0}" data-pitch="${view.pitch || 0}" data-stage="${stage}" data-progress="${progress.toFixed(3)}" aria-label="Three dimensional ratio diagram. Floor axes: average revenue and orders per visitor. Height: euros per order. ${stage >= 1 ? "Curved surface: revenue divided by orders." : "Input uncertainty ellipse and two marked pairs; no surface yet."} ${stage >= 2 ? "Vertical guides map the input pairs to their ratios." : ""} ${stage >= 3 ? "Blue tangent varies revenue." : ""} ${stage >= 4 ? "Orange tangent varies orders; both meet at the population center." : ""}">
    <defs>${["revenue", "orders"].map((key) => `<marker id="dm-${key}-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path class="dm-${key}-arrowhead" d="M0 0L8 4L0 8Z"/></marker>`).join("")}</defs>
    <text x="12" y="22">Height: € / order</text>
    ${grid.join("")}
    ${segment(project(26, 2.6), project(26, 2.6, 20), "dm-coordinate-axis")}
    ${surface
      .sort((a, b) => b.depth - a.depth)
      .map((cell) => cell.markup)
      .join("")}
    <path class="dm-floor-ellipse" d="${ellipse}Z"/>
    ${tangents.join("")}
    ${dots}
    ${spreads.join("")}
    ${[14, 20, 26].map((r) => label(project(r, 1.4), r, 0, 19)).join("")}
    ${(width < 500 ? [1.4, 2.6] : [1.4, 2, 2.6]).map((o) => (o === 2.6 ? label(project(26, o), o, 0, 20, "end") : label(project(26, o), o, 9, 3, "start"))).join("")}
    ${[0, 10, 20].map((z) => label(project(26, 2.6, z), z, 9, 3, "start")).join("")}
    ${label(project(20, 1.4), "Revenue (€)", 0, 41)}
    ${label(project(26, 2), "Orders", 3, -20)}
  </svg>`;
}
