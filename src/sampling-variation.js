// Plot error in outcome units so the truth line and scale stay fixed across worlds.
export function samplingView(studies, truth) {
  const valid = studies.filter(({ estimate }) => Number.isFinite(estimate));
  const mean = valid.length
    ? valid.reduce((sum, { estimate }) => sum + estimate, 0) / valid.length
    : null;
  const failed = studies.length - valid.length;
  const outside = valid.filter(
    ({ estimate }) => estimate - truth < -0.5 || estimate - truth > 2,
  ).length;
  const x = (error) => 40 + ((error + 0.5) / 2.5) * 260;
  const y = (i) => 36 + (i / Math.max(1, studies.length - 1)) * 120;
  const format = (value) =>
    Number.isFinite(value) ? value.toFixed(3) : "Unavailable";
  const summary = `${studies.length} ${studies.length === 1 ? "study" : "studies"} · Mean estimate: ${format(mean)} · True effect: ${format(truth)}.${failed ? ` ${failed} unavailable; mean uses ${valid.length} available estimates.` : ""}${outside ? ` ${outside} off-scale; triangles mark the plot boundary. Exact values are below.` : ""}`;
  const plot = `<svg viewBox="0 0 320 212" role="img" aria-labelledby="sampling-chart-title sampling-chart-description">
    <title id="sampling-chart-title">Unadjusted differences across repeated studies</title>
    <desc id="sampling-chart-description">Each row is a study. The horizontal axis is the estimate minus the true effect, from -0.5 to 2 outcome units. The dashed line at zero marks truth. Filled dots mark the latest study. ${failed} estimates unavailable; ${outside} off-scale. Exact values follow in Study values.</desc>
    <line class="sampling-truth" x1="${x(0)}" x2="${x(0)}" y1="28" y2="168"/>
    <text x="${x(0)}" y="17" text-anchor="middle">Truth</text>
    <text x="6" y="17">Study</text>
    <text x="22" y="40" text-anchor="end">1</text>
    ${studies.length > 1 ? `<text x="22" y="160" text-anchor="end">${studies.length}</text>` : ""}
    <line class="sampling-axis" x1="40" x2="300" y1="172" y2="172"/>
    ${[-0.5, 0, 0.5, 1, 1.5, 2].map((tick) => `<text x="${x(tick)}" y="187" text-anchor="middle">${tick}</text>`).join("")}
    <text x="170" y="207" text-anchor="middle">Difference from truth (outcome units)</text>
    ${studies
      .map(({ estimate }, i) => {
        const yy = y(i);
        if (!Number.isFinite(estimate))
          return `<text x="170" y="${yy + 4}" text-anchor="middle">Unavailable</text>`;
        const error = estimate - truth;
        const xx = x(Math.max(-0.5, Math.min(2, error)));
        const title = `<title>Study ${i + 1}: ${format(estimate)}; difference ${format(error)}</title>`;
        const dotClass = `sampling-dot${i === studies.length - 1 ? " sampling-current" : ""}`;
        if (error < -0.5 || error > 2) {
          const inward = error < -0.5 ? 7 : -7;
          return `<path class="${dotClass}" d="M${xx} ${yy}l${inward} -4v8Z">${title}</path>`;
        }
        return `<circle class="${dotClass}" cx="${xx}" cy="${yy}" r="3">${title}</circle>`;
      })
      .join("")}
  </svg>`;
  const rows = studies
    .map(
      ({ seed, estimate }, i) =>
        `<tr><th scope="row">${i + 1}</th><td>${seed}</td><td>${format(estimate)}</td><td>${format(Number.isFinite(estimate) ? estimate - truth : null)}</td></tr>`,
    )
    .join("");
  return { plot, summary, rows };
}
