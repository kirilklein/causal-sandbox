import "./graph-lab.css";
import { automaticPositions, edgeGeometry } from "./graph-layout.js";
import icon from "./brand.svg?raw";
import { themeControl } from "./theme.js";
import { effectComparison } from "./effect-comparison.js";
import { sandboxOverlap } from "./sandbox-overlap.js";
import { graphNode, graphPreset, graphPresets } from "./graph-presets.js";
import {
  validateGraph,
  simulateGraph,
  analyzeGraph,
  graphDescendants,
  graphLimits,
} from "./graph-simulation.js";

const $ = (selector) => document.querySelector(selector);
const escape = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
let preset = graphPreset(new URLSearchParams(location.search).get("preset"));
let graph = structuredClone(preset.graph),
  adjustment = [],
  nextId = 4;
let selection = { kind: "node", id: "A" },
  startingErrors,
  timer;
const indices = [0, 2, 3, 4],
  methods = ["Raw association", "Regression", "IPW", "AIPW"];
let nodePositions = {},
  connectMode = false,
  connectFrom = null,
  drag = null,
  suppressClick = false;
let graphHeight = 400;

$("#app").innerHTML = `
<header class="lab-header"><a class="brand" href="./">${icon}<span>Causal Sandbox</span></a><a href="?sandbox&resume=graph-lab">Return to full sandbox</a>${themeControl()}</header>
<main class="graph-lab">
  <section class="lab-intro"><div class="eyebrow">OPTIONAL WORKSPACE · GRAPH LAB</div><h1>Build a world. Test an estimate.</h1><p>Start with a graph, change its relationships, and compare your analysis with the known effect.</p></section>
  <section class="lab-preset-bar" aria-label="Starting graph"><label>Starting graph<select id="lab-preset">${graphPresets.map((p) => `<option value="${p.id}">${p.name}</option>`).join("")}</select></label><div><h2 id="lab-question"></h2><p id="lab-action"></p></div><button id="lab-reset">Reset graph</button></section>
  <div class="lab-layout">
    <section class="lab-panel lab-editor" aria-label="Graph workspace">
      <div class="lab-panel-heading"><h2>Your causal world</h2><span id="lab-count"></span></div>
      <div class="lab-graph-scroll"><svg id="lab-graph" role="group" aria-label="Editable causal graph"></svg></div>
      <div class="lab-graph-tools"><button id="lab-draw-arrow" aria-pressed="false">Draw arrow</button><button id="lab-arrange">Auto arrange</button></div>
      <p id="lab-graph-help" class="lab-caption" role="status">Drag variables to arrange them. Select a variable or arrow to edit. Dashed = unmeasured.</p>
      <nav class="lab-tabs" aria-label="Experiment controls" role="tablist"><button id="lab-world-tab" role="tab" aria-selected="true" aria-controls="lab-world">World</button><button id="lab-analysis-tab" role="tab" aria-selected="false" aria-controls="lab-analysis" tabindex="-1">Analysis</button><a href="#lab-results">Results ↓</a></nav>
      <div id="lab-world" role="tabpanel" aria-labelledby="lab-world-tab">
        <div class="lab-build"><form id="lab-add-variable"><label>Variable name<input id="lab-new-name" maxlength="16" placeholder="e.g. Age" required></label><button id="lab-add-node">Add variable</button></form><details><summary>Connect using menus</summary><form id="lab-connect"><label>From<select id="lab-from"></select></label><label>To<select id="lab-to"></select></label><button type="submit">Add arrow</button></form></details></div>
        <p id="lab-validation" role="status"></p>
        <div id="lab-inspector"></div>
      </div>
      <div id="lab-analysis" role="tabpanel" aria-labelledby="lab-analysis-tab" hidden>
        <h3>Fitted models</h3>
        <p class="lab-caption">The same adjustment set enters linear outcome regression and logistic treatment regression. Raw association uses neither model.</p>
        <p id="lab-causal-note" class="lab-note"></p>
        <details><summary>What these estimates can tell us</summary><p>All rows are compared with the total effect of A on Y. Adjusting for a mediator or a collider can change the meaning of an estimate; it does not automatically identify a direct effect.</p><p>A valid adjustment set and correctly specified fitted models are separate requirements. These main-effect models may miss the relevant conditional relationships, even though the generating equations are additive. This lab does not certify adjustment sets or perform instrumental-variable estimation.</p></details>
      </div>
    </section>
    <section class="lab-panel" id="lab-results" aria-labelledby="lab-results-heading" tabindex="-1">
      <div class="lab-panel-heading"><h2 id="lab-results-heading">Can we recover the effect?</h2><span id="lab-status"></span></div>
      <div class="lab-truth"><div><span>Known total effect (ATE)</span><small>Set A to 1 versus 0; let downstream variables respond.</small></div><strong id="lab-truth"></strong></div>
      <fieldset class="lab-adjust-controls"><legend>Adjust for</legend><div id="lab-adjustment"></div></fieldset>
      <p id="lab-model-caption" class="lab-caption"></p>
      <div id="lab-estimates" aria-live="polite" aria-atomic="true"></div>
      <p class="lab-caption">○ Starting error · ● Current error. Redder marks are farther from truth. Arrows indicate errors outside ±4.</p>
      <p id="lab-fit-error" class="lab-note" role="status" hidden></p>
      <p id="lab-weight-warning" class="lab-note" role="status" hidden></p>
      <details><summary>Sample and weight diagnostics</summary><div id="lab-diagnostics"></div><p>Propensities are clipped to [0.02, 0.98]. Effective sample size (ESS) describes weight concentration, not regression precision. Clipping and ESS cannot establish causal validity.</p></details>
      <details><summary>How this world generates data</summary><div id="lab-equations"></div><p>Each continuous variable equals its intercept plus its weighted parents plus independent noise. Noise is standard normal or uniform on [−√3, √3], multiplied by its noise scale. A is drawn from a logistic treatment probability; arrows into A change log odds.</p><p>Truth comes from paired interventions using the same noise. A zero-strength arrow has no numerical effect; it remains in the drawing until removed. The graph must remain acyclic even at zero strength.</p></details>
      <p class="lab-sample-note">One fixed sample of 2,400 people · Seed 4217.<br>New graph edits reuse background draws. This is a separate experiment from the lessons and full sandbox.</p>
    </section>
  </div>
</main>`;

function name(id) {
  return graph.nodes.find((node) => node.id === id).label;
}
function options() {
  return graph.nodes
    .map((node) => `<option value="${node.id}">${escape(node.label)}</option>`)
    .join("");
}

function renderGraph() {
  if (!Object.keys(nodePositions).length) arrangeGraph();
  const width = Math.max(
    240,
    Math.floor($(".lab-graph-scroll").getBoundingClientRect().width),
  );
  const height = graphHeight;
  const points = Object.fromEntries(
    graph.nodes.map((node) => {
      const p = nodePositions[node.id];
      return [
        node.id,
        { x: 36 + p.x * (width - 72), y: 40 + p.y * (height - 80) },
      ];
    }),
  );
  const labels = [];
  $("#lab-graph").setAttribute("viewBox", `0 0 ${width} ${height}`);
  $("#lab-graph").innerHTML =
    `<defs><marker id="lab-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8" fill="var(--causal-path)"/></marker></defs>${graph.edges
      .map((edge) => {
        const geometry = edgeGeometry(edge, points, labels, width, height);
        labels.push(geometry.label);
        const hidden = graph.nodes.some(
          (node) => !node.observed && [edge.from, edge.to].includes(node.id),
        );
        const title = `${name(edge.from)} → ${name(edge.to)}: ${edge.weight}${edge.weight === 0 ? " (inactive)" : ""}`;
        return `<g role="button" tabindex="0" aria-label="Edit arrow ${escape(title)}" data-edge="${edge.from}:${edge.to}"><title>${escape(title)}</title><path class="lab-edge-hit" d="${geometry.path}"/><path d="${geometry.path}" class="lab-edge" marker-end="url(#lab-arrow)" opacity="${edge.weight === 0 ? 0.2 : 0.7 + Math.abs(edge.weight) * 0.1}" ${hidden ? 'stroke-dasharray="5 4"' : ""}/><text class="lab-edge-label" text-anchor="middle" dominant-baseline="middle" x="${geometry.label.x}" y="${geometry.label.y}">${edge.weight}</text></g>`;
      })
      .join("")}${graph.nodes
      .map((node) => {
        const p = points[node.id],
          fill =
            node.id === "A"
              ? "A"
              : node.id === "Y"
                ? "Y"
                : node.observed
                  ? "C"
                  : "U";
        return `<g role="button" tabindex="0" aria-label="Edit variable ${escape(node.label)}${node.observed ? "" : ", unmeasured"}" aria-describedby="lab-graph-help" data-node="${node.id}" class="${connectFrom === node.id ? "lab-connect-source" : ""}" transform="translate(${p.x} ${p.y})"><title>${escape(node.label)}</title><circle r="28" fill="var(--node-${fill})" ${node.observed ? "" : 'stroke="var(--causal-path)" stroke-dasharray="4 3"'}/><text text-anchor="middle" y="5" class="lab-node-label">${escape(node.label.length > 5 ? `${node.label.slice(0, 4)}…` : node.label)}</text>${!node.observed ? '<text text-anchor="middle" y="43" class="lab-hidden-label">Unmeasured</text>' : ""}</g>`;
      })
      .join("")}`;
  $("#lab-count").textContent =
    `${graph.nodes.length}/8 variables · ${graph.edges.length}/12 arrows`;
}
function renderInspector() {
  if (selection.kind === "edge") {
    const edge = graph.edges.find((e) => `${e.from}:${e.to}` === selection.id);
    if (!edge) {
      selection = { kind: "node", id: "A" };
      return renderInspector();
    }
    $("#lab-inspector").innerHTML =
      `<div class="lab-inspector-heading"><h3>${escape(name(edge.from))} → ${escape(name(edge.to))}</h3><button id="lab-remove-edge">Remove arrow</button></div><label class="lab-strength">Strength <output id="lab-strength-value">${edge.weight.toFixed(1)}</output><input id="lab-strength" type="range" min="-3" max="3" step="0.1" value="${edge.weight}"></label><p class="lab-caption">${edge.to === "A" ? "Change in treatment log odds per unit of the parent." : "Change per unit of the parent, holding other parents fixed."} Zero makes this arrow inactive.</p>`;
  } else {
    const node = graph.nodes.find((n) => n.id === selection.id),
      fixed = ["A", "Y"].includes(node.id);
    $("#lab-inspector").innerHTML =
      `<div class="lab-inspector-heading"><h3>${node.id === "A" ? "Treatment A" : node.id === "Y" ? "Outcome Y" : `Variable ${escape(node.label)}`}</h3>${fixed ? "" : '<button id="lab-remove-node">Remove variable</button>'}</div><div class="lab-node-fields">${fixed ? "" : `<label>Name<input id="lab-name" value="${escape(node.label)}" maxlength="16"></label><label class="lab-check"><input id="lab-observed" type="checkbox" ${node.observed ? "checked" : ""}> Measured</label>`}<label>${node.id === "A" ? "Treatment intercept (log odds)" : "Intercept"}<input id="lab-intercept" type="number" min="-3" max="3" step="0.1" value="${node.intercept}"></label>${node.id === "A" ? "" : `<label>Noise scale<input id="lab-noise" type="number" min="0.1" max="3" step="0.1" value="${node.noise}"></label><label>Noise distribution<select id="lab-distribution"><option value="normal" ${node.distribution === "normal" ? "selected" : ""}>Normal</option><option value="uniform" ${node.distribution === "uniform" ? "selected" : ""}>Uniform</option></select></label>`}</div>`;
  }
}

function renderAdjustment() {
  const nodes = graph.nodes.filter((node) => !["A", "Y"].includes(node.id));
  $("#lab-adjustment").innerHTML = nodes.length
    ? nodes
        .map(
          (node) =>
            `<label class="lab-check"><input type="checkbox" data-adjust="${node.id}" ${adjustment.includes(node.id) ? "checked" : ""} ${node.observed ? "" : "disabled"}> ${escape(node.label)}${node.observed ? "" : " (unmeasured)"}</label>`,
        )
        .join("")
    : "<p>Add a measured variable to try adjustment.</p>";
  const caption = `Adjusted methods: ${adjustment.length ? `adjusting for ${adjustment.map(name).join(", ")}` : "no adjustment variables"}.`;
  $("#lab-model-caption").textContent = caption;
  const downstream = graphDescendants(graph, "A"),
    post = adjustment.filter((id) => downstream.has(id));
  $("#lab-causal-note").textContent = post.length
    ? `${post.map(name).join(", ")} lies downstream of A on an active path. Adjusting for it can block part of the effect or introduce bias. The target remains the total ATE.`
    : "Being measured before treatment does not make a variable safe to adjust for. Check the paths, as in the P–K–R example.";
}

function renderEditor() {
  const focused = document.activeElement?.id;
  const from = $("#lab-from").value,
    to = $("#lab-to").value;
  $("#lab-from").innerHTML = options();
  $("#lab-to").innerHTML = options();
  $("#lab-from").value = graph.nodes.some((n) => n.id === from) ? from : "A";
  $("#lab-to").value = graph.nodes.some((n) => n.id === to) ? to : "Y";
  $("#lab-add-node").disabled = graph.nodes.length >= graphLimits.nodes;
  $("#lab-connect button").disabled = graph.edges.length >= graphLimits.edges;
  renderGraph();
  renderInspector();
  renderAdjustment();
  if (focused) document.getElementById(focused)?.focus({ preventScroll: true });
}

function marker(error, starting = false) {
  if (!Number.isFinite(error)) return "";
  const off = Math.abs(error) > 4,
    position = 50 + Math.max(-4, Math.min(4, error)) * 12.5;
  return `<span class="${starting ? "starting-dot" : "estimate-dot"} ${off ? "off-scale" : ""}" style="left:${position}%" title="${starting ? "Starting" : "Current"} error ${error.toFixed(2)}">${off ? (error < 0 ? "‹" : "›") : ""}</span>`;
}

function renderResults() {
  clearTimeout(timer);
  const sample = simulateGraph(graph),
    result = analyzeGraph(graph, sample.data, adjustment);
  const values = indices.map((i) => result.values[i]);
  if (!startingErrors) startingErrors = values.map((v) => v - sample.truth);
  $("#lab-truth").textContent = sample.truth.toFixed(2);
  $("#lab-status").textContent =
    JSON.stringify(graph) === JSON.stringify(preset.graph) && !adjustment.length
      ? "Starting setup"
      : "Modified";
  $("#lab-estimates").innerHTML =
    `<div class="chart-axis"><span>ESTIMATOR</span><div><span>−4</span><b>TRUTH</b><span>+4</span></div><span>ESTIMATE</span></div>` +
    values
      .map((v, i) => {
        const comparison = effectComparison(v, sample.truth);
        const error = v - sample.truth;
        const position = 50 + Math.max(-4, Math.min(4, error)) * 12.5;
        const bar = Number.isFinite(error)
          ? `<i class="bias-line" style="left:${Math.min(50, position)}%;width:${Math.abs(position - 50)}%"></i>`
          : "";
        return `<div class="effect-row" data-method="${i}" style="--error-tint:${comparison.tint}%"><span class="estimator-label">${methods[i]}</span><div class="effect-track" aria-hidden="true"><i class="truth-line"></i>${bar}${marker(startingErrors[i], true)}${marker(error)}</div><span class="effect-value"><strong class="lab-estimate-value">${comparison.value}</strong><small aria-label="${comparison.difference}">${comparison.difference.replace(" from truth", "")}</small></span></div>`;
      })
      .join("");
  $("#lab-fit-error").hidden = !result.error;
  $("#lab-fit-error").textContent = result.error
    ? `Adjusted estimates unavailable. ${result.error}`
    : "";
  $("#lab-weight-warning").hidden = true;
  if (result.error) {
    $("#lab-diagnostics").textContent =
      "Weight diagnostics unavailable because the adjusted fit failed.";
  } else {
    const arms = sandboxOverlap(sample.data, result);
    $("#lab-diagnostics").innerHTML =
      `<dl class="lab-diagnostics">${arms.map((arm, i) => `<dt>${i ? "Treated" : "Untreated"}</dt><dd>${arm.count} people · ${arm.clipped} clipped · ESS ${Number.isFinite(arm.ess) ? arm.ess.toFixed(0) : "unavailable"}</dd>`).join("")}</dl>`;
    const warning = arms.some(
      (arm) => arm.clipped > 0 || arm.ess < arm.count * 0.25,
    );
    $("#lab-weight-warning").hidden = !warning;
    $("#lab-weight-warning").textContent =
      "Clipping or concentrated weights: inspect the diagnostics, then try reducing arrows into A or changing the adjustment set.";
  }
  $("#lab-equations").innerHTML = `<ul>${graph.nodes
    .map((node) => {
      const expression = `${node.intercept}${graph.edges
        .filter((e) => e.to === node.id)
        .map(
          (e) =>
            ` ${e.weight < 0 ? "−" : "+"} ${Math.abs(e.weight)} × ${name(e.from)}`,
        )
        .join("")}`;
      return `<li>${escape(node.id === "A" ? `P(A = 1 | parents) = sigmoid(${expression})` : `${node.label} = ${expression} + ${node.noise} × ${node.distribution} noise`)}</li>`;
    })
    .join("")}</ul>`;
}

function commit(change) {
  const next = structuredClone(graph);
  change(next);
  const { error } = validateGraph(next);
  $("#lab-validation").textContent = error || "";
  if (error) return false;
  graph = next;
  for (const node of graph.nodes) {
    if (nodePositions[node.id]) continue;
    const candidates = [0.15, 0.5, 0.85].flatMap((x) =>
      [0.15, 0.5, 0.85].map((y) => ({ x, y })),
    );
    const separation = (p) =>
      Math.min(
        ...Object.values(nodePositions).map((q) =>
          Math.hypot(p.x - q.x, p.y - q.y),
        ),
      );
    nodePositions[node.id] = candidates.sort(
      (a, b) => separation(b) - separation(a),
    )[0];
  }
  for (const id of Object.keys(nodePositions))
    if (!graph.nodes.some((node) => node.id === id)) delete nodePositions[id];
  adjustment = adjustment.filter((id) =>
    graph.nodes.some((node) => node.id === id && node.observed),
  );
  renderEditor();
  renderResults();
  return true;
}

function showTab(tab) {
  for (const name of ["world", "analysis"]) {
    const active = name === tab;
    $(`#lab-${name}`).hidden = !active;
    $(`#lab-${name}-tab`).setAttribute("aria-selected", active);
    $(`#lab-${name}-tab`).tabIndex = active ? 0 : -1;
  }
}

function reset(id) {
  clearTimeout(timer);
  preset = graphPreset(id);
  graph = structuredClone(preset.graph);
  arrangeGraph();
  setConnectMode(false);
  adjustment = [];
  nextId =
    Math.max(
      0,
      ...graph.nodes
        .filter((n) => n.id.startsWith("v"))
        .map((n) => Number(n.id.slice(1))),
    ) + 1;
  selection = { kind: "node", id: "A" };
  startingErrors = undefined;
  $("#lab-preset").value = preset.id;
  $("#lab-question").textContent = preset.question;
  $("#lab-action").textContent = preset.action;
  $("#lab-validation").textContent = "";
  const url = new URL(location.href);
  url.searchParams.set("preset", preset.id);
  history.replaceState(null, "", url);
  showTab("world");
  renderEditor();
  renderResults();
}

$("#lab-preset").addEventListener("change", (event) =>
  reset(event.target.value),
);
$("#lab-reset").addEventListener("click", () => reset(preset.id));
$("#lab-add-variable").addEventListener("submit", (event) => {
  event.preventDefault();
  const id = `v${nextId++}`;
  const label = $("#lab-new-name").value.trim();
  if (commit((next) => next.nodes.push(graphNode(id, label)))) {
    selection = { kind: "node", id };
    renderInspector();
    $("#lab-new-name").value = "";
    $("#lab-new-name").focus();
  }
});
$("#lab-connect").addEventListener("submit", (event) => {
  event.preventDefault();
  const from = $("#lab-from").value,
    to = $("#lab-to").value;
  if (commit((next) => next.edges.push({ from, to, weight: 1 }))) {
    selection = { kind: "edge", id: `${from}:${to}` };
    renderInspector();
    $("#lab-strength").focus();
  }
});
function selectGraph(event) {
  if (event.type === "click" && suppressClick) {
    suppressClick = false;
    return;
  }
  const target = event.target.closest("[data-node], [data-edge]");
  if (!target) return;
  if (connectMode && target.dataset.node) {
    const id = target.dataset.node;
    if (!connectFrom) {
      connectFrom = id;
      $("#lab-graph-help").textContent =
        `Now choose the destination for ${name(id)}. Escape cancels.`;
      renderGraph();
      $(`[data-node="${id}"]`).focus({ preventScroll: true });
    } else {
      const from = connectFrom;
      if (commit((next) => next.edges.push({ from, to: id, weight: 1 }))) {
        selection = { kind: "edge", id: `${from}:${id}` };
        setConnectMode(false);
        showTab("world");
        renderInspector();
        renderGraph();
      } else {
        $("#lab-graph-help").textContent = $("#lab-validation").textContent;
      }
    }
    return;
  }
  selection = target.dataset.node
    ? { kind: "node", id: target.dataset.node }
    : { kind: "edge", id: target.dataset.edge };
  showTab("world");
  renderInspector();
}
$("#lab-graph").addEventListener("click", selectGraph);
$("#lab-graph").addEventListener("keydown", (event) => {
  const node = event.target.closest("[data-node]");
  if (
    node &&
    !connectMode &&
    ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)
  ) {
    event.preventDefault();
    const p = nodePositions[node.dataset.node];
    p.x = Math.max(
      0,
      Math.min(
        1,
        p.x +
          (event.key === "ArrowLeft"
            ? -0.025
            : event.key === "ArrowRight"
              ? 0.025
              : 0),
      ),
    );
    p.y = Math.max(
      0,
      Math.min(
        1,
        p.y +
          (event.key === "ArrowUp"
            ? -0.025
            : event.key === "ArrowDown"
              ? 0.025
              : 0),
      ),
    );
    renderGraph();
    $(`[data-node="${node.dataset.node}"]`).focus();
    return;
  }
  if (!["Enter", " "].includes(event.key)) return;
  event.preventDefault();
  const connecting = connectMode;
  selectGraph(event);
  if (!connecting) $("#lab-inspector input")?.focus();
});

function setConnectMode(enabled) {
  connectMode = enabled;
  connectFrom = null;
  $("#lab-draw-arrow").setAttribute("aria-pressed", enabled);
  $("#lab-draw-arrow").textContent = enabled ? "Cancel drawing" : "Draw arrow";
  $("#lab-graph-help").textContent = enabled
    ? "Choose the source variable, then the destination. Escape cancels."
    : "Drag variables to arrange them; arrow keys move a focused variable. Dashed = unmeasured; faint = zero strength.";
}
$("#lab-draw-arrow").addEventListener("click", () => {
  setConnectMode(!connectMode);
  renderGraph();
});
$("#lab-arrange").addEventListener("click", () => {
  arrangeGraph();
  renderGraph();
});
function arrangeGraph() {
  nodePositions = automaticPositions(
    graph,
    $(".lab-graph-scroll").clientWidth < 400 ? 2 : 3,
  );
  graphHeight = Math.max(
    400,
    new Set(Object.values(nodePositions).map((p) => p.y)).size * 90 + 50,
  );
}
function finishDrag(cancel = false) {
  if (!drag) return;
  if (cancel) nodePositions[drag.id] = drag.original;
  suppressClick = drag.moved;
  const moved = drag.moved;
  drag = null;
  if (moved) renderGraph();
}
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (drag) finishDrag(true);
  if (connectMode) {
    setConnectMode(false);
    renderGraph();
    $("#lab-draw-arrow").focus();
  }
});
$("#lab-graph").addEventListener("pointerdown", (event) => {
  suppressClick = false;
  const node = event.target.closest("[data-node]");
  if (!node || connectMode || event.button !== 0) return;
  drag = {
    id: node.dataset.node,
    original: { ...nodePositions[node.dataset.node] },
    startX: event.clientX,
    startY: event.clientY,
    moved: false,
  };
});
$("#lab-graph").addEventListener("pointermove", (event) => {
  if (!drag) return;
  if (
    !drag.moved &&
    Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 5
  )
    return;
  drag.moved = true;
  $("#lab-graph").setPointerCapture(event.pointerId);
  const rect = $("#lab-graph").getBoundingClientRect();
  const width = $("#lab-graph").viewBox.baseVal.width;
  nodePositions[drag.id] = {
    x: Math.max(
      0,
      Math.min(
        1,
        drag.original.x +
          ((event.clientX - drag.startX) * width) / rect.width / (width - 72),
      ),
    ),
    y: Math.max(
      0,
      Math.min(
        1,
        drag.original.y +
          ((event.clientY - drag.startY) * graphHeight) /
            rect.height /
            (graphHeight - 80),
      ),
    ),
  };
  renderGraph();
});
$("#lab-graph").addEventListener("pointerup", () => finishDrag());
$("#lab-graph").addEventListener("pointercancel", () => finishDrag(true));
$("#lab-graph").addEventListener("lostpointercapture", () => finishDrag());
$("#lab-inspector").addEventListener("input", (event) => {
  if (event.target.id !== "lab-strength") return;
  const edge = graph.edges.find((e) => `${e.from}:${e.to}` === selection.id);
  edge.weight = Number(event.target.value);
  $("#lab-strength-value").textContent = edge.weight.toFixed(1);
  renderGraph();
  renderAdjustment();
  clearTimeout(timer);
  timer = setTimeout(renderResults, 120);
});
$("#lab-inspector").addEventListener("change", (event) => {
  const properties = {
    "lab-name": "label",
    "lab-observed": "observed",
    "lab-intercept": "intercept",
    "lab-noise": "noise",
    "lab-distribution": "distribution",
  };
  const property = properties[event.target.id];
  if (!property) {
    if (event.target.id === "lab-strength") renderResults();
    return;
  }
  const value =
    property === "observed"
      ? event.target.checked
      : ["noise", "intercept"].includes(property)
        ? event.target.valueAsNumber
        : event.target.value.trim();
  if (
    !commit((next) => {
      next.nodes.find((node) => node.id === selection.id)[property] = value;
    })
  )
    renderInspector();
});
$("#lab-inspector").addEventListener("click", (event) => {
  if (event.target.id === "lab-remove-edge") {
    commit((next) => {
      next.edges = next.edges.filter(
        (e) => `${e.from}:${e.to}` !== selection.id,
      );
    });
    $("#lab-from").focus();
  }
  if (event.target.id === "lab-remove-node") {
    const id = selection.id;
    selection = { kind: "node", id: "A" };
    commit((next) => {
      next.nodes = next.nodes.filter((n) => n.id !== id);
      next.edges = next.edges.filter((e) => e.from !== id && e.to !== id);
    });
    $("#lab-add-node").focus();
  }
});
$("#lab-adjustment").addEventListener("change", (event) => {
  const id = event.target.dataset.adjust;
  if (!id) return;
  adjustment = event.target.checked
    ? [...adjustment, id]
    : adjustment.filter((key) => key !== id);
  const focused = id;
  renderAdjustment();
  renderResults();
  $(`[data-adjust="${focused}"]`).focus();
});
$(".lab-tabs").addEventListener("click", (event) => {
  if (event.target.getAttribute("role") === "tab")
    showTab(event.target.id.includes("world") ? "world" : "analysis");
});
$(".lab-tabs").addEventListener("keydown", (event) => {
  if (
    event.target.getAttribute("role") !== "tab" ||
    !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
  )
    return;
  event.preventDefault();
  const tab =
    event.key === "Home"
      ? "world"
      : event.key === "End"
        ? "analysis"
        : event.target.id.includes("world")
          ? "analysis"
          : "world";
  showTab(tab);
  $(`#lab-${tab}-tab`).focus();
});
reset(preset.id);
new ResizeObserver(renderGraph).observe($(".lab-graph-scroll"));
