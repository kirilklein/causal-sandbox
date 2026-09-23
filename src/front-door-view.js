import { effectComparison } from "./effect-comparison.js";

export const percent = (value) => `${(100 * value).toFixed(0)}%`;
export const points = (value) =>
  `${(100 * value).toFixed(1).replace(/\.0$/, "")} pp`;

export function frontDoorFormulas() {
  return `<div class="fd-formula-block">
    <h3>Average the within-group responses</h3>
    <div class="fd-formula" role="math" aria-label="r of m equals the sum over a prime of P of Y equals 1 given M equals m and A equals a prime, times P of A equals a prime">
      <math aria-hidden="true"><mi>r</mi><mo stretchy="false">(</mo><mi>m</mi><mo stretchy="false">)</mo><mo>=</mo></math>
      <math aria-hidden="true"><munder><mo>∑</mo><msup><mi>a</mi><mo>′</mo></msup></munder><mi mathvariant="normal">P</mi><mo stretchy="false">(</mo><mi>Y</mi><mo>=</mo><mn>1</mn><mo>∣</mo><mi>M</mi><mo>=</mo><mi>m</mi><mo>,</mo><mi>A</mi><mo>=</mo><msup><mi>a</mi><mo>′</mo></msup><mo stretchy="false">)</mo></math>
      <math aria-hidden="true"><mo>·</mo><mi mathvariant="normal">P</mi><mo stretchy="false">(</mo><mi>A</mi><mo>=</mo><msup><mi>a</mi><mo>′</mo></msup><mo stretchy="false">)</mo></math>
    </div>
    <p>Average the pass rates at practice level <math><mi>m</mi></math> over the population’s tutoring mix. Here <math><msup><mi>a</mi><mo>′</mo></msup></math> ranges over both observed groups.</p>
    <h3>Rebuild the intervention risk</h3>
    <div class="fd-formula" role="math" aria-label="P of Y equals 1 under do A equals a, equals the sum over m of P of M equals m given A equals a, times r of m">
      <math aria-hidden="true"><mi mathvariant="normal">P</mi><mo stretchy="false">(</mo><mi>Y</mi><mo>=</mo><mn>1</mn><mo>∣</mo><mi mathvariant="normal">do</mi><mo stretchy="false">(</mo><mi>A</mi><mo>=</mo><mi>a</mi><mo stretchy="false">)</mo><mo stretchy="false">)</mo><mo>=</mo></math>
      <math aria-hidden="true"><munder><mo>∑</mo><mi>m</mi></munder><mi mathvariant="normal">P</mi><mo stretchy="false">(</mo><mi>M</mi><mo>=</mo><mi>m</mi><mo>∣</mo><mi>A</mi><mo>=</mo><mi>a</mi><mo stretchy="false">)</mo><mo>·</mo><mi>r</mi><mo stretchy="false">(</mo><mi>m</mi><mo stretchy="false">)</mo></math>
    </div>
    <p>Weight those responses by the practice mix under each tutoring choice. Subtract the risk for <math><mi>a</mi><mo>=</mo><mn>0</mn></math> from the risk for <math><mi>a</mi><mo>=</mo><mn>1</mn></math> to get the total effect.</p>
  </div>`;
}

export function frontDoorModel() {
  const rows = [
    [
      "P of U equals 1 equals 0.5",
      "<mi>U</mi><mo>=</mo><mn>1</mn>",
      "<mn>0.5</mn>",
    ],
    [
      "P of A equals 1 given U equals 0.5 plus s times U minus 0.5",
      "<mi>A</mi><mo>=</mo><mn>1</mn><mo>∣</mo><mi>U</mi>",
      "<mn>0.5</mn><mo>+</mo><mi>s</mi><mo>(</mo><mi>U</mi><mo>−</mo><mn>0.5</mn><mo>)</mo>",
    ],
    [
      "P of M equals 1 given A equals 0.2 plus 0.5 A",
      "<mi>M</mi><mo>=</mo><mn>1</mn><mo>∣</mo><mi>A</mi>",
      "<mn>0.2</mn><mo>+</mo><mn>0.5</mn><mi>A</mi>",
    ],
    [
      "P of Y equals 1 given M and U equals 0.1 plus 0.4 M plus 0.3 U",
      "<mi>Y</mi><mo>=</mo><mn>1</mn><mo>∣</mo><mi>M</mi><mo>,</mo><mi>U</mi>",
      "<mn>0.1</mn><mo>+</mo><mn>0.4</mn><mi>M</mi><mo>+</mo><mn>0.3</mn><mi>U</mi>",
    ],
  ];
  return `<div class="fd-model-equations">${rows.map(([label, condition, expression]) => `<div class="fd-formula" role="math" aria-label="${label}"><math aria-hidden="true"><mi mathvariant="normal">P</mi><mo>(</mo>${condition}<mo>)</mo><mo>=</mo></math><math aria-hidden="true">${expression}</math></div>`).join("")}</div>`;
}

export const frontDoorWorlds = {
  valid: {
    label: "Front-door assumptions hold",
    note: "The two steps recover the total effect even as hidden selection changes, because the mediator satisfies the front-door conditions.",
  },
  direct: {
    label: "Add a direct A → Y path",
    note: "Tutoring now also helps outside practice. The reconstruction misses this extra route, so it no longer recovers the total effect.",
  },
  mediator: {
    label: "Let hidden U also cause M",
    note: "Readiness now affects practice and passing. Conditioning on A cannot block M ← U → Y, so the second relationship remains confounded.",
  },
  support: {
    label: "Remove the A/M overlap",
    note: "Only tutored students practice. We never observe either untutored students who practice or tutored students who do not. The required outcome comparisons are missing.",
  },
};

export function frontDoorGraph({
  stage = 0,
  world = "valid",
  selection = 0.6,
} = {}) {
  const node = (name, x, y) =>
    `<g><circle cx="${x}" cy="${y}" r="23" fill="var(--node-${name})" ${name === "U" ? 'stroke="var(--text-muted)" stroke-dasharray="4 4"' : ""}/><text x="${x}" y="${y + 6}" text-anchor="middle" class="fd-node-label">${name}</text></g>`;
  const edge = (path, hidden = false, dim = false, extra = "") =>
    `<path d="${path}" class="fd-edge ${hidden ? "fd-hidden" : ""} ${dim ? "fd-dim" : ""}" marker-end="url(#fd-arrow)" ${extra}/>`;
  return `<svg viewBox="0 0 350 240" role="img" aria-label="Assumed causal graph: tutoring A causes practice M, which causes passing Y. Unmeasured readiness U causes A and Y.${world === "direct" ? " A also directly causes Y." : ""}${world === "mediator" ? " U also directly causes M." : ""}${selection === 0 ? " The U to A effect is set to zero." : ""}">
    <defs><marker id="fd-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--causal-path)"/></marker></defs>
    ${edge("M153 54 Q70 50 51 137", true, stage === 1 || selection === 0)}
    ${edge("M197 54 Q280 50 299 137", true, stage === 1)}
    ${edge("M69 160 L149 160", false, stage === 2)}
    ${edge("M199 160 L279 160", false, stage === 1)}
    ${world === "direct" ? edge("M57 181 Q175 260 293 181", false, false, 'data-edge="direct"') : ""}
    ${world === "mediator" ? edge("M175 77 L175 133", true, false, 'data-edge="mediator"') : ""}
    ${node("U", 175, 52)}${node("A", 45, 160)}${node("M", 175, 160)}${node("Y", 305, 160)}
    <text x="175" y="16" text-anchor="middle" class="fd-graph-label">Readiness · unmeasured</text>
    <text x="45" y="200" text-anchor="middle" class="fd-graph-label">Tutoring</text><text x="175" y="200" text-anchor="middle" class="fd-graph-label">Practice</text><text x="305" y="200" text-anchor="middle" class="fd-graph-label">Pass</text>
  </svg>`;
}

export function effectCards(result, population, reveal = false) {
  const rows = reveal
    ? [
        ["True total effect", population.effect, "truth"],
        ["Observed difference", result.rawEffect, "observed"],
        ["Front-door reconstruction", result.effect, "front-door"],
      ]
    : [["Observed difference", result.rawEffect, "observed"]];
  return `<div class="results fd-results" aria-label="Effects in percentage points">${rows
    .map(([label, value, id]) => {
      // Keep the shared error scale in outcome units (risk), not display units (pp).
      const comparison = effectComparison(value, population.effect);
      const error = Number(((value - population.effect) * 100).toFixed(1));
      const difference = Number.isFinite(value)
        ? `${error > 0 ? "+" : ""}${error} pp from truth`
        : comparison.difference;
      return `<div class="result ${id === "truth" ? "fd-truth" : "fd-estimate"}" style="--error-tint:${reveal ? comparison.tint : 0}%"><span>${label}</span><strong data-effect="${id}">${Number.isFinite(value) ? `${value > 0 ? "+" : ""}${points(value)}` : "Unavailable"}</strong>${reveal && id !== "truth" ? `<span class="effect-difference">${difference}</span>` : ""}</div>`;
    })
    .join(
      "",
    )}</div>${reveal ? '<p class="small">Redder boxes mean farther from simulator truth. Real studies do not reveal that truth.</p>' : ""}`;
}
