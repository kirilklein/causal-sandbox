import { arrowStrength } from "./arrow-strength.js";

export function lessonGraph(
  state,
  { aligned = false, markerId = "lesson-arrow" } = {},
) {
  if (state.level === 7 || state.level === 8)
    return roleGraph(state, aligned, markerId);
  if (state.level === 9) {
    const strength = state.hiddenStrength;
    return `
      <svg viewBox="0 0 540 300" role="img" aria-label="Risk score C is measured before treatment and causes treatment and outcome. Smoking status U is unmeasured and ${strength === 0 ? "currently has no influence; its faded paths are inactive" : "also causes treatment and outcome"}. Treatment causes outcome. Only C is adjusted for.">
        <defs><marker id="${markerId}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8" fill="var(--causal-path)"/></marker></defs>
        <g fill="none" stroke="var(--causal-path)" stroke-width="2" marker-end="url(#${markerId})"><path d="${aligned ? "M220 65L130 123" : "M220 60L100 125"}"/><path d="${aligned ? "M320 65L400 123" : "M320 60L440 125"}"/><path d="M155 145H380"/></g>
        <g data-hidden-paths fill="none" stroke="var(--causal-path)" ${arrowStrength(strength, 2)} stroke-dasharray="6 4" marker-end="url(#${markerId})"><path d="M220 235L100 169"/><path d="M320 235L440 169"/></g>
        <rect x="${aligned ? 170 : 165}" y="${aligned ? 15 : 10}" width="${aligned ? 200 : 210}" height="50" rx="16" fill="var(--node-C)"/><text x="270" y="${aligned ? 46 : 41}">Risk score<tspan class="graph-symbol"> (C)</tspan></text>
        <rect x="15" y="125" width="140" height="42" rx="16" fill="var(--node-A)"/><text x="85" y="152">Treatment<tspan class="graph-symbol"> (A)</tspan></text>
        <rect x="385" y="125" width="140" height="42" rx="16" fill="var(--node-Y)"/><text x="455" y="152">Outcome<tspan class="graph-symbol"> (Y)</tspan></text>
        <rect x="165" y="235" width="210" height="50" rx="16" fill="var(--node-U)" stroke="var(--causal-path)" stroke-dasharray="6 4"/><text x="270" y="266">Smoking status (U)</text>
      </svg><p class="sample-note">Treatment and outcome models: adjusting for C. Dashed paths: unmeasured smoking status. Darker paths mean stronger influence as the slider increases; faint paths at zero are inactive.</p>`;
  }
  const commonCause = state.level > 1;
  const treatmentDescription =
    state.effect === 0
      ? "Treatment has no effect on outcome."
      : "Treatment causes outcome.";
  const description = commonCause
    ? `The risk score causes outcome${state.selection ? " and treatment" : ""}. ${treatmentDescription}`
    : `${treatmentDescription} Treatment is assigned at random.`;
  return `<svg viewBox="0 0 540 ${aligned ? 300 : commonCause ? 190 : 95}" role="img" aria-label="${description}"><defs><marker id="${markerId}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8" fill="var(--causal-path)"/></marker></defs><g fill="none" stroke="var(--causal-path)" stroke-width="2" marker-end="url(#${markerId})"><path d="M155 ${commonCause || aligned ? 145 : 45}H380" ${state.level === 1 ? arrowStrength(state.effect, 4) : ""}/>${commonCause ? `<path d="M320 65L400 123"/><path d="M220 65L130 123" ${[2, 10].includes(state.level) ? arrowStrength(state.selection, state.level === 2 ? 1.2 : 5) : ""}/>` : ""}</g>${commonCause ? '<rect x="170" y="15" width="200" height="50" rx="16" fill="var(--node-C)"/><text x="270" y="46">Risk score<tspan class="graph-symbol"> (C)</tspan></text>' : ""}<rect x="15" y="${commonCause || aligned ? 125 : 25}" width="140" height="42" rx="16" fill="var(--node-A)"/><text x="85" y="${commonCause || aligned ? 152 : 52}">Treatment<tspan class="graph-symbol"> (A)</tspan></text><rect x="385" y="${commonCause || aligned ? 125 : 25}" width="140" height="42" rx="16" fill="var(--node-Y)"/><text x="455" y="${commonCause || aligned ? 152 : 52}">Outcome<tspan class="graph-symbol"> (Y)</tspan></text></svg>${[1, 2, 10].includes(state.level) ? '<p class="sample-note">Darker arrows show stronger influence; faint arrows at zero are inactive. Shading shows magnitude, not sign.</p>' : ""}${state.level >= 3 ? `<p class="sample-note">${state.level === 3 ? "IPW uses C." : "Treatment and outcome models: adjusting for C."}</p>` : ""}`;
}

function roleGraph(state, aligned, markerId) {
  const mediator = state.level === 7;
  const role = mediator ? "Intermediate response" : "Follow-up score";
  const symbol = mediator ? "M" : "K";
  const description = `The risk score causes treatment and outcome. Treatment causes outcome. ${mediator ? "Treatment causes the intermediate response, which causes outcome." : "Treatment and outcome cause the follow-up score; the score causes neither."} We adjust for C${state.postAdjusted ? ` and ${role.toLowerCase()}` : " only"}.`;
  const nodes = aligned
    ? [
        ["C", 170, 15, 200, 50, "Risk score", "var(--node-C)"],
        ["A", 15, 125, 140, 42, "Treatment", "var(--node-A)"],
        ["Y", 385, 125, 140, 42, "Outcome", "var(--node-Y)"],
        [
          symbol,
          170,
          230,
          200,
          64,
          mediator ? "Intermediate|response" : "Follow-up|score",
          `var(--node-${symbol})`,
        ],
      ]
    : mediator
      ? [
          ["C", 170, 16, 200, 48, "Risk score", "var(--node-C)"],
          ["A", 10, 158, 130, 48, "Treatment", "var(--node-A)"],
          ["Y", 400, 158, 130, 48, "Outcome", "var(--node-Y)"],
          ["M", 195, 150, 150, 64, "Intermediate|response", "var(--node-M)"],
        ]
      : [
          ["C", 70, 16, 200, 48, "Risk score", "var(--node-C)"],
          ["A", 10, 158, 130, 48, "Treatment", "var(--node-A)"],
          ["Y", 205, 158, 130, 48, "Outcome", "var(--node-Y)"],
          ["K", 390, 150, 140, 64, "Follow-up|score", "var(--node-K)"],
        ];
  const paths = aligned
    ? [
        "M220 65L130 117",
        "M320 65L400 117",
        "M155 145H377",
        "M85 167L215 226",
        mediator ? "M320 230L445 173" : "M455 167L325 226",
      ]
    : mediator
      ? [
          "M220 64C220 100 75 100 75 136V150",
          "M320 64C320 100 465 100 465 136V150",
          "M140 182H187",
          "M345 182H392",
          "M75 206V228C75 282 465 282 465 228V214",
        ]
      : [
          "M120 64C120 100 75 100 75 136V150",
          "M220 64C220 100 270 100 270 136V150",
          "M140 182H197",
          "M335 182H382",
          "M75 206V228C75 282 460 282 460 236V222",
        ];
  return `<svg class="role-graph" viewBox="0 0 540 ${aligned ? 300 : 290}" role="img" aria-label="${description}">
      <defs><marker id="${markerId}" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto"><path d="M1 1L9 5L1 9Z" fill="var(--causal-path)"/></marker></defs>
      <g fill="none" stroke="var(--causal-path)" stroke-width="1.8" stroke-linecap="butt" marker-end="url(#${markerId})">
        ${paths.map((d) => `<path d="${d}"/>`).join("")}
      </g>
      ${nodes
        .map(([id, x, y, width, height, label, fill]) => {
          const lines = label.split("|");
          return `<rect class="role-node" x="${x}" y="${y}" width="${width}" height="${height}" rx="12" fill="${fill}"/>
          <text x="${x + width / 2}" y="${y + height / 2 + (lines.length === 1 ? 6 : -6)}">${lines[0]}${lines.length > 1 ? `<tspan x="${x + width / 2}" dy="24">${lines[1]}<tspan class="graph-symbol"> (${id})</tspan></tspan>` : `<tspan class="graph-symbol"> (${id})</tspan>`}</text>`;
        })
        .join("")}
    </svg><p class="sample-note">Outcome model: adjusting for C${state.postAdjusted ? ` and ${symbol}` : " only"}. Arrows describe the world and stay fixed.</p>`;
}
