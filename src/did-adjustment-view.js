const percent = (risk) => `${Math.round(risk * 100)}%`;
const points = (risk) =>
  `${risk >= 0 ? "+" : "−"}${Math.abs(risk * 100)
    .toFixed(1)
    .replace(/\.0$/, "")} pp`;
const mean = (rows, key) =>
  rows.reduce((sum, h) => sum + h[key], 0) / rows.length;
const mark = (D, x, y, radius = 4) =>
  D
    ? `<path d="M${x},${y - radius}l${radius},${radius * 2}h${-radius * 2}Z"/>`
    : `<circle cx="${x}" cy="${y}" r="${radius}"/>`;

function armPanel(rows, D, width) {
  const name = D ? "Treated" : "Comparison";
  const before = mean(rows, "before");
  const after = mean(rows, "after");
  const x0 = 38;
  const x1 = width - 82;
  const y = (risk) => 200 - risk * 148;
  // Identical observed trajectories share one line, with their exact multiplicity.
  const trajectories = [];
  for (const hospital of rows) {
    let trajectory = trajectories.find(
      (group) =>
        group.before === hospital.before && group.after === hospital.after,
    );
    if (!trajectory) {
      trajectory = { before: hospital.before, after: hospital.after, count: 0 };
      trajectories.push(trajectory);
    }
    trajectory.count++;
  }
  const baselineRates = [...new Set(rows.map((h) => h.before))];
  return `<section class="da-arm" style="--hospital-arm:var(--arm-${D})" aria-label="${name} hospitals">
    <div class="da-arm-heading"><h4>${D ? "▲" : "●"} ${name}</h4><span>${rows.length} hospitals</span></div>
    <div class="da-arm-summary"><div><span>Group mean recovery</span><strong aria-label="${percent(before)} at baseline, ${percent(after)} at follow-up">${percent(before)} <span aria-hidden="true">→</span> ${percent(after)}</strong></div><div><span>Mean change</span><strong>${points(after - before)}</strong></div></div>
    <svg class="did-chart da-hospital-chart" viewBox="0 32 ${width} 206" role="img" aria-label="${name}: mean recovery ${percent(before)} to ${percent(after)}. ${trajectories.map((group) => `${group.count} hospitals: ${percent(group.before)} to ${percent(group.after)}`).join("; ")}.">
      ${[0, 0.5, 1].map((risk) => `<line class="did-grid" x1="${x0}" x2="${x1}" y1="${y(risk)}" y2="${y(risk)}"/><text class="did-axis" x="0" y="${y(risk) + 4}">${percent(risk)}</text>`).join("")}
      ${trajectories.map((group) => `<g class="hospital-profile" fill="var(--hospital-arm)"><title>${name}: ${group.count} hospitals, ${percent(group.before)} to ${percent(group.after)}</title><path d="M${x0},${y(group.before)}L${x1},${y(group.after)}" fill="none" stroke="var(--hospital-arm)" stroke-width="2.5"/>${mark(D, x1, y(group.after))}<text class="da-endpoint" x="${x1 + 10}" y="${y(group.after) + 4}">${percent(group.after)} ×${group.count}</text></g>`).join("")}
      ${baselineRates.map((risk) => `<g fill="var(--hospital-arm)">${mark(D, x0, y(risk))}</g>`).join("")}
      <text class="did-axis" x="${x0}" y="227" text-anchor="middle">Baseline</text><text class="did-axis" x="${x1}" y="227" text-anchor="middle">Follow-up</text>
    </svg>
  </section>`;
}

export function hospitalChart(
  hospitals,
  { width = 600, title = "All 12 hospitals" } = {},
) {
  const sideBySide = width >= 620;
  const panelWidth = sideBySide ? (width - 16) / 2 : width;
  // Match the panel's 14 px padding and 1 px border on each side.
  const chartWidth = Math.max(220, panelWidth - 30);
  return `<section class="da-hospital-group"><h3>${title}</h3><div class="da-arm-panels ${sideBySide ? "da-arm-panels-wide" : ""}">${[
    1, 0,
  ]
    .map((D) =>
      armPanel(
        hospitals.filter((h) => h.D === D),
        D,
        chartWidth,
      ),
    )
    .join("")}</div></section>`;
}
