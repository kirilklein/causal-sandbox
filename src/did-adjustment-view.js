import { hospitalCounterfactuals } from "./did-adjustment.js";

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

function comparisonStrip(rows, width, title, recipients) {
  const x = (risk) => 32 + (risk / 0.25) * (width - 48);
  const height = 32 + rows.length * 23;
  const borrowed = meanChange(rows);
  return `<section class="da-source"><h4>${title}</h4><p class="da-borrow-amount">Borrow <strong>${points(borrowed)}</strong></p><p class="small">${recipients}</p><svg class="did-chart da-source-chart" viewBox="0 0 ${width} ${height + 52}" role="img" aria-label="${title}: comparison mean change ${points(borrowed)}. Each point is an observed hospital change.">
    ${[0, 0.1, 0.2].map((risk) => `<line class="did-grid" x1="${x(risk)}" x2="${x(risk)}" y1="10" y2="${height}"/><text class="did-axis" x="${x(risk)}" y="${height + 18}" text-anchor="middle">${Math.round(risk * 100)}</text>`).join("")}
    <line class="da-mean-line" x1="${x(borrowed)}" x2="${x(borrowed)}" y1="10" y2="${height}"/>
    ${rows.map((h, i) => `<g class="da-source-hospital" fill="var(--arm-0)"><title class="hospital-record">${description(h)}</title><text class="did-axis" x="0" y="${24 + i * 23}">${h.id}</text>${mark(0, x(change(h)), 20 + i * 23)}</g>`).join("")}
    <text class="did-axis" x="${width / 2}" y="${height + 42}" text-anchor="middle">Observed change (pp)</text></svg></section>`;
}

export function borrowingChart(
  hospitals,
  { width = 600, adjusted = false } = {},
) {
  const rows = hospitalCounterfactuals(hospitals, { adjusted });
  const wide = width >= 740;
  const rowWidth = wide ? width - 280 : width;
  const sourceWidth = wide ? 236 : width - 24;
  const x = (risk) => 42 + risk * (rowWidth - 108);
  const axisY = 46 + rows.length * 65;
  const sourceGroups = adjusted ? ["high", "low"] : [null];
  const sources = sourceGroups
    .map((capacity) => {
      const comparison = hospitals.filter(
        (h) => !h.D && (!capacity || h.capacity === capacity),
      );
      const target = rows.filter((h) => !capacity || h.capacity === capacity);
      const title = capacity
        ? `${capacity === "high" ? "High" : "Low"} capacity`
        : "All comparison hospitals";
      return comparisonStrip(
        comparison,
        sourceWidth,
        title,
        `For ${target.map((h) => h.id).join(", ")}`,
      );
    })
    .join("");
  return `<div class="da-borrow-layout ${wide ? "da-borrow-wide" : ""}"><section class="da-treated-panel"><h3>Build the missing follow-up for each treated hospital</h3><p class="small">○ Baseline · ◇ Assumed without program · ▲ Observed follow-up</p>
    <svg class="did-chart da-borrow-chart" viewBox="0 0 ${rowWidth} ${axisY + 50}" role="img" aria-label="Treated hospital recovery, assumed untreated follow-up, and observed follow-up. Assumed endpoints borrow comparison-hospital mean changes, not simulator truth.">
      <text class="did-axis" x="${rowWidth - 2}" y="20" text-anchor="end">Gap</text>
      ${[0, 0.25, 0.5, 0.75, 1].map((risk) => `<line class="did-grid" x1="${x(risk)}" x2="${x(risk)}" y1="26" y2="${axisY}"/><text class="did-axis" x="${x(risk)}" y="${axisY + 18}" text-anchor="middle">${Math.round(risk * 100)}%</text>`).join("")}
      ${rows
        .map((h, i) => {
          const cy = 44 + i * 65;
          return `<g class="da-treated-row" data-hospital="${h.id}"><title class="hospital-record">${description(h)}</title><desc>${h.id} borrows ${points(h.borrowedChange)} from ${h.sourceIds.join(", ")}. Assumed untreated recovery ${percent(h.counterfactual)}; observed-minus-assumed gap ${points(h.gap)}.</desc>
          <text class="da-row-id" x="0" y="${cy + 4}">${h.id}</text>${adjusted ? `<text class="da-capacity-label" x="0" y="${cy + 22}">${h.capacity === "high" ? "High" : "Low"}</text>` : ""}
          <line class="da-borrowed-segment" x1="${x(h.before)}" x2="${x(h.counterfactual)}" y1="${cy}" y2="${cy}"/>
          <line class="da-gap-segment" x1="${x(h.counterfactual)}" x2="${x(h.after)}" y1="${cy}" y2="${cy}"/>
          <circle class="da-baseline" cx="${x(h.before)}" cy="${cy}" r="4"/>
          <path class="da-assumed" d="M${x(h.counterfactual)},${cy - 5}l5,5l-5,5l-5,-5Z"/>
          <g class="da-observed">${mark(1, x(h.after), cy, 5)}</g>
          <text class="da-row-gap" x="${rowWidth - 2}" y="${cy + 4}" text-anchor="end">${points(h.gap)}</text>
          <text class="da-row-values" x="42" y="${cy + 23}">${percent(h.before)} → ${percent(h.counterfactual)} assumed → ${percent(h.after)}</text>
        </g>`;
        })
        .join("")}
      <text class="did-axis" x="${rowWidth / 2}" y="${axisY + 42}" text-anchor="middle">Recovery rate</text>
    </svg><p class="small">The effect estimate averages these six gaps, with each treated hospital counting equally.</p></section>
    <aside class="da-sources" aria-label="Where the borrowed changes come from"><h3>Borrow from comparison hospitals</h3>${sources}</aside></div>`;
}

export function hospitalChart(hospitals) {
  return `<section class="da-hospital-group"><h3>Observed hospital trajectories</h3>${trajectories(hospitals)}</section>`;
}
