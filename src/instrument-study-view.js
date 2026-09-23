export function studyRange(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const percentile = (p) => {
    const index = (sorted.length - 1) * p;
    const lower = Math.floor(index);
    return (
      sorted[lower] +
      (sorted[Math.ceil(index)] - sorted[lower]) * (index - lower)
    );
  };
  return [percentile(0.05), percentile(0.95)];
}

export function studyPlotDomain(values) {
  // Keep the introductory axis stable; expand only to retain outlying estimates.
  const distance = Math.max(
    0.25,
    ...values
      .flat(2)
      .filter(Number.isFinite)
      .map((v) => Math.abs(v - 2)),
  );
  const radius = Math.ceil(distance / 0.25) * 0.25;
  return [2 - radius, 2 + radius];
}

export function studyDistributions(values, stats, names, start) {
  const [min, max] = studyPlotDomain(values);
  const x = (value) => 4 + (92 * (value - min)) / (max - min);
  const axis = `<svg class="study-axis" height="40" aria-hidden="true">${Array.from(
    { length: 5 },
    (_, i) => {
      const value = min + (i * (max - min)) / 4;
      return `<line x1="${x(value)}%" x2="${x(value)}%" y1="0" y2="5"/><text x="${x(value)}%" y="21" text-anchor="${i === 0 ? "start" : i === 4 ? "end" : "middle"}">${Number(value.toFixed(3))}</text>`;
    },
  ).join(
    "",
  )}<text x="50%" y="38" text-anchor="middle">Estimated treatment effect</text></svg>`;
  return `<div class="study-distributions">${names
    .map(
      (
        name,
        k,
      ) => `<section class="study-method" aria-label="${name} study estimates">
    <h4>${name}</h4>
    ${["Without Z", "With Z"]
      .map((label, j) => {
        const estimates = values[j][k];
        const summary = stats[j][k];
        const range = studyRange(estimates);
        const interval = range
          ? `${range[0].toFixed(3)} to ${range[1].toFixed(3)}`
          : "unavailable";
        return `<div class="study-row ${j ? "with-z" : "without-z"}">
        <div class="study-row-label"><span>${label}</span><span class="study-sd">SD ${Number.isFinite(summary.sd) ? summary.sd.toFixed(3) : "unavailable"}</span></div>
        <svg class="study-cloud" height="90" role="img" aria-label="${name}, ${label}: ${summary.count} study estimates; middle 90% ${interval}; true effect 2." data-min="${min}" data-max="${max}">
          <line class="study-truth" x1="${x(2)}%" x2="${x(2)}%" y1="0" y2="90"/>
          ${estimates
            .map((value, i) => {
              if (!Number.isFinite(value)) return "";
              // Deterministic vertical spacing separates studies; only x encodes an estimate.
              const y =
                9 +
                52 *
                  (((i * 73) % estimates.length) /
                    Math.max(1, estimates.length - 1));
              return `<circle class="study-dot" cx="${x(value)}%" cy="${y}" r="2.5" data-estimate="${value}"><title>Study ${start + i}: ${value.toFixed(3)}</title></circle>`;
            })
            .join("")}
          ${range ? `<g class="study-range" data-low="${range[0]}" data-high="${range[1]}"><title>Middle 90% of study estimates: ${interval}</title><line x1="${x(range[0])}%" x2="${x(range[1])}%" y1="79" y2="79"/><line x1="${x(range[0])}%" x2="${x(range[0])}%" y1="74" y2="84"/><line x1="${x(range[1])}%" x2="${x(range[1])}%" y1="74" y2="84"/></g>` : ""}
        </svg>
      </div>`;
      })
      .join("")}
    ${axis}
  </section>`,
    )
    .join("")}</div>`;
}
