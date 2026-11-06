import { fmt } from "./uncertainty-view.js";

const methodNames = {
  plugIn: "Plug-in",
  inSample: "AIPW score",
  crossFit: "AIPW score, cross-fitted",
};
const signed = (v) => `${v >= 0 ? "+" : "−"}${fmt(Math.abs(v))}`;

// Large: over 5% of the true effect of 2 and beyond simulation noise.
export const isBiased = (s) => Math.abs(s.bias) > Math.max(0.1, 3 * s.mcse);

// One row of study estimates per method on a fixed axis around the truth.
export function estimatorStrips(studies, keys, summary, { width = 700 } = {}) {
  const domain = [1, 3.2],
    left = 16,
    right = width - 16,
    rowHeight = 70,
    top = 28;
  const x = (v) =>
    left +
    ((Math.max(domain[0], Math.min(domain[1], v)) - domain[0]) /
      (domain[1] - domain[0])) *
      (right - left);
  const ok = studies.filter((s) => s.status === "ok");
  const truth = studies[0].truth;
  const bottom = top + keys.length * rowHeight;
  const rows = keys
    .map((key, row) => {
      const y0 = top + row * rowHeight;
      const s = summary[key];
      const large = isBiased(s);
      const dots = ok
        .map((study, i) => {
          const v = study[key].estimate;
          const jitter = ((i * 37) % 17) - 8;
          const off = v < domain[0] || v > domain[1];
          return `<circle class="dml-dot${off ? " off" : ""}" cx="${x(v)}" cy="${y0 + 40 + jitter}" r="2.6"/>`;
        })
        .join("");
      const meanX = x(truth + s.bias);
      const gap = large
        ? `<path class="dml-gap" d="M${x(truth)} ${y0 + 40}H${meanX}"/>`
        : "";
      return `<g class="dml-strip" data-estimator="${key}"><title>${methodNames[key]}: mean ${fmt(truth + s.bias)}, SD ${fmt(s.sd)}</title><text class="dml-strip-label" x="${left}" y="${y0 + 12}">${methodNames[key]}<tspan class="dml-bias${large ? " large" : ""}" dx="10">bias ${signed(s.bias)}</tspan></text>${dots}${gap}<path class="dml-mean${large ? " large" : ""}" d="M${meanX} ${y0 + 26}V${y0 + 54}"/></g>`;
    })
    .join("");
  const ticks = [1, 1.5, 2, 2.5, 3]
    .map(
      (v) =>
        `<text x="${x(v)}" y="${bottom + 16}" text-anchor="middle">${v}</text>`,
    )
    .join("");
  const description = keys
    .map(
      (key) =>
        `${methodNames[key]}: bias ${signed(summary[key].bias)}, SD ${fmt(summary[key].sd)}`,
    )
    .join("; ");
  return `<svg class="inference-chart dml-chart" viewBox="0 0 ${width} ${bottom + 40}" role="img" aria-label="${ok.length} study estimates per method. True effect ${fmt(truth)}. ${description}.">
    <path class="inference-grid" d="M${left} ${bottom}H${right}"/>
    <path class="inference-truth" d="${keys.map((_, row) => `M${x(truth)} ${top + row * rowHeight + 22}V${top + row * rowHeight + 58}`).join("")}"/><text x="${x(truth)}" y="${top - 12}" text-anchor="middle">Truth ${fmt(truth)}</text>
    ${rows}
    ${ticks}
    <text x="${width / 2}" y="${bottom + 34}" text-anchor="middle">Estimated effect</text>
  </svg>`;
}

const armMark = (A, cx, cy, r, extra = "") =>
  A
    ? `<path class="dml-arm-1${extra}" d="M${cx} ${cy - r * 1.2}l${r * 1.1} ${r * 1.9}h${-r * 2.2}Z"/>`
    : `<circle class="dml-arm-0${extra}" cx="${cx}" cy="${cy}" r="${r}"/>`;

// Residual Y − m̂_A(C) against C. In-sample k = 1 collapses every point to 0.
export function residualPlot(data, residuals, { width = 340, label } = {}) {
  const left = 34,
    right = width - 10,
    top = 14,
    bottom = 150,
    limit = 4;
  const x = (c) => left + ((c + 1.8) / 3.6) * (right - left);
  const y = (r) =>
    top +
    ((limit - Math.max(-limit, Math.min(limit, r))) / (2 * limit)) *
      (bottom - top);
  const spread = Math.sqrt(
    residuals.reduce((s, r) => s + r * r, 0) / residuals.length,
  );
  const marks = data
    .map((d, i) => armMark(d.A, x(d.C), y(residuals[i]), 2.2))
    .join("");
  return `<svg class="inference-chart dml-chart" viewBox="0 0 ${width} ${bottom + 34}" role="img" aria-label="${label}: residuals against C for ${data.length} people; root mean square residual ${fmt(spread)}.">
    ${[-4, 0, 4].map((v) => `<path class="inference-grid" d="M${left} ${y(v)}H${right}"/><text x="${left - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join("")}
    ${marks}
    <text x="${(left + right) / 2}" y="${bottom + 18}" text-anchor="middle">Measured C</text>
    <text x="${(left + right) / 2}" y="${bottom + 32}" text-anchor="middle">Residual spread ${fmt(spread)}</text>
  </svg>`;
}

// Which folds train the model and which fold it predicts. Without
// cross-fitting, one model trains on and predicts everyone.
export function foldSchematic(foldSizes, { activeFold, crossFit }) {
  return foldSizes
    .map((size, f) => {
      const role = !crossFit ? "both" : f === activeFold ? "predict" : "train";
      const label = {
        both: "train + predict",
        predict: "predict",
        train: "train",
      }[role];
      return `<div class="dml-block ${role}" role="listitem"><strong>Fold ${f + 1}</strong><span>${size} people</span><em>${label}</em></div>`;
    })
    .join("");
}

// One arm, zoomed to the people nearest the selected person on C. The dashed
// steps are the 1-neighbour fit; the vertical segment is the residual.
export function predictionZoom(
  data,
  row,
  { windowRows, pool, neighbor, heldOut, width = 700 },
) {
  const selected = data[row];
  const shown = windowRows.map((i) => data[i]);
  const cs = shown.map((d) => d.C),
    ys = shown.map((d) => d.Y);
  const [c0, c1] = [Math.min(...cs), Math.max(...cs)];
  const pad = (c1 - c0) * 0.04 || 0.05;
  const [lo, hi] = [c0 - pad, c1 + pad];
  const [y0, y1] = [Math.min(...ys) - 0.6, Math.max(...ys) + 0.6];
  const left = 40,
    right = width - 16,
    top = 16,
    bottom = 236;
  const x = (c) => left + ((c - lo) / (hi - lo)) * (right - left);
  const y = (v) => top + ((y1 - v) / (y1 - y0)) * (bottom - top);
  // 1-NN is piecewise constant, switching halfway between neighbouring
  // training points; build those steps from the training pool in view.
  const steps = pool
    .map((i) => data[i])
    .filter((d) => d.C >= lo - 1 && d.C <= hi + 1)
    .sort((a, b) => a.C - b.C);
  let path = "";
  steps.forEach((d, j) => {
    const from = j === 0 ? lo : (steps[j - 1].C + d.C) / 2;
    const to = j === steps.length - 1 ? hi : (d.C + steps[j + 1].C) / 2;
    const [a, b] = [Math.max(lo, from), Math.min(hi, to)];
    if (b <= a) return;
    path += `${path ? "L" : "M"}${x(a)} ${y(d.Y)}H${x(b)}`;
  });
  const held = new Set(heldOut);
  const people = windowRows
    .filter((i) => i !== row && i !== neighbor)
    .map((i) => {
      const d = data[i];
      return `<circle class="dml-person${held.has(i) ? " held" : ""}" cx="${x(d.C)}" cy="${y(d.Y)}" r="4"/>`;
    })
    .join("");
  const prediction = data[neighbor].Y;
  const residual = selected.Y - prediction;
  const self = neighbor === row;
  const sx = x(selected.C);
  // Label on whichever side of the person has more room.
  const anchor = sx > (left + right) / 2 ? "end" : "start";
  const labelPos = anchor === "end" ? sx - 16 : sx + 16;
  const labelText = self
    ? width < 520
      ? "residual 0.00"
      : "residual 0.00: fit passes through this person"
    : `residual ${fmt(residual)}`;
  return `<svg class="inference-chart dml-chart dml-zoom" viewBox="0 0 ${width} ${bottom + 40}" role="img" aria-label="Zoomed view of the ${shown.length} ${selected.A ? "treated" : "untreated"} people nearest in C. Outcome against C with the one-neighbour fit. The selected person's prediction ${self ? "is their own outcome" : "comes from another fold"}; residual ${fmt(residual)}.">
    <path class="inference-grid" d="M${left} ${bottom}H${right}M${left} ${top}V${bottom}"/>
    <text x="${left - 6}" y="${top + 10}" text-anchor="end">Y</text>
    <path class="dml-fit" d="${path}"/>
    ${people}
    ${self ? "" : `<circle class="dml-person neighbor" cx="${x(data[neighbor].C)}" cy="${y(prediction)}" r="5"><title>Training neighbour: outcome ${fmt(prediction)}</title></circle>`}
    <path class="dml-residual" d="M${sx} ${y(selected.Y)}V${y(prediction)}"/>
    <circle class="dml-person selected${self ? "" : " held"}" cx="${sx}" cy="${y(selected.Y)}" r="5"/>
    <circle class="dml-selected${self ? " self" : ""}" cx="${sx}" cy="${y(selected.Y)}" r="10"/>
    <text class="dml-residual-label" x="${labelPos}" y="${(y(selected.Y) + y(prediction)) / 2 + 4}" text-anchor="${anchor}">${labelText}</text>
    <text x="${(left + right) / 2}" y="${bottom + 22}" text-anchor="middle">Measured C (zoomed)</text>
  </svg>`;
}

// Interval coverage against k on a log axis, most flexible on the left.
export function coverageByFlexibility(points, { width = 700 } = {}) {
  const narrow = width < 520;
  const left = 44,
    right = width - (narrow ? 16 : 130),
    top = 16,
    bottom = 200;
  const ks = points.map((p) => p.k);
  const [lo, hi] = [Math.log(Math.min(...ks)), Math.log(Math.max(...ks))];
  const x = (k) => left + ((Math.log(k) - lo) / (hi - lo)) * (right - left);
  const y = (c) => top + ((1 - c) / 0.5) * (bottom - top);
  const names = {
    inSample: "No cross-fitting",
    crossFit: "Cross-fitted",
  };
  const series = ["inSample", "crossFit"]
    .map((key) => {
      const d = points
        .map((p, i) => `${i ? "L" : "M"}${x(p.k)} ${y(p[key])}`)
        .join("");
      const dots = points
        .map(
          (p) =>
            `<circle cx="${x(p.k)}" cy="${y(p[key])}" r="4"><title>k = ${p.k}: ${Math.round(100 * p[key])}%</title></circle>`,
        )
        .join("");
      const last = points[points.length - 1];
      const label = narrow
        ? ""
        : `<text class="dml-line-label" x="${right + 10}" y="${y(last[key]) + (key === "crossFit" ? -4 : 12)}">${names[key]}</text>`;
      return `<g class="dml-line ${key}" data-series="${key}"><path d="${d}"/>${dots}${label}</g>`;
    })
    .join("");
  const yTicks = [0.5, 0.75, 1]
    .map(
      (c) =>
        `<path class="inference-grid" d="M${left} ${y(c)}H${right}"/><text x="${left - 6}" y="${y(c) + 4}" text-anchor="end">${c * 100}%</text>`,
    )
    .join("");
  const xTicks = ks
    .map(
      (k) =>
        `<text x="${x(k)}" y="${bottom + 16}" text-anchor="middle">${k}</text>`,
    )
    .join("");
  const legend = narrow
    ? `<g class="dml-line inSample"><circle cx="${left + 6}" cy="${bottom + 56}" r="4"/></g><text x="${left + 16}" y="${bottom + 60}">${names.inSample}</text><g class="dml-line crossFit"><circle cx="${left + 150}" cy="${bottom + 56}" r="4"/></g><text x="${left + 160}" y="${bottom + 60}">${names.crossFit}</text>`
    : "";
  const description = ["inSample", "crossFit"]
    .map(
      (key) =>
        `${names[key]}: ${points.map((p) => `k ${p.k} ${Math.round(100 * p[key])}%`).join(", ")}`,
    )
    .join(". ");
  return `<svg class="inference-chart dml-chart" viewBox="0 0 ${width} ${bottom + (narrow ? 70 : 40)}" role="img" aria-label="Share of 95% intervals covering the truth against outcome neighbours k. ${description}.">
    ${yTicks}
    <path class="dml-target" d="M${left} ${y(0.95)}H${right}"/><text x="${left + 4}" y="${y(0.95) - 6}">95% target</text>
    ${series}
    ${xTicks}
    <text x="${(left + right) / 2}" y="${bottom + 34}" text-anchor="middle">Outcome neighbours k (← more flexible)</text>
    ${legend}
  </svg>`;
}

export const undercovers = (s) => s.coverage < 0.9;

export function coverageReadout(summary, key) {
  const rate = Math.round(100 * summary[key].coverage);
  return `<div class="coverage-readout${undercovers(summary[key]) ? " low" : ""}"><strong>${rate}%</strong><span>cover the truth</span><div class="coverage-bar" aria-hidden="true"><span style="width:${rate}%"></span></div></div>`;
}
