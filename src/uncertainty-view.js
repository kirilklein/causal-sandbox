import { normalDensity } from "./uncertainty.js";

export const fmt = (value) => value.toFixed(2).replace(/^-0\.00$/, "0.00");
// Keep a small nonzero bound visibly distinct from zero when reading a test.
export const fmtBound = (value) =>
  value !== 0 && Math.abs(value) < 0.005 ? value.toPrecision(2) : fmt(value);
export const pLabel = (p) => (p < 0.0001 ? "< 0.0001" : p.toFixed(4));

export function intervalPlot(studies, { truth = false, width = 700 } = {}) {
  const shown = studies.slice(-50);
  const left = 32,
    right = width - 18;
  const x = (v) =>
    left + ((Math.max(-1, Math.min(5, v)) + 1) / 6) * (right - left);
  const bottom = 38 + shown.length * 9;
  return `<svg class="inference-chart" viewBox="0 0 ${width} ${bottom + 50}" role="img" aria-label="${shown.length === 1 ? "Estimate and 95% confidence interval" : "Latest study estimates and their 95% confidence intervals"}, in outcome units${truth ? "; dashed line is the true effect" : ""}. Exact values follow the chart.">
    ${[-1, 0, 1, 2, 3, 4, 5].map((v) => `<path class="inference-grid" d="M${x(v)} 28V${bottom}"/><text x="${x(v)}" y="${bottom + 20}" text-anchor="middle">${v}</text>`).join("")}
    ${truth ? `<path class="inference-truth" d="M${x(shown[0].truth)} 24V${bottom}"/><text x="${x(shown[0].truth)}" y="16" text-anchor="middle">Truth: ${fmt(shown[0].truth)}</text>` : ""}
    ${shown
      .map((s, i) => {
        if (s.status !== "ok") return "";
        const y = 33 + i * 9;
        const missed = truth && (s.lower > s.truth || s.upper < s.truth);
        return `<g class="inference-interval${missed ? " missed" : ""}" data-covered="${truth ? !missed : "unknown"}"><title>Study ${s.seed}: ${fmt(s.estimate)}, interval ${fmt(s.lower)} to ${fmt(s.upper)}${truth ? (missed ? "; misses truth" : "; covers truth") : ""}</title><path d="M${x(s.lower)} ${y}H${x(s.upper)}"/><circle cx="${x(s.estimate)}" cy="${y}" r="${shown.length === 1 ? 4 : 2.5}"/>${s.lower < -1 ? `<path d="m${left + 5} ${y - 4}-5 4 5 4"/>` : ""}${s.upper > 5 ? `<path d="m${right - 5} ${y - 4}5 4-5 4"/>` : ""}</g>`;
      })
      .join("")}
    <text x="${width / 2}" y="${bottom + 43}" text-anchor="middle">Outcome difference (treated − untreated)</text>
  </svg>`;
}

export function studyTable(studies, revealTruth) {
  return `<table><caption>Study results in outcome units (rounded to two decimals)</caption><thead><tr><th scope="col">Study seed</th><th scope="col">Estimate</th><th scope="col">95% interval</th>${revealTruth ? '<th scope="col">Covers truth?</th>' : ""}</tr></thead><tbody>${studies.map((s) => `<tr><th scope="row">${s.seed}</th>${s.status === "ok" ? `<td>${fmt(s.estimate)}</td><td>${fmt(s.lower)} to ${fmt(s.upper)}</td>${revealTruth ? `<td>${s.lower <= s.truth && s.truth <= s.upper ? "Yes" : "No"}</td>` : ""}` : `<td colspan="${revealTruth ? 3 : 2}">Unavailable: ${s.reason}</td>`}</tr>`).join("")}</tbody></table>`;
}

export function nullPlot(studies, observed, width = 700) {
  const left = 32,
    right = width - 18;
  const x = (z) =>
    left + ((Math.max(-4, Math.min(4, z)) + 4) / 8) * (right - left);
  const y = (z) => 155 - normalDensity(z) * 290;
  const curve = (from, to) =>
    Array.from({ length: 101 }, (_, i) => {
      const z = from + ((to - from) * i) / 100;
      return `${i ? "L" : "M"}${x(z)},${y(z)}`;
    }).join(" ");
  const cutoff = observed ? Math.min(4, Math.abs(observed.z)) : 4;
  return `<svg class="inference-chart" viewBox="0 0 ${width} 250" role="img" aria-label="Standard normal approximation under a zero difference. ${observed ? `Both shaded tails are at least as extreme as the observed z of ${fmt(observed.z)}. Two-sided p ${pLabel(observed.p)}.` : "Dots are test statistics from repeated null studies."}">
    ${[-4, -2, 0, 2, 4].map((z) => `<path class="inference-grid" d="M${x(z)} 25V210"/><text x="${x(z)}" y="228" text-anchor="middle">${z}</text>`).join("")}
    ${
      observed
        ? [
            [-4, -cutoff],
            [cutoff, 4],
          ]
            .map(
              ([a, b]) =>
                `<path class="inference-tail" d="${curve(a, b)}L${x(b)} 155H${x(a)}Z"/>`,
            )
            .join("")
        : ""
    }
    <path class="inference-density" d="${curve(-4, 4)}"/>
    ${studies
      .filter((s) => s.status === "ok")
      .map(
        (s, i) =>
          `<circle class="null-dot" cx="${x(s.z)}" cy="${177 + (i % 5) * 6}" r="2.3"><title>Null study ${s.seed}: z = ${fmt(s.z)}</title></circle>`,
      )
      .join("")}
    ${observed ? `<path class="inference-observed" d="M${x(observed.z)} 28V157"/><text x="${Math.max(left + 50, Math.min(right - 50, x(observed.z)))}" y="17" text-anchor="middle">Observed z: ${fmt(observed.z)}</text>` : ""}
    <text x="${width / 2}" y="249" text-anchor="middle">z = estimate / standard error</text>
  </svg>`;
}
