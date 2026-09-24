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

export function studyDotOffsets(values, [min, max]) {
  const offsets = values.map(() => null);
  const placed = [];
  const spacing = 5.5;
  // Pack on a shared reference width without changing any horizontal value.
  const points = values
    .map((value, index) => ({ value, index }))
    .filter(({ value }) => Number.isFinite(value))
    .sort((a, b) => a.value - b.value);
  for (const { value, index } of points) {
    const x = (552 * (value - min)) / (max - min);
    const neighbors = placed.filter((point) => x - point.x < spacing);
    const candidates = [0];
    for (const point of neighbors) {
      const dy = Math.sqrt(spacing ** 2 - (x - point.x) ** 2);
      candidates.push(point.y - dy, point.y + dy);
    }
    candidates.sort((a, b) => Math.abs(a) - Math.abs(b));
    const y = candidates.find((candidate) =>
      neighbors.every(
        (point) =>
          (x - point.x) ** 2 + (candidate - point.y) ** 2 >=
          spacing ** 2 - 1e-8,
      ),
    );
    if (y === undefined) throw new Error("Could not place study dot");
    offsets[index] = y;
    placed.push({ x, y });
  }
  return offsets;
}

export function studyDistributions(values, stats, names, start) {
  const [min, max] = studyPlotDomain(values);
  const x = (value) => 4 + (92 * (value - min)) / (max - min);
  const offsets = values.map((arm) =>
    arm.map((studies) => studyDotOffsets(studies, [min, max])),
  );
  const tallest = Math.max(
    1,
    ...offsets.flat(2).filter(Number.isFinite).map(Math.abs),
  );
  const verticalScale = Math.min(1, 26 / tallest);
  const spreadChange = (k) => {
    const before = stats[0][k].sd,
      after = stats[1][k].sd;
    if (!Number.isFinite(before) || !Number.isFinite(after) || before <= 0)
      return "Spread comparison unavailable.";
    const percent = Math.round(100 * (after / before - 1));
    return percent === 0
      ? "Nearly the same spread (SD)."
      : `${Math.abs(percent)}% ${percent > 0 ? "more" : "less"} spread with Z (SD).`;
  };
  const axis = `<svg class="study-axis" height="40" aria-hidden="true">${Array.from(
    { length: 5 },
    (_, i) => {
      const value = min + (i * (max - min)) / 4;
      return `<line x1="${x(value)}%" x2="${x(value)}%" y1="0" y2="5"/><text x="${x(value)}%" y="21" text-anchor="${i === 0 ? "start" : i === 4 ? "end" : "middle"}">${Number(value.toFixed(3))}</text>`;
    },
  ).join(
    "",
  )}<text x="50%" y="38" text-anchor="middle">Estimated treatment effect</text></svg>`;
  const plots = names.map(
    (
      name,
      k,
    ) => `<section class="study-method" aria-label="${name} study estimates">
    <h4>${name}</h4>
    <p class="study-spread-change study-summary">${spreadChange(k)}</p>
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
              const y = 35 + offsets[j][k][i] * verticalScale;
              return `<circle class="study-dot" cx="${x(value)}%" cy="${y}" r="2.5" style="--study-order:${i}" data-estimate="${value}"><title>Study ${start + i}: ${value.toFixed(3)}</title></circle>`;
            })
            .join("")}
          ${range ? `<g class="study-range" data-low="${range[0]}" data-high="${range[1]}"><title>Middle 90% of study estimates: ${interval}</title><line x1="${x(range[0])}%" x2="${x(range[1])}%" y1="79" y2="79"/><line x1="${x(range[0])}%" x2="${x(range[0])}%" y1="74" y2="84"/><line x1="${x(range[1])}%" x2="${x(range[1])}%" y1="74" y2="84"/></g>` : ""}
        </svg>
      </div>`;
      })
      .join("")}
    ${axis}
  </section>`,
  );
  return `<div class="study-distributions">${plots[0]}${plots.length > 1 ? `<details id="study-other-methods" class="study-summary"><summary>Compare other estimators</summary>${plots.slice(1).join("")}</details>` : ""}</div>`;
}
