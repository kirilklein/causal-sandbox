import {
  orderRatioApproximation,
  jointRatioApproximation,
  ratioTruth,
} from "./delta-method.js";

export const number = (value) => value.toFixed(2).replace(/^-0\.00$/, "0.00");
const path = (points) =>
  points
    .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
const grid = (fn, from, to, count = 240) =>
  Array.from({ length: count + 1 }, (_, i) =>
    fn(from + ((to - from) * i) / count),
  );

export function transformationPlots(mean, sd, stage, point = mean) {
  const tangentVisible = stage >= 3;
  const model = orderRatioApproximation(mean, sd);
  const { lo, hi } = model;
  const x = (v) => 48 + ((v - lo) / (hi - lo)) * 324;
  const ymax = model.transform(lo);
  const y = (v) => 220 - (v / ymax) * 180;
  const curve = path(grid((v) => [x(v), y(model.transform(v))], lo, hi));
  const guides = (stage === 0 ? [(point - mean) / sd] : [-1, 0, 1])
    .map((z) => {
      const input = mean + z * sd;
      const output = model.transform(input);
      return `<path class="dm-guide" d="M${x(input)} 220V${y(output)}H48"/><circle class="dm-point" cx="${x(input)}" cy="${y(output)}" r="4"><title>${number(input)} orders per visitor → €${number(output)} per order</title></circle>`;
    })
    .join("");
  const inputDensity = path(
    grid(
      (v) => [
        x(v),
        294 - (model.inputDensity(v) / model.inputDensity(mean)) * 40,
      ],
      lo,
      hi,
    ),
  );
  const curveSvg = `<svg class="dm-chart" viewBox="0 0 400 330" role="img" aria-label="Revenue per order equals 20 divided by average orders per visitor. Horizontal axis: estimated orders per visitor, centered at ${number(mean)} with standard error ${number(sd)}. Vertical axis: euros per order. Revenue is held at 20 euros per visitor.${tangentVisible ? ` Tangent slope ${number(model.slope)}.` : ""}">
    <text x="48" y="20">Revenue per order (€) · y = 20/x</text>
    ${[0, model.center, ymax].map((v) => `<path class="dm-axis" d="M48 ${y(v)}H372"/><text x="42" y="${y(v) + 4}" text-anchor="end">${number(v)}</text>`).join("")}
    <path class="dm-exact" d="${curve}"/>
    ${
      tangentVisible
        ? `<path class="dm-approx" d="${path([
            [x(lo), y(model.tangent(lo))],
            [x(hi), y(model.tangent(hi))],
          ])}"/>`
        : ""
    }
    ${stage === 0 || stage >= 2 ? guides : ""}
    ${[-1, 0, 1].map((z) => `<text x="${x(mean + z * sd)}" y="240" text-anchor="middle">${number(mean + z * sd)}</text>`).join("")}
    ${stage >= 1 ? `<path class="dm-input" d="${inputDensity}"/>` : ""}
    <text x="210" y="319" text-anchor="middle">x · Estimated orders per visitor</text>
  </svg>`;
  if (stage < 2) return curveSvg;
  const outLo = Math.min(model.transform(hi), model.tangent(hi));
  const outHi = model.transform(lo);
  const ox = (v) => 48 + ((v - outLo) / (outHi - outLo)) * 324;
  const peak = Math.max(
    ...grid(
      (v) => Math.max(model.density(v), model.tangentDensity(v)),
      outLo,
      outHi,
      600,
    ),
  );
  const oy = (v) => 260 - (205 * v) / peak;
  const distributionSvg = `<svg class="dm-chart" viewBox="0 0 400 330" role="img" aria-label="Horizontal axis: revenue per order in euros. Vertical axis: probability density across repeated studies. The actual ratio distribution is right-skewed.${tangentVisible ? " The tangent approximation is symmetric." : ""} Actual standard error ${number(model.exactSD)}.${tangentVisible ? ` Approximate standard error ${number(model.sd)}.` : ""}">
    <text x="48" y="20">Probability density across studies</text>
    <path class="dm-axis" d="M48 40V260H372"/>
    <path class="dm-exact" d="${path(grid((v) => [ox(v), oy(model.density(v))], outLo, outHi, 600))}"/>
    ${tangentVisible ? `<path class="dm-approx" d="${path(grid((v) => [ox(v), oy(model.tangentDensity(v))], outLo, outHi, 600))}"/>` : ""}
    ${[outLo, (outLo + outHi) / 2, outHi].map((v) => `<text x="${ox(v)}" y="283" text-anchor="middle">${number(v)}</text>`).join("")}
    <text x="210" y="319" text-anchor="middle">Revenue per order (€)</text>
  </svg>`;
  return curveSvg + distributionSvg;
}

export function jointUncertaintyPlot(rho) {
  const model = jointRatioApproximation(rho);
  const x = (orders) => 55 + ((orders - 1.4) / 1.2) * 310;
  const y = (revenue) => 260 - ((revenue - 14) / 12) * 220;
  const contour = grid(
    (angle) => {
      const pair = model.contour(angle);
      return [x(pair.orders), y(pair.revenue)];
    },
    0,
    2 * Math.PI,
  );
  return `<svg class="dm-chart dm-joint-chart" viewBox="0 0 400 330" role="img" aria-label="Joint uncertainty in orders and revenue estimates, correlation ${rho.toFixed(1)}. Approximate ratio standard error ${number(model.se)} euros per order. Moving along a constant-ratio line leaves revenue per order unchanged.">
    <text x="55" y="20">Average revenue (€ / visitor)</text>
    ${[16, 20, 24].map((v) => `<path class="dm-axis" d="M55 ${y(v)}H365"/><text x="45" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join("")}
    ${[8, 10, 12]
      .map((ratio) => {
        const lo = Math.max(1.4, 14 / ratio);
        const hi = Math.min(2.6, 26 / ratio);
        return `<path class="${ratio === 10 ? "dm-exact" : "dm-guide"}" d="M${x(lo)} ${y(lo * ratio)}L${x(hi)} ${y(hi * ratio)}"/><text x="${x(hi) - 4}" y="${y(hi * ratio) - 7}" text-anchor="end">€${ratio} / order</text>`;
      })
      .join("")}
    <path class="dm-input" d="${path(contour)}Z"/>
    <circle class="dm-point" cx="${x(2)}" cy="${y(20)}" r="4"><title>Center: 2 orders and €20 revenue per visitor; €10 per order</title></circle>
    ${[1.6, 2, 2.4].map((v) => `<text x="${x(v)}" y="283" text-anchor="middle">${v}</text>`).join("")}
    <text x="210" y="319" text-anchor="middle">Average orders / visitor</text>
  </svg>`;
}

export function intervalComparison(results, width = 700) {
  const valid = results.filter((r) => r.status === "ok");
  const min = Math.min(0, ratioTruth, ...valid.map((r) => r.lower));
  const max = Math.max(4, ratioTruth, ...valid.map((r) => r.upper));
  const pad = (max - min) * 0.08;
  const x = (value) =>
    30 + ((value - min + pad) / (max - min + 2 * pad)) * (width - 60);
  return `<svg class="dm-chart" viewBox="0 0 ${width} 220" role="img" aria-label="Two nominal 95% intervals for the treatment difference in revenue per order. Dashed vertical line: simulator truth +2.">
    <path class="dm-truth" d="M${x(ratioTruth)} 25V175"/>
    ${results
      .map((result, i) => {
        const label = i ? "Bootstrap percentile" : "Delta normal";
        const y = 65 + 90 * i;
        return `<text x="30" y="${y - 25}">${label}</text>${result.status === "ok" ? `<path class="dm-ci" d="M${x(result.lower)} ${y - 5}V${y + 5}M${x(result.lower)} ${y}H${x(result.upper)}M${x(result.upper)} ${y - 5}V${y + 5}"/><circle class="dm-point" cx="${x(result.estimate)}" cy="${y}" r="4"/>` : `<text x="30" y="${y}">Unavailable</text>`}`;
      })
      .join("")}
    ${[min, (min + max) / 2, max].map((v) => `<text x="${x(v)}" y="193" text-anchor="middle">${number(v)}</text>`).join("")}
    <text x="${width / 2}" y="217" text-anchor="middle">Revenue / order difference · B − A</text>
  </svg>`;
}

export function coveragePlot(studies, method, width = 400) {
  const results = studies.map((s) => s[method]);
  const x = (value) =>
    28 + ((Math.max(-10, Math.min(14, value)) + 10) / 24) * (width - 50);
  return `<svg class="dm-chart" viewBox="0 0 ${width} 370" role="img" aria-label="${studies.length} independent studies, ${method} intervals. Solid intervals contain the true effect; dashed intervals miss it; crosses indicate unavailable intervals. Arrows mark bounds outside the fixed axis.">
    ${[-10, 0, 2, 14].map((v) => `<path class="${v === 2 ? "dm-truth" : "dm-axis"}" d="M${x(v)} 20V325"/><text x="${x(v)}" y="347" text-anchor="middle">${v}</text>`).join("")}
    ${results
      .map((r, i) => {
        const y = 24 + i * 3;
        if (r.status !== "ok")
          return `<path class="dm-missing" d="m8 ${y - 2}4 4m-4 0 4-4"><title>Study ${i + 1}: unavailable. ${r.reason}</title></path>`;
        const covered = r.lower <= ratioTruth && ratioTruth <= r.upper;
        return `<g class="${covered ? "dm-ci" : "dm-miss"}" data-covered="${covered}"><title>Study ${i + 1}: ${number(r.lower)} to ${number(r.upper)}; ${covered ? "contains" : "misses"} truth</title><path d="M${x(r.lower)} ${y}H${x(r.upper)}"/>${r.lower < -10 ? `<path d="m32 ${y - 2}-4 2 4 2"/>` : ""}${r.upper > 14 ? `<path d="m${width - 26} ${y - 2}4 2-4 2"/>` : ""}</g>`;
      })
      .join("")}
    <text x="${width / 2}" y="369" text-anchor="middle">B − A · dashed vertical line: truth +2</text>
  </svg>`;
}
