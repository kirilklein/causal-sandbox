const signed = (n) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n)}`;

export function didChart({ world, estimate, step, showTruth, width }) {
  const {
    treatedBefore: a0,
    treatedAfter: a1,
    comparisonBefore: b0,
    comparisonAfter: b1,
  } = world.observed;
  const height = width < 500 ? 340 : 390;
  const top = 40;
  const bottom = height - 44;
  const left = 40;
  const after = width - 104;
  const before = step === 5 ? left + ((after - left) * 2) / 3 : left + 16;
  const start = (before + after) / 2;
  const y = (value) => bottom - (value / 100) * (bottom - top);
  const text = (x, position, content, extra = "") =>
    `<text x="${x}" y="${position}" ${extra}>${content}</text>`;
  const path = (values, xs, cls) =>
    `<path class="did-line ${cls}" d="${values.map((value, i) => `${i ? "L" : "M"}${xs[i]} ${y(value)}`).join(" ")}"/>`;
  const triangle = (x, value, cls = "") =>
    `<path class="did-point did-a ${cls}" d="M${x} ${y(value) - 6}l6 11h-12z"/>`;
  const circle = (x, value) =>
    `<circle class="did-point did-b" cx="${x}" cy="${y(value)}" r="5"/>`;
  const xs =
    step === 5 ? [left, (left + before) / 2, before, after] : [before, after];
  const a = step === 5 ? [...world.treated, a1] : [a0, a1];
  const b = step === 5 ? [...world.comparison, b1] : [b0, b1];
  const endpoints = [{ value: a1, title: `A ${a1}%`, cls: "did-a" }];
  if (step > 0) endpoints.push({ value: b1, title: `B ${b1}%`, cls: "did-b" });
  if (step >= 2)
    endpoints.push({
      value: estimate.counterfactual,
      title: `Assumed ${estimate.counterfactual}%`,
      cls: "did-assumed-label",
    });
  if (step >= 4 && showTruth)
    endpoints.push({
      value: world.truth.untreatedAfter,
      title: "A without",
      subtitle: `program: ${world.truth.untreatedAfter}%`,
      cls: "did-truth-label",
    });
  endpoints.sort((a, b) => b.value - a.value);
  let previous = top - 24;
  const labels = endpoints
    .map(({ value, title, subtitle, cls }) => {
      const position = Math.max(y(value) + 4, previous + 23);
      previous = position + (subtitle ? 15 : 0);
      return `<path class="did-label-leader ${cls}" d="M${after + 7} ${y(value)}L${after + 14} ${position - 4}"/>${text(after + 18, position, title, `class="${cls}"`)}${subtitle ? text(after + 18, position + 15, subtitle, `class="${cls}"`) : ""}`;
    })
    .join("");
  const description = `Hospital A: ${a0}% at baseline, ${a1}% at follow-up.${step > 0 ? ` Hospital B: ${b0}% at baseline, ${b1}% at follow-up.` : ""}${step >= 2 ? ` Assumed Hospital A without program: ${estimate.counterfactual}%.` : ""}${step >= 3 ? ` DiD estimate: ${signed(estimate.effect)} percentage points.` : ""}${step >= 4 && showTruth ? ` Simulator-known Hospital A without program: ${world.truth.untreatedAfter}%. True program effect: +15 percentage points.` : ""}${step === 5 ? ` Earlier rates for A: ${world.treated.join(", ")}%. For B: ${world.comparison.join(", ")}%.` : ""}`;
  return `<svg class="did-chart" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="did-chart-title did-chart-description">
    <title id="did-chart-title">Recovery before and after the care program</title><desc id="did-chart-description">${description}</desc>
    <rect class="did-post-area" x="${start}" y="${top}" width="${after - start}" height="${bottom - top}"/>
    ${[0, 20, 40, 60, 80, 100].map((value) => `<path class="did-grid" d="M${left} ${y(value)}H${after}"/>${text(left - 9, y(value) + 4, value, 'class="did-axis" text-anchor="end"')}`).join("")}
    ${text(left, 19, "Recovery (%)", 'class="did-axis-title"')}
    <path class="did-program-line" d="M${start} ${top}V${bottom}"/>
    ${text(start, 35, "Program starts", 'class="did-axis" text-anchor="middle"')}
    ${step === 5 ? `${text(left, bottom + 26, "−2", 'class="did-axis" text-anchor="middle"')}${text(xs[1], bottom + 26, "−1", 'class="did-axis" text-anchor="middle"')}` : ""}
    ${text(before, bottom + 26, "Baseline", 'class="did-axis" text-anchor="middle"')}${text(after + 3, bottom + 26, "Follow-up", 'class="did-axis" text-anchor="start"')}
    ${step >= 2 ? `<g class="did-counterfactual">${path([a0, estimate.counterfactual], [before, after], "did-assumed")}${triangle(after, estimate.counterfactual, "did-hollow")}</g>` : ""}
    ${step >= 4 && showTruth ? `${path([a0, world.truth.untreatedAfter], [before, after], "did-truth-line")}<rect class="did-truth-point" x="${after - 8}" y="${y(world.truth.untreatedAfter) - 8}" width="16" height="16"/>` : ""}
    ${step > 0 ? `${path(b, xs, "did-b")}${b.map((value, i) => circle(xs[i], value)).join("")}` : ""}
    ${path(a, xs, "did-a")}${a.map((value, i) => triangle(xs[i], value)).join("")}
    ${step < 5 ? text(before, y(a0) + 25, `${a0}%`, 'class="did-a" text-anchor="middle"') : ""}
    ${step > 0 && step < 5 ? text(before, y(b0) - 13, `${b0}%`, 'class="did-b" text-anchor="middle"') : ""}
    ${step === 2 ? `<g class="did-transfer">${path([b0, b1], [before, after], "did-copy-change")}</g>` : ""}
    ${step >= 3 ? `<path class="did-effect-bracket" d="M${after - 17} ${y(a1)}h-8V${y(estimate.counterfactual)}h8"/>${text(after - 33, (y(a1) + y(estimate.counterfactual)) / 2 + 5, `DiD ${signed(estimate.effect)} pp`, 'class="did-effect-label" text-anchor="end"')}` : ""}
    ${labels}
    <style>.did-transfer { --did-shift: ${y(a0) - y(b0)}px; }</style>
  </svg>`;
}
