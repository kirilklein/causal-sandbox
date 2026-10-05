import { jointRatioApproximation } from "./delta-method.js";

const path = (points) =>
  points
    .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
const line = (fn, count = 32) =>
  Array.from({ length: count + 1 }, (_, i) => fn(i / count));

// Fixed oblique projection keeps the same frame throughout the teaching sequence.
// Every surface vertex is lifted from (revenue, orders, 0) to its computed ratio.
export function jointSurfacePlot(rho, stage, width, progress = 1) {
  const model = jointRatioApproximation(rho);
  const height = width < 500 ? 390 : 480;
  const project = (revenue, orders, ratio = 0) => {
    const x = (revenue - 14) / 12;
    const y = (orders - 1.4) / 1.2;
    return [
      width * (0.09 + 0.56 * x + 0.22 * y),
      height * (0.8 + 0.1 * x - 0.1 * y - (0.62 * ratio) / 20),
    ];
  };
  const segment = (a, b, cls = "dm-axis") =>
    `<path class="${cls}" d="${path([a, b])}"/>`;
  const label = (point, text, dx = 0, dy = 0, anchor = "middle") =>
    `<text x="${point[0] + dx}" y="${point[1] + dy}" text-anchor="${anchor}">${text}</text>`;
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
    // Back rows first; translucent cells retain the input plane underneath.
    for (let j = 11; j >= 0; j--) {
      for (let i = 0; i < 12; i++) {
        const r = 14 + i,
          o = 1.4 + j * 0.1;
        surface.push(
          `<path class="dm-ratio-surface" d="${path([vertex(r, o), vertex(r + 1, o), vertex(r + 1, o + 0.1), vertex(r, o + 0.1)])}Z"/>`,
        );
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
  return `<svg class="dm-chart dm-joint-chart" viewBox="0 0 ${width} ${height}" role="img" data-stage="${stage}" data-progress="${progress.toFixed(3)}" aria-label="Three dimensional ratio diagram. Floor axes: average revenue and orders per visitor. Height: euros per order. ${stage >= 1 ? "Curved surface: revenue divided by orders." : "Input uncertainty ellipse and two marked pairs; no surface yet."} ${stage >= 2 ? "Vertical guides map the input pairs to their ratios." : ""} ${stage >= 3 ? "Blue tangent varies revenue." : ""} ${stage >= 4 ? "Orange tangent varies orders; both meet at the population center." : ""}">
    <text x="12" y="22">Height: € / order</text>
    ${grid.join("")}
    ${segment(project(26, 2.6), project(26, 2.6, 20), "dm-coordinate-axis")}
    ${surface.join("")}
    <path class="dm-floor-ellipse" d="${ellipse}Z"/>
    ${tangents.join("")}
    ${dots}
    ${[14, 20, 26].map((r) => label(project(r, 1.4), r, 0, 19)).join("")}
    ${(width < 500 ? [1.4, 2.6] : [1.4, 2, 2.6]).map((o) => (o === 2.6 ? label(project(26, o), o, 0, 20, "end") : label(project(26, o), o, 9, 3, "start"))).join("")}
    ${[0, 10, 20].map((z) => label(project(26, 2.6, z), z, 9, 3, "start")).join("")}
    ${label(project(20, 1.4), "Revenue (€)", 0, 41)}
    ${label(project(26, 2), "Orders", 3, -20)}
  </svg>`;
}
