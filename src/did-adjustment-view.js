const percent = (risk) => `${Math.round(risk * 100)}%`;

export function hospitalChart(
  hospitals,
  { width = 600, title = "All 12 hospitals" } = {},
) {
  const height = 280;
  const x0 = 54;
  const x1 = width - 35;
  const y = (risk) => 230 - risk * 180;
  const mean = (rows, key) =>
    rows.reduce((sum, h) => sum + h[key], 0) / rows.length;
  const mark = (D, x, cy, radius) =>
    D
      ? `<path d="M${x},${cy - radius}l${radius},${radius * 2}h${-radius * 2}Z" fill="var(--arm-1)"/>`
      : `<circle cx="${x}" cy="${cy}" r="${radius}" fill="var(--arm-0)"/>`;
  const paths = [0, 1]
    .map((D) => {
      const rows = hospitals.filter((h) => h.D === D);
      const color = `var(--arm-${D})`;
      const individuals = rows
        .map((h, i) => {
          // Horizontal separation reveals coincident hospitals; vertical values stay exact.
          const shift = (i - (rows.length - 1) / 2) * 4;
          return `<g class="hospital-trajectory"><title>${h.id}: ${percent(h.before)} to ${percent(h.after)}</title><path d="M${x0 + shift},${y(h.before)}L${x1 + shift},${y(h.after)}" stroke="${color}" stroke-width="1" opacity="0.45"/>${mark(D, x0 + shift, y(h.before), 2)}${mark(D, x1 + shift, y(h.after), 2)}</g>`;
        })
        .join("");
      if (!rows.length) return "";
      return `${individuals}<path class="hospital-mean" d="M${x0},${y(mean(rows, "before"))}L${x1},${y(mean(rows, "after"))}" stroke="${color}" stroke-width="3"/>${mark(D, x0, y(mean(rows, "before")), 5)}${mark(D, x1, y(mean(rows, "after")), 5)}`;
    })
    .join("");
  return `<svg class="did-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${title}: observed hospital recovery trajectories. Thick lines show group means.">
    <text x="0" y="17" class="did-axis-title">${title}</text>
    ${[0, 0.5, 1].map((risk) => `<line class="did-grid" x1="${x0 - 15}" x2="${width - 15}" y1="${y(risk)}" y2="${y(risk)}"/><text class="did-axis" x="0" y="${y(risk) + 4}">${percent(risk)}</text>`).join("")}
    <line class="did-program-line" x1="${(x0 + x1) / 2}" x2="${(x0 + x1) / 2}" y1="40" y2="232"/>
    ${paths}
    <text class="did-axis" x="${x0}" y="256" text-anchor="middle">Baseline</text><text class="did-axis" x="${x1}" y="256" text-anchor="middle">Follow-up</text>
  </svg>`;
}
