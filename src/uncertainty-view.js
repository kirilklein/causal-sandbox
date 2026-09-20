import { normalDensity, normalInference } from "./uncertainty.js";

export const fmt = (value) => value.toFixed(2).replace(/^-0\.00$/, "0.00");
// Keep a small nonzero bound visibly distinct from zero when reading a test.
export const fmtBound = (value) =>
  value !== 0 && Math.abs(value) < 0.005 ? value.toPrecision(2) : fmt(value);
export const pLabel = (p) => (p < 0.0001 ? "< 0.0001" : p.toFixed(4));

export function estimatePlot(
  result,
  { width = 700, domain = [-1, 5], truth = false } = {},
) {
  if (result.status !== "ok") return `<p>Unavailable: ${result.reason}</p>`;
  const left = 28,
    right = width - 28;
  const x = (value) =>
    left +
    ((Math.max(domain[0], Math.min(domain[1], value)) - domain[0]) /
      (domain[1] - domain[0])) *
      (right - left);
  const labelX = Math.max(68, Math.min(width - 68, x(result.estimate)));
  return `<svg class="inference-chart estimate-chart" viewBox="0 0 ${width} 174" role="img" aria-label="Estimate ${fmt(result.estimate)}; 95% confidence interval ${fmtBound(result.lower)} to ${fmtBound(result.upper)} outcome units${truth ? `; true effect ${fmt(result.truth)}` : ""}.">
    <path class="inference-grid" d="M${left} 82H${right}"/>
    <path class="inference-grid" d="M${x(0)} 58V98"/>
    <text x="${x(0)}" y="115" text-anchor="middle">0</text>
    ${truth ? `<path class="inference-truth" d="M${x(result.truth)} 42V145"/><text x="${Math.max(60, Math.min(width - 60, x(result.truth)))}" y="164" text-anchor="middle">Truth: ${fmt(result.truth)}</text>` : ""}
    <g class="inference-interval"><path d="M${x(result.lower)} 75V89M${x(result.lower)} 82H${x(result.upper)}M${x(result.upper)} 75V89"/><circle cx="${x(result.estimate)}" cy="82" r="5"/>${result.lower < domain[0] ? `<path d="m${left + 5} 77-5 5 5 5"/>` : ""}${result.upper > domain[1] ? `<path d="m${right - 5} 77 5 5-5 5"/>` : ""}</g>
    <text class="estimate-label" x="${labelX}" y="26" text-anchor="middle">Estimate ${fmt(result.estimate)}</text>
    <path class="inference-observed" d="M${x(result.estimate)} 37V69"/>
    <text x="${width / 2}" y="140" text-anchor="middle">95% interval: ${fmtBound(result.lower)} to ${fmtBound(result.upper)}</text>
  </svg>`;
}

export function resampleTrace(rows, counts) {
  return `<div class="resample-trace" aria-label="First 6 of ${rows.length} participants: original copy and copies in one resample">${rows
    .slice(0, 6)
    .map(
      (row, i) =>
        `<div class="resample-person" data-person="${i + 1}" data-copies="${counts ? counts[i] : "unknown"}"><span class="small">Person ${i + 1}</span><div class="person-copies"><span class="person-token arm-${row.A}">${i + 1}</span><span aria-hidden="true">→</span><span class="resampled-copies">${counts ? (counts[i] ? Array.from({ length: counts[i] }, () => `<span class="person-token arm-${row.A}">${i + 1}</span>`).join("") : '<span class="person-omitted" aria-label="Not selected">×</span>') : '<span class="person-pending">?</span>'}</span></div></div>`,
    )
    .join("")}</div>`;
}

export function assignmentGraph(confounded) {
  return `<svg class="inference-chart assignment-chart" viewBox="0 0 330 116" role="img" aria-label="${confounded ? "Risk score affects both treatment and outcome: confounding." : "Risk score affects outcome, but treatment is randomized."}">
    <defs><marker id="assignment-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z"/></marker></defs>
    <g class="assignment-edges" marker-end="url(#assignment-arrow)"><path d="M78 82H245"/><path d="M181 37L250 70"/>${confounded ? '<path d="M148 37L80 70"/>' : ""}</g>
    <circle class="node-c" cx="165" cy="27" r="20"/><circle class="node-a" cx="58" cy="82" r="20"/><circle class="node-y" cx="272" cy="82" r="20"/>
    <text x="165" y="31" text-anchor="middle">C</text><text x="58" y="86" text-anchor="middle">A</text><text x="272" y="86" text-anchor="middle">Y</text>
    <text x="204" y="22">Risk score</text><text x="58" y="114" text-anchor="middle">Treatment</text><text x="272" y="114" text-anchor="middle">Outcome</text>
  </svg>`;
}

export const openingExamples = [
  normalInference(0.2, 0.05),
  normalInference(1, 0.7),
];

export function openingPlot(stage, width = 700) {
  const left = 24,
    right = width - 24;
  const x = (value) => left + ((value + 0.5) / 3) * (right - left);
  const showIntervals = stage === 2;
  return `<svg class="inference-chart opening-chart" viewBox="0 0 ${width} 244" role="img" aria-label="${showIntervals ? "Study A: estimate 0.20, 95% interval 0.10 to 0.30 excludes zero. Study B: estimate 1.00, interval -0.37 to 2.37 includes zero." : `Effect estimate A: 0.20${stage ? "; effect estimate B: 1.00" : ""}. Uncertainty has not been shown.`}">
    <path class="inference-zero" d="M${x(0)} 35V208"/>
    ${openingExamples
      .slice(0, stage ? 2 : 1)
      .map((result, i) => {
        const y = 65 + i * 105;
        return `<g class="opening-study" data-study="${i}" data-zero="${showIntervals ? (result.lower <= 0 && result.upper >= 0 ? "included" : "excluded") : "unknown"}">
        <text x="${right}" y="${y - 27}" text-anchor="end">Study ${i ? "B" : "A"} · +${fmt(result.estimate)}</text>
        ${showIntervals ? `<path class="opening-interval" d="M${x(result.lower)} ${y - 5}V${y + 5}M${x(result.lower)} ${y}H${x(result.upper)}M${x(result.upper)} ${y - 5}V${y + 5}"/><text x="${right}" y="${y + 26}" text-anchor="end">95% CI: ${fmtBound(result.lower)} to ${fmtBound(result.upper)}</text>` : ""}
        <circle class="opening-estimate" cx="${x(result.estimate)}" cy="${y}" r="5"/>
      </g>`;
      })
      .join("")}
    ${[0, 1, 2].map((value) => `<text x="${x(value)}" y="224" text-anchor="middle">${value}</text>`).join("")}
    <text x="${width / 2}" y="243" text-anchor="middle">Effect estimate · 0 means no effect</text>
  </svg>`;
}

export function bootstrapPlot(result, width = 700) {
  const minimum = -1,
    maximum = 5;
  const bins = Array(24).fill(0);
  let outside = 0;
  for (const estimate of result.estimates) {
    if (estimate < minimum || estimate > maximum) {
      outside++;
      continue;
    }
    bins[
      Math.min(
        23,
        Math.floor((24 * (estimate - minimum)) / (maximum - minimum)),
      )
    ]++;
  }
  const left = 30,
    right = width - 18;
  const x = (value) =>
    left +
    ((Math.max(minimum, Math.min(maximum, value)) - minimum) /
      (maximum - minimum)) *
      (right - left);
  const height = (count) => (120 * count) / Math.max(1, ...bins);
  return `<svg class="inference-chart" viewBox="0 0 ${width} 250" data-count="${result.estimates.length}" role="img" aria-label="${result.estimates.length} bootstrap estimates on a fixed -1 to 5 axis. ${outside} outside the axis. Solid line: observed estimate ${fmt(result.observed.estimate)}. Dashed line: causal effect 2.">
    ${bins.map((count, i) => `<rect class="bootstrap-bar" data-count="${count}" x="${left + (i * (right - left)) / 24}" y="${170 - height(count)}" width="${(right - left) / 24 - 1}" height="${height(count)}"><title>${count} resamples: ${fmt(minimum + i / 4)} to ${fmt(minimum + (i + 1) / 4)}</title></rect>`).join("")}
    <path class="inference-observed" d="M${x(result.observed.estimate)} 30V175"/>
    <path class="inference-truth" d="M${x(2)} 30V175"/>
    <circle class="bootstrap-first" cx="${x(result.estimates[0])}" cy="170" r="4"><title>First resample: ${fmt(result.estimates[0])}</title></circle>
    <text x="${left}" y="17">${result.estimates.length} resamples · tallest bar: ${Math.max(...bins)}</text>
    ${[-1, 0, 1, 2, 3, 4, 5].map((value) => `<text x="${x(value)}" y="197" text-anchor="middle">${value}</text>`).join("")}
    <text x="${width / 2}" y="224" text-anchor="middle">Resampled mean difference</text>
    ${outside ? `<text x="${width / 2}" y="248" text-anchor="middle">${outside} outside axis; included in SE</text>` : ""}
  </svg>`;
}

export function intervalPlot(
  studies,
  { truth = false, width = 700, rowGap = 9, maxRows = 50, fixedRows } = {},
) {
  const shown = studies.slice(-maxRows);
  const left = 32,
    right = width - 18;
  const x = (v) =>
    left + ((Math.max(-1, Math.min(5, v)) + 1) / 6) * (right - left);
  const bottom = 38 + (fixedRows ?? shown.length) * rowGap;
  return `<svg class="inference-chart" viewBox="0 0 ${width} ${bottom + 50}" role="img" aria-label="${shown.length === 1 ? "Estimate and 95% confidence interval" : `${shown.length} study estimates and their 95% confidence intervals`}, in outcome units${truth ? "; dashed line is the true effect" : ""}. Each mark has its study values.">
    ${[-1, 0, 1, 2, 3, 4, 5].map((v) => `<path class="inference-grid" d="M${x(v)} 28V${bottom}"/><text x="${x(v)}" y="${bottom + 20}" text-anchor="middle">${v}</text>`).join("")}
    ${truth ? `<path class="inference-truth" d="M${x(shown[0].truth)} 24V${bottom}"/><text x="${x(shown[0].truth)}" y="16" text-anchor="middle">Truth: ${fmt(shown[0].truth)}</text>` : ""}
    ${shown
      .map((s, i) => {
        if (s.status !== "ok") return "";
        const y = 33 + i * rowGap;
        const missed = truth && (s.lower > s.truth || s.upper < s.truth);
        return `<g class="inference-interval${missed ? " missed" : ""}" data-seed="${s.seed}" data-covered="${truth ? !missed : "unknown"}"><title>Study ${s.seed}: ${fmt(s.estimate)}, interval ${fmt(s.lower)} to ${fmt(s.upper)}${truth ? (missed ? "; misses truth" : "; covers truth") : ""}</title><path d="M${x(s.lower)} ${y}H${x(s.upper)}"/><circle cx="${x(s.estimate)}" cy="${y}" r="${shown.length === 1 ? 4 : Math.min(2.5, rowGap / 2 - 0.5)}"/>${s.lower < -1 ? `<path d="m${left + 5} ${y - 4}-5 4 5 4"/>` : ""}${s.upper > 5 ? `<path d="m${right - 5} ${y - 4}5 4-5 4"/>` : ""}</g>`;
      })
      .join("")}
    <text x="${width / 2}" y="${bottom + 43}" text-anchor="middle">Outcome difference (treated − untreated)</text>
  </svg>`;
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
  const tailPercent = observed
    ? observed.p * 50 < 0.01
      ? "<0.01"
      : (observed.p * 50).toFixed(2)
    : "";
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
    ${observed ? `<text class="tail-label" x="${left + 30}" y="112" text-anchor="middle">${tailPercent}%</text><text class="tail-label" x="${right - 30}" y="112" text-anchor="middle">${tailPercent}%</text>` : ""}
    ${studies
      .filter((s) => s.status === "ok")
      .map(
        (s, i) =>
          `<circle class="null-dot" cx="${x(s.z)}" cy="${177 + (i % 5) * 6}" r="2.3"><title>Null study ${s.seed}: z = ${fmt(s.z)}</title></circle>`,
      )
      .join("")}
    ${observed ? `<path class="inference-observed" d="M${x(observed.z)} 28V157"/><text x="${Math.max(left + 50, Math.min(right - 50, x(observed.z)))}" y="17" text-anchor="middle">Observed z: ${fmt(observed.z)}</text>` : ""}
    ${observed && Math.abs(observed.z) > 4 ? `<path class="inference-observed" d="m${left + 6} 150-6 5 6 5m${right - left - 12} -10 6 5-6 5"/>` : ""}
    <text x="${width / 2}" y="249" text-anchor="middle">z = estimate / standard error</text>
  </svg>`;
}
