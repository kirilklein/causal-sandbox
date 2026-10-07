const percent = (risk) => `${Math.round(risk * 100)}%`;
const points = (risk) =>
  `${risk > 1e-10 ? "+" : risk < -1e-10 ? "−" : ""}${Math.abs(risk * 100)
    .toFixed(1)
    .replace(/\.0$/, "")} pp`;
const change = (h) => h.after - h.before;
const meanChange = (rows) =>
  rows.reduce((sum, h) => sum + change(h), 0) / rows.length;
const description = (h) =>
  `${h.id}: ${percent(h.before)} to ${percent(h.after)}; change ${points(change(h))}`;
const mark = (D, x, y, r = 4) =>
  D
    ? `<path d="M${x},${y - r}l${r},${r * 2}h${-r * 2}Z"/>`
    : `<circle cx="${x}" cy="${y}" r="${r}"/>`;

function trajectories(hospitals) {
  const y = (risk) => 91 - risk * 62;
  return [1, 0]
    .map((D) => {
      const rows = hospitals.filter((h) => h.D === D);
      return `<section class="da-trajectory-arm" style="--hospital-arm:var(--arm-${D})"><h4>${D ? "▲ Treated" : "● Comparison"} · ${rows.length} hospitals</h4><div class="da-mini-grid">${rows.map((h) => `<figure class="da-mini"><figcaption>${h.id}<span>${percent(h.before)} → ${percent(h.after)}</span></figcaption><svg class="did-chart" viewBox="0 0 140 116" role="img" aria-label="${description(h)}"><title class="hospital-record">${description(h)}</title>${[0, 1].map((risk) => `<line class="did-grid" x1="33" x2="110" y1="${y(risk)}" y2="${y(risk)}"/><text class="da-mini-axis" x="0" y="${y(risk) + 3}">${percent(risk)}</text>`).join("")}<g fill="var(--hospital-arm)"><path d="M33,${y(h.before)}L110,${y(h.after)}" fill="none" stroke="var(--hospital-arm)" stroke-width="2.5"/>${mark(D, 33, y(h.before))}${mark(D, 110, y(h.after))}</g><text class="da-mini-axis" x="33" y="111" text-anchor="middle">Baseline</text><text class="da-mini-axis" x="110" y="111" text-anchor="middle">Follow-up</text></svg></figure>`).join("")}</div></section>`;
    })
    .join("");
}

function changes(hospitals, width) {
  // Identical scales in the overall and capacity-specific views: 0 to 50 pp.
  const x = (risk) => 42 + (risk / 0.5) * (width - 68);
  let top = 40;
  const arms = [1, 0]
    .map((D) => {
      const rows = hospitals.filter((h) => h.D === D);
      const mean = meanChange(rows);
      const start = top;
      const dots = rows
        .map((h, i) => {
          const cy = start + 25 + i * 23;
          return `<g class="hospital-dot" fill="var(--arm-${D})"><title class="hospital-record">${description(h)}</title><text class="did-axis" x="2" y="${cy + 4}">${h.id}</text>${mark(D, x(change(h)), cy, 4.5)}</g>`;
        })
        .join("");
      top += 38 + rows.length * 23;
      return `<text class="da-arm-label" x="2" y="${start}">${D ? "▲ Treated" : "● Comparison"}</text><text class="did-axis" x="${width - 4}" y="${start}" text-anchor="end">Mean ${points(mean)}</text><line class="da-mean-line" x1="${x(mean)}" x2="${x(mean)}" y1="${start + 13}" y2="${top - 29}" stroke="var(--arm-${D})"/>${dots}`;
    })
    .join("");
  const t = meanChange(hospitals.filter((h) => h.D));
  const c = meanChange(hospitals.filter((h) => !h.D));
  const axis = top + 18;
  return `<svg class="did-chart da-change-chart" viewBox="0 0 ${width} ${axis + 70}" role="img" aria-label="Observed hospital changes; treated mean ${points(t)}, comparison mean ${points(c)}, difference ${points(t - c)}.">
    ${[0, 0.1, 0.2, 0.3, 0.4, 0.5].map((risk) => `<line class="did-grid" x1="${x(risk)}" x2="${x(risk)}" y1="50" y2="${axis}"/><text class="did-axis" x="${x(risk)}" y="${axis + 18}" text-anchor="middle">${Math.round(risk * 100)}</text>`).join("")}
    ${arms}<path class="da-contrast" d="M${x(c)},${axis - 10}v-7H${x(t)}v7"/>
    <text class="da-contrast-label" x="${width / 2}" y="${axis + 43}" text-anchor="middle">Difference in changes: ${points(t - c)}</text><text class="did-axis" x="${width / 2}" y="${axis + 63}" text-anchor="middle">Observed change (percentage points)</text>
  </svg>`;
}

export function hospitalChart(
  hospitals,
  { width = 600, title = "All 12 hospitals", view = "trajectories" } = {},
) {
  return `<section class="da-hospital-group ${width < 380 ? "da-compact" : ""}"><h3>${title}</h3>${view === "changes" ? changes(hospitals, width) : trajectories(hospitals)}</section>`;
}
