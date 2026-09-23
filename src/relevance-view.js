import { effectComparison } from "./effect-comparison.js";
import { studySummary } from "./instrument-simulation.js";

export const relevanceScenes = [
  {
    world: "proxy",
    title: "Example: a proxy for hidden fitness",
    measurement: "fitness test",
    story:
      "Underlying fitness is the hidden confounder: it affects both rehabilitation participation and later mobility. The observed fitness test is its proxy: a noisy measurement of that fitness. Clinicians never see the research-only test score, so the score does not determine treatment.",
    question:
      "We cannot adjust for hidden fitness directly. What happens if we adjust for its observed proxy, the fitness test?",
    graphLabel:
      "Unmeasured fitness causes rehabilitation, mobility, and the fitness test score. Rehabilitation causes mobility. The test score has no outgoing arrows.",
    nodes: [
      ["U", "Fitness", 110, 45, true],
      ["V", "Test score", 350, 45],
      ["A", "Rehab", 110, 220],
      ["Y", "Mobility", 350, 220],
    ],
    edges: [
      ["U", "V"],
      ["U", "A"],
      ["U", "Y"],
      ["A", "Y"],
    ],
    expected: "closer",
    takeaway: "The proxy reduces confounding here, but does not remove it.",
    explanation:
      "Adjusting for the test makes the treated and untreated groups more comparable in underlying fitness in this model. The mean estimate moves closer to the true effect. But people with the same test score can still differ in fitness: the proxy is noisy, so confounding remains.",
    limitation:
      "A proxy need not reduce bias in every model. Here, the graph explains the information it carries; the specified simulation shows how much it helps.",
  },
  {
    world: "collider",
    title: "A misleading clue",
    measurement: "research score",
    story:
      "Now transport access determines who enters rehabilitation, while fitness also affects mobility. Researchers combine access and fitness into a baseline score. This score is never used to assign treatment.",
    question:
      "The research score contains information about mobility. Will including it help estimate the program’s effect?",
    graphLabel:
      "Unmeasured transport access causes rehabilitation and the research score. Unmeasured fitness causes mobility and the research score. Rehabilitation causes mobility. The research score is a collider with no outgoing arrows.",
    nodes: [
      ["P", "Access", 100, 40, true],
      ["R", "Fitness", 360, 40, true],
      ["V", "Score", 230, 125],
      ["A", "Rehab", 100, 235],
      ["Y", "Mobility", 360, 235],
    ],
    edges: [
      ["P", "A"],
      ["R", "Y"],
      ["P", "V"],
      ["R", "V"],
      ["A", "Y"],
    ],
    expected: "farther",
    takeaway: "Better prediction can accompany worse causal estimation.",
    explanation:
      "The score is a collider. Among people with the same score, better access tends to imply lower fitness. Adjusting for the score creates a link between treatment and fitness, opening a biasing path to mobility. The score is measured before treatment, but adjustment still harms this comparison.",
    limitation:
      "These effects describe this simulated model. A graph’s adjustment implications require its causal assumptions to be credible.",
  },
];

export const proxyMechanism = {
  ...relevanceScenes[0],
  graphLabel:
    "Hidden confounder U causes treatment, outcome, and observed proxy V. Treatment causes outcome. V carries information about U but does not itself cause treatment or outcome in this graph.",
  nodes: [
    ["U", "Hidden U", 110, 45, true],
    ["V", "Proxy V", 350, 45],
    ["A", "Treatment", 110, 220],
    ["Y", "Outcome", 350, 220],
  ],
};

export function relevanceGraph(scene, markerId = "relevance-arrow") {
  const nodes = new Map(scene.nodes.map((node) => [node[0], node]));
  return `<svg viewBox="0 0 460 280" role="img" aria-label="${scene.graphLabel}">
    <defs><marker id="${markerId}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10Z" /></marker></defs>
    ${scene.edges
      .map(([from, to]) => {
        const [, , x, y, hidden] = nodes.get(from);
        const [, , tx, ty] = nodes.get(to);
        const dx = tx - x,
          dy = ty - y;
        const scale = Math.min(
          dx ? 67 / Math.abs(dx) : Infinity,
          dy ? 27 / Math.abs(dy) : Infinity,
        );
        return `<path class="relevance-edge${hidden ? " hidden-cause" : ""}" data-edge="${from}${to}" d="M${x + dx * scale} ${y + dy * scale}L${tx - dx * scale} ${ty - dy * scale}" marker-end="url(#${markerId})" />`;
      })
      .join("")}
    ${scene.nodes.map(([id, label, x, y, hidden]) => `<g data-node="${id}"><rect x="${x - 64}" y="${y - 25}" width="128" height="50" rx="12" fill="var(--node-${hidden ? "U" : ["A", "Y"].includes(id) ? id : "C"})" class="${hidden ? "hidden-cause" : ""}"/><text x="${x}" y="${y + 7}" text-anchor="middle">${label}</text></g>`).join("")}
  </svg>`;
}

export function relevanceSummaries(studies) {
  return [0, 1].map((i) => ({
    effect: studySummary(studies.map((study) => study.fits[i].effect)),
    prediction: studySummary(studies.map((study) => study.fits[i].rmse)),
  }));
}

export function relevancePlot(studies, included) {
  const summaries = relevanceSummaries(studies);
  const x = (value) => 24 + (Math.max(0, Math.min(5, value)) / 5) * 312;
  const truth = studies[0].truth;
  const arms = included ? [0, 1] : [0];
  const fmt = (value) =>
    Number.isFinite(value) ? value.toFixed(2) : "Unavailable";
  const description = `Each dot is one of ${studies.length} studies; vertical spacing only separates dots. Dashed estimate lines mark means. Without adjustment: mean ${fmt(summaries[0].effect.mean)}, standard deviation ${fmt(summaries[0].effect.sd)}.${included ? ` With adjustment: mean ${fmt(summaries[1].effect.mean)}, standard deviation ${fmt(summaries[1].effect.sd)}.` : " Adjusted estimates have not been revealed."} True effect: ${truth} mobility points. The horizontal scale is fixed from 0 to 5; triangles indicate off-scale estimates.`;
  return `<div role="img" aria-label="${description}">
    ${arms
      .map((arm) => {
        const y = 54;
        return `<div class="relevance-effect-row"><p class="row-label">${arm ? "With adjustment" : "Without adjustment"}</p><svg viewBox="0 0 360 88" aria-hidden="true">
      ${arm === 0 ? `<text class="truth-label" x="${x(truth)}" y="17" text-anchor="middle">True effect</text>` : ""}
      <line class="effect-truth" x1="${x(truth)}" x2="${x(truth)}" y1="${y - 28}" y2="${y + 28}"/>
      ${studies
        .map((study, i) => {
          const value = study.fits[arm].effect;
          const xx = x(value),
            yy = y + ((i % 9) - 4) * 3.5;
          const tint = effectComparison(value, truth).tint;
          const attributes = `class="study-dot" data-study="${i}" data-arm="${arm}" data-estimate="${value}" style="--error-tint:${tint}%"`;
          const title = `<title>Study ${i + 1}, ${arm ? "with" : "without"} measurement: ${fmt(value)} mobility points</title>`;
          return value < 0 || value > 5
            ? `<path ${attributes} d="M${xx} ${yy}l${value < 0 ? 6 : -6} -4v8Z">${title}</path>`
            : `<circle ${attributes} cx="${xx}" cy="${yy}" r="2">${title}</circle>`;
        })
        .join("")}
      <line class="effect-mean" data-arm="${arm}" x1="${x(summaries[arm].effect.mean)}" x2="${x(summaries[arm].effect.mean)}" y1="${y - 28}" y2="${y + 28}"><title>Mean: ${fmt(summaries[arm].effect.mean)}</title></line></svg></div>`;
      })
      .join("")}
    <svg viewBox="0 0 360 26" aria-hidden="true"><line class="effect-axis" x1="24" x2="336" y1="2" y2="2"/>
    ${[0, 1, 2, 3, 4, 5].map((tick) => `<text x="${x(tick)}" y="20" text-anchor="middle">${tick}</text>`).join("")}
  </svg></div>`;
}
