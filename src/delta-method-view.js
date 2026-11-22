import { orderRatioApproximation, ratioTruth } from "./delta-method.js";

export const number = (value) => value.toFixed(2).replace(/^-0\.00$/, "0.00");
const path = (points) =>
  points
    .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
const grid = (fn, from, to, count = 240) =>
  Array.from({ length: count + 1 }, (_, i) =>
    fn(from + ((to - from) * i) / count),
  );

export function transformationPlots(
  mean,
  sd,
  stage,
  point = mean,
  width = 700,
) {
  const tangentVisible = stage >= 3;
  const model = orderRatioApproximation(mean, sd);
  const { lo, hi } = model;
  const height = width < 500 ? 390 : 470;
  const axisX = width * 0.32;
  const axisY = height - 130;
  const left = axisX + 18;
  const right = width - 16;
  const outputBase = axisX - 42;
  const outputWidth = outputBase - 10;
  const x = (v) => left + ((v - lo) / (hi - lo)) * (right - left);
  const ymax = model.transform(lo) * 1.06;
  // The curve and the sideways output density share this exact output scale.
  const y = (v) => axisY - (v / ymax) * (axisY - 48);
  const outLo = Math.min(model.transform(hi), model.tangent(hi));
  const outHi = model.transform(lo);
  const peak = Math.max(
    ...grid(
      (v) => Math.max(model.density(v), model.tangentDensity(v)),
      outLo,
      outHi,
      600,
    ),
  );
  const outputPath = (density) =>
    path(
      grid(
        (v) => [outputBase - (outputWidth * density(v)) / peak, y(v)],
        outLo,
        outHi,
        600,
      ),
    );
  const inputBase = axisY + 88;
  const inputPath = path(
    grid(
      (v) => [
        x(v),
        inputBase - (42 * model.inputDensity(v)) / model.inputDensity(mean),
      ],
      lo,
      hi,
    ),
  );
  const inputs = stage === 0 ? [point] : [mean - sd, mean, mean + sd];
  const guides = inputs
    .map((input) => {
      const output = model.transform(input);
      return `<g class="dm-mapping" data-input="${input}" data-output="${output}">
      <path class="dm-guide" d="M${x(input)} ${stage >= 1 ? inputBase : axisY}V${y(output)}H${axisX}"/>
      <circle class="dm-point" cx="${x(input)}" cy="${y(output)}" r="4"><title>${number(input)} orders per visitor → €${number(output)} per order</title></circle>
    </g>`;
    })
    .join("");
  return `<svg class="dm-chart dm-transformation" viewBox="0 0 ${width} ${height}" role="img" aria-label="Revenue per order equals 20 divided by average orders per visitor. Horizontal axis: estimated orders per visitor, centered at ${number(mean)} with standard error ${number(sd)}. Vertical axis: euros per order. Revenue is held at 20 euros per visitor.${stage >= 2 ? ` The output distribution on the left shares the curve’s vertical scale and is right-skewed. Actual standard error ${number(model.exactSD)}.` : ""}${tangentVisible ? ` Dashed tangent and its symmetric output approximation. Tangent slope ${number(model.slope)}; approximate standard error ${number(model.sd)}.` : ""}">
    <text x="10" y="20">${stage >= 2 ? "Output" : "Revenue"}</text>
    <text x="10" y="37">€ / order</text>
    <text x="${left}" y="20">Ratio · y = 20/x</text>
    <path class="dm-coordinate-axis" d="M${axisX} 44V${axisY}H${right + 6}"/>
    ${[0, model.center, model.transform(lo)].map((v) => `<path class="dm-axis" d="M${axisX - 4} ${y(v)}H${axisX + 4}"/><text x="${axisX - 8}" y="${y(v) + 4}" text-anchor="end">${number(v)}</text>`).join("")}
    ${stage >= 2 ? `<path class="dm-output dm-exact" d="${outputPath(model.density)}"/>` : ""}
    ${tangentVisible ? `<path class="dm-approx" d="${outputPath(model.tangentDensity)}"/>` : ""}
    ${stage >= 1 ? `<path class="dm-input dm-input-bell" d="${inputPath}"/>` : ""}
    ${stage === 0 || stage >= 2 ? guides : ""}
    <path class="dm-exact" d="${path(grid((v) => [x(v), y(model.transform(v))], lo, hi))}"/>
    ${
      tangentVisible
        ? `<path class="dm-approx" d="${path([
            [x(lo), y(model.tangent(lo))],
            [x(hi), y(model.tangent(hi))],
          ])}"/>`
        : ""
    }
    ${[-1, 0, 1].map((z) => `<text x="${x(mean + z * sd)}" y="${axisY + (width < 500 && z === 0 ? 34 : 20)}" text-anchor="middle">${number(mean + z * sd)}</text>`).join("")}
    <text x="${(left + right) / 2}" y="${height - 22}" text-anchor="middle">${stage >= 1 ? "Input · orders / visitor" : "Orders / visitor"}</text>
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
