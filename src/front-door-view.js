import { effectComparison } from "./effect-comparison.js";

export const percent = (value) => `${Number((100 * value).toFixed(1))}%`;
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

export function frontDoorGraph({ world = "valid", selection = 0.6, result }) {
  const practiceChange = result.pM[1][1] - result.pM[0][1];
  const passingChange = result.supported
    ? result.response[1] - result.response[0]
    : null;
  const change = (value) =>
    value === null ? "Unavailable" : `${value > 0 ? "+" : ""}${points(value)}`;
  const firstLabel =
    world === "mediator"
      ? ["observed practice", "difference"]
      : ["more regular", "practice"];
  const secondLabel =
    world === "mediator"
      ? ["adjusted association", "still confounded"]
      : world === "support"
        ? ["missing outcome", "comparisons"]
        : ["higher chance", "of passing"];
  const description = `Assumed causal story: tutoring A causes practice M, which causes passing Y. Hidden readiness U causes A and Y. Observed practice change ${change(practiceChange)}; adjusted passing contrast ${change(passingChange)}.${world === "direct" ? " Tutoring also directly affects passing." : ""}${world === "mediator" ? " Readiness also causes practice; the links cannot be interpreted causally." : ""}${selection === 0 ? " Readiness to tutoring is inactive." : ""}`;
  return [false, true]
    .map((mobile) => {
      const id = mobile ? "fd-mobile-arrow" : "fd-desktop-arrow";
      const node = (name, x, y, label, labelY) =>
        `<g><circle cx="${x}" cy="${y}" r="24" fill="var(--node-${name})" ${name === "U" ? 'stroke="var(--text-muted)" stroke-dasharray="4 4"' : ""}/><text x="${x}" y="${y + 6}" text-anchor="middle" class="fd-node-label">${name}</text><text x="${mobile && name !== "U" ? x + 37 : x}" y="${mobile && name !== "U" ? y - 15 : labelY}" text-anchor="${mobile && name !== "U" ? "start" : "middle"}" class="fd-graph-label">${label}</text></g>`;
      const edge = (path, hidden = false, extra = "") =>
        `<path d="${path}" class="fd-edge ${hidden ? "fd-hidden" : ""}" marker-end="url(#${id})" ${extra}/>`;
      const annotation = (x, y, value, lines, link) =>
        `<g class="fd-link-note"><text data-link="${link}" class="fd-link-value ${value === null ? "fd-unavailable" : ""}" x="${x}" y="${y}" text-anchor="${mobile ? "start" : "middle"}">${change(value)}</text>${lines.map((line, i) => `<text class="fd-link-label" x="${x}" y="${y + 22 + i * 17}" text-anchor="${mobile ? "start" : "middle"}">${line}</text>`).join("")}</g>`;
      const graph = mobile
        ? `${edge("M250 181 V71 Q250 55 234 55 H86", true, selection === 0 ? 'opacity="0.35"' : "")}${edge("M278 205 H286 Q298 205 298 217 V339 Q298 355 282 355 H86", true)}${edge("M58 83 V177")}${edge("M58 233 V327")}${world === "direct" ? edge("M30 55 H20 Q12 55 12 63 V347 Q12 355 20 355 H30", false, 'data-edge="direct"') : ""}${world === "mediator" ? edge("M222 205 H86", true, 'data-edge="mediator"') : ""}${node("A", 58, 55, "Tutoring", 19)}${node("M", 58, 205, "Practice", 169)}${node("Y", 58, 355, "Passing", 319)}${node("U", 250, 205, "Readiness", 251)}<text x="250" y="269" text-anchor="middle" class="fd-link-label">hidden</text>${annotation(105, 108, practiceChange, firstLabel, "practice")}${annotation(105, 277, passingChange, secondLabel, "passing")}${world === "direct" ? '<text x="155" y="407" text-anchor="middle" class="fd-link-label">Extra route: hints help passing</text>' : ""}`
        : `${edge("M364 50 Q70 50 70 172", true, selection === 0 ? 'opacity="0.35"' : "")}${edge("M416 50 Q710 50 710 172", true)}${edge("M98 200 H362")}${edge("M418 200 H682")}${world === "direct" ? edge("M70 228 V280 Q70 296 86 296 H694 Q710 296 710 280 V228", false, 'data-edge="direct"') : ""}${world === "mediator" ? edge("M390 78 V172", true, 'data-edge="mediator"') : ""}${node("A", 70, 200, "Tutoring", 247)}${node("M", 390, 200, "Practice", 247)}${node("Y", 710, 200, "Passing", 247)}${node("U", 390, 50, "Readiness · hidden", 12)}${annotation(230, 132, practiceChange, firstLabel, "practice")}${annotation(550, 132, passingChange, secondLabel, "passing")}${world === "direct" ? '<text x="390" y="281" text-anchor="middle" class="fd-link-label">Extra route: hints help passing</text>' : ""}`;
      return `<svg class="${mobile ? "fd-graph-mobile" : "fd-graph-desktop"}" viewBox="${mobile ? "0 0 310 424" : "0 0 780 312"}" role="img" aria-label="${description}"><defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="var(--causal-path)"/></marker></defs>${graph}</svg>`;
    })
    .join("");
}

export function effectCards(result, population, reveal = false) {
  const rows = reveal
    ? [
        ["Observed difference", result.rawEffect, "observed"],
        ["Front-door reconstruction", result.effect, "front-door"],
        ["Simulator truth", population.effect, "truth"],
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
