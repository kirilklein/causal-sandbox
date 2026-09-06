import { effectComparison } from "./effect-comparison.js";
import { arrowStrength } from "./arrow-strength.js";
import { sandboxOverlap } from "./sandbox-overlap.js";
import { setupOverlapExperiment } from "./overlap-experiment.js";
import { themeControl } from "./theme.js";
import icon from "./brand.svg?raw";
import "./style.css";
import "./sandbox.css";
import { scenarios, scenarioState } from "./sandbox-scenarios.js";
import { glossary } from "./glossary.js";
import { setupHelp } from "./help.js";
import { worlds, makeNoise, simulate, estimate } from "./simulation.js";
const noise = makeNoise();
let selectedScenario =
  scenarios.find(
    (s) => s.id === new URLSearchParams(location.search).get("scenario"),
  ) || scenarios[1];
let state = scenarioState(scenarios[1]);
let startingErrors = [];
let startingState;
const estimatorIndices = [0, 2, 3, 4];
const contextualGlossary = Object.entries(glossary).filter(
  ([, term]) => term.contextual,
);
document.querySelector("#app").innerHTML = `
<header class="sandbox-header"><a class="brand" href="./">${icon}<span>Causal Sandbox</span></a><a class="lessons-link" href="./">Guided lessons</a><button id="methods" class="text-button">How this world works</button>${themeControl()}</header>
<main class="sandbox">
  <section class="intro"><div><div class="eyebrow">FULL SANDBOX</div><h1>Explore what makes an estimate credible.</h1><p>Start with a scenario. Change the world or the analysis, and compare with the known effect.</p></div></section>
  <section class="scenario-bar" aria-label="Scenario">
    <div class="scenario-picker"><label for="scenario-select">Choose a scenario</label><select id="scenario-select" aria-describedby="scenario-question scenario-action">${[
      ...new Set(scenarios.map((s) => s.group)),
    ]
      .map(
        (group) =>
          `<optgroup label="${group}">${scenarios
            .filter((s) => s.group === group)
            .map((s) => `<option value="${s.id}">${s.name}</option>`)
            .join("")}</optgroup>`,
      )
      .join("")}</select></div>
    <div class="scenario-context"><h2 id="scenario-question"></h2><p id="scenario-action"></p></div>
    <div class="scenario-actions"><span id="scenario-status" role="status">Starting setup</span><button id="reset" class="restart-button">Restart scenario ↺</button><a id="scenario-link">Link to starting setup</a></div>
  </section>
  <nav class="workspace-nav" aria-label="Experiment sections"><div role="tablist" aria-label="Configure experiment"><button id="world-tab" role="tab" aria-controls="world-panel" aria-selected="false" tabindex="-1">World</button><button id="analyst-tab" role="tab" aria-controls="analyst-panel" aria-selected="true">Analysis</button></div><a class="results-jump" href="#results-panel">Results ↓</a></nav>
  <div class="workspace">
    <div class="controls-column">
      <section id="world-panel" class="world panel" role="tabpanel" aria-labelledby="world-tab" tabindex="0">
        <div class="panel-heading"><h2 id="world-title">The causal world</h2><span class="small-tag">What generates the data</span></div>
        <div class="world-picker"><label for="world-select">The world’s relationships</label><select id="world-select" aria-describedby="world-description">${worlds.map((w) => `<option value="${w.id}">${w.name}</option>`).join("")}</select><p id="world-description"></p><details class="relationship-help"><summary>About C₁ and C₂</summary><p>C groups two measured baseline variables. An interaction means one variable’s influence depends on the other. This changes the world; choose what the fitted models include under Analysis.</p></details></div>
        <details class="graph-details" open><summary>Causal diagram</summary>
          <div class="graph-wrap"><svg id="dag" viewBox="0 0 600 290" role="img" aria-label="Causal graph"><defs><marker id="arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7" fill="context-stroke"/></marker></defs><g id="edges"></g><g id="nodes"></g></svg><div class="graph-key"><span><i class="key-line"></i>Causal path</span><span><i class="key-line dashed"></i>Unmeasured</span><span id="graph-hint"></span></div></div>
          <div class="graph-view" role="group" aria-label="Graph view" aria-describedby="graph-view-help"><span>Emphasize</span>${["C", "M", "K", "U"].map((k) => `<button class="graph-variable" data-graph-variable="${k}" aria-label="Emphasize ${k} in diagram" aria-pressed="true">${k}</button>`).join("")}</div><p id="graph-view-help" class="graph-toggle-help">Fade variables to simplify the diagram. Estimates stay the same.</p><details class="relationship-help"><summary>Reading the arrows</summary><p>Faint arrows at zero are inactive. Darker arrows show greater strength, not sign.</p></details>
        </details>
        <div class="controls">
          <div class="control-group"><div class="group-heading">Direct treatment effect</div>${slider("direct", "A → Y", "Direct change in outcome Y from treatment A.", -1, 4, 0.1)}</div>
          <details class="control-group observed-controls" open><summary>Observed confounding <span>C = C₁, C₂</span></summary><div class="slider-pair">${slider("ca", "C → A", "Influence on treatment assignment. Zero removes this path.", 0, 3, 0.1)}${slider("cy", "C → Y", "Influence on outcome Y. Zero removes this path.", 0, 3, 0.1)}</div></details>
          <details class="control-group hidden-controls"><summary>Hidden confounding <span>U · unmeasured</span></summary><div class="slider-pair">${slider("ua", "U → A", "Hidden influence on treatment assignment.", 0, 3, 0.1)}${slider("uy", "U → Y", "Hidden influence on outcome Y.", 0, 3, 0.1)}</div></details>
          <details class="path-controls control-group"><summary>Mediator pathway <span>A → M → Y</span></summary><div class="slider-pair">${slider("am", "A → M", "Change in mediator M from treatment A.", 0, 2, 0.1)}${slider("my", "M → Y", "Change in outcome Y per unit of mediator M.", 0, 2, 0.1)}</div></details>
        </div>
      </section>
      <section id="analyst-panel" class="analyst panel" role="tabpanel" aria-labelledby="analyst-tab" tabindex="0">
        <div class="panel-heading"><h2 id="analyst-title">Fitted models</h2><span class="small-tag">What the estimators use</span></div>
        <div class="model-controls" aria-label="Analyst models"><div class="model-intro"><small id="model-purpose">Choose how the analysis uses C₁ and C₂.</small><small id="model-availability"></small></div><div class="model-pair">${["outcome", "treatment"].map((k) => `<div class="model-control"><div class="term-label"><label for="${k}-model">${k === "outcome" ? "Outcome model" : "Treatment model"}</label>${k === "treatment" ? helpButton("propensity", "?") : ""}</div><small id="${k}-purpose">${k === "outcome" ? "Used by regression and AIPW." : "Used by IPW and AIPW."}</small><select id="${k}-model" aria-describedby="model-purpose model-availability ${k}-purpose ${k}-terms"><option value="main">C₁ and C₂ separately</option><option value="interaction">Include C₁ × C₂</option></select><small id="${k}-terms"></small></div>`).join("")}</div></div>
      </section>
    </div>
    <section id="results-panel" class="estimates panel" aria-labelledby="results-title" tabindex="-1">
      <div class="panel-heading"><h2 id="results-title">Can we recover the effect?</h2><span class="small-tag">Results</span></div>
      <div class="truth-card"><div><span>${helpButton("ate", "Total effect (ATE)")}</span><small id="truth-formula"></small></div><strong id="truth-value">2.00</strong></div>
        <div class="adjust-row"><span class="choice-explanation"><b>${helpButton("adjustment", "Adjust for")}</b></span>${["C", "M", "K"].map((k) => `<div class="adjust-choice"><label class="adjust-option"><input type="checkbox" value="${k}" aria-label="Adjust for ${k} (${{ C: "Confounder", M: "Mediator", K: "Collider" }[k]})"><b>${k}</b></label>${helpButton({ C: "confounder", M: "mediator", K: "collider" }[k])}</div>`).join("")}</div>
      <div class="effect-chart" id="effects"></div>
      <div class="estimate-key"><span>${helpButton("error", "Distance from truth")}</span><span>Redder = farther from truth</span></div>
      <p class="comparison-key"><i class="start-key" aria-hidden="true"></i>Starting error <i class="now-key" aria-hidden="true"></i>Current error <span id="offscale-note" hidden>Arrows mark errors beyond ±4.</span></p>
      <div id="lesson" class="lesson" aria-live="polite"></div>
      <div id="overlap" class="overlap"><p id="overlap-warning" role="status"></p><span class="overlap-help">${helpButton("overlap")}${helpButton("ess")}</span></div>
      <details class="data"><summary>Observed outcomes <span>n = 2,400</span></summary><div class="population-meta"><span><i class="dot untreated"></i>Untreated <b id="n0"></b></span><span><i class="dot treated"></i>Treated <b id="n1"></b></span><span class="axis-note">Outcome Y →</span></div><div class="canvas-wrap"><canvas id="population" role="img" aria-label="Outcome distributions"></canvas></div></details>
      <p class="sample-note">One fixed sample of 2,400 people. Closeness to truth is not a significance test.</p>
    </section>
  </div>
  <section id="overlap-experiment" class="panel overlap-experiment" aria-labelledby="overlap-experiment-title" hidden></section>
  <footer><span>${icon}Same background draws after every change · Seed 4217</span><a href="./">Return to guided lessons</a></footer>
</main>
<dialog id="about" aria-labelledby="about-title"><div class="dialog-heading"><span class="eyebrow">UNDER THE SURFACE</span><button id="close-about" aria-label="Close explanation">×</button></div><h2 id="about-title">A world with an answer key.</h2><details class="glossary"><summary>Glossary · causal terms in plain language</summary><dl>${contextualGlossary
  .map(
    ([key, term]) =>
      `<dt>${term.title}</dt><dd data-glossary="${key}">${term.summary}</dd>`,
  )
  .join(
    "",
  )}</dl><a class="glossary-more" href="glossary/">Open the full glossary →</a></details><p>Each person has fixed, independent background noise. Treatment is assigned by a logistic probability; outcomes follow these structural equations.</p><p><b>Arrow controls:</b> A → Y sets the direct contribution to Y, while A → M and M → Y together form the mediated contribution. C → A and U → A change treatment log odds, not a fixed percentage of people treated. Setting an arrow to zero removes only that pathway; treatment is randomized only when both C → A and U → A are zero.</p><pre>C₁, C₂ ~ independent Uniform(-√3, √3)
U, εM, εY, εK ~ independent Normal(0,1)
S = 0.8·C₁ + 0.6·C₂; I = C₁·C₂
P(A=1) = sigmoid(-0.8 + ca·(S + ta·I) + ua·U)
M = am·A + εM
Y = direct·A + cy·(S + oy·I) + uy·U + my·M + εY
K = 0.9·A + 0.9·Y + εK

Total causal effect = direct + am·my
World interactions: ta ∈ {0, 0.7}; oy ∈ {0, 1.5}</pre><p><b>World versus model:</b> the four worlds switch interaction terms in the generating equations. The analyst independently chooses whether to include C₁ × C₂ in each fitted model. Main effects hold each covariate’s contribution constant across values of the other; C₁ × C₂ allows one covariate’s influence to depend on the other. Both covariates are included whenever C is adjusted for. Unchecking C under “Adjust for” removes both, including their interaction.</p><p><b>Graph view versus adjustment:</b> fading a variable changes only its appearance in the diagram. “Adjust for” in the results panel selects which variables enter estimation. C always represents both measured covariates, C₁ and C₂; U remains unmeasured and cannot be adjusted for.</p><p><b>Double robustness:</b> with sufficient observed adjustment and overlap, AIPW can remain consistent if either fitted model represents the relevant conditional mean correctly. Including an interaction alone does not solve hidden confounding or post-treatment adjustment. A single sample need not favor AIPW.</p><p><b>Raw / naive:</b> mean difference and ordinary regression Y ~ A are identical for binary treatment. These baselines intentionally ignore the adjustment set.</p><p><b>Regression:</b> average predicted outcomes under A=1 minus A=0, using a pooled OLS model with the selected variables and optional interaction. <b>IPW:</b> normalized inverse propensity weights from logistic regression. <b>AIPW:</b> the same outcome predictions as regression plus inverse-weighted residual correction, using the chosen propensity model.</p><p>Propensities are clipped to [0.02, 0.98]. The app flags clipping and low effective sample size. The same fixed population is reused after every change; finite-sample estimates need not equal the truth.</p><p><b>Post-treatment adjustment:</b> M blocks the mediated path; regression can recover the direct effect when its outcome model is correctly specified. IPW/AIPW with M or K are illustrative invalid total-effect adjustments, not guaranteed direct-effect estimators. K is measured after Y.</p></dialog>
${contextualGlossary
  .map(
    ([key, term]) =>
      `<section id="help-${key}" class="term-help" popover aria-labelledby="help-title-${key}"><div class="dialog-heading"><span class="eyebrow">CAUSAL GLOSSARY</span><button type="button" class="close-help" popovertarget="help-${key}" popovertargetaction="hide" aria-label="Close ${term.title} explanation">×</button></div><h2 id="help-title-${key}">${term.title}</h2><p>${term.summary}</p><a class="term-help-more" href="glossary/#${key}">Read the detailed definition →</a></section>`,
  )
  .join("")}`;
function helpButton(key, label = glossary[key].title) {
  return `<button type="button" class="help-button" popovertarget="help-${key}" aria-label="Explain ${glossary[key].title}">${label}</button>`;
}
function slider(key, edge, description, min, max, step) {
  return `<label class="slider-control"><span><b>${edge}</b><output id="out-${key}"></output></span><input aria-label="${edge}" aria-describedby="help-${key}" type="range" data-param="${key}" min="${min}" max="${max}" step="${step}" value="${state.p[key]}"><small id="help-${key}">${description}</small></label>`;
}
const coords = {
  C: [190, 55],
  U: [410, 55],
  A: [90, 160],
  M: [300, 160],
  Y: [510, 160],
  K: [300, 252],
};
const edges = [
  ["C", "A", "ca", "M170 74L111 139"],
  ["C", "Y", "cy", "M214 62Q356 77 487 145"],
  ["U", "A", "ua", "M386 62Q242 77 113 145"],
  ["U", "Y", "uy", "M429 74L490 139"],
  ["A", "Y", "direct", "M113 174Q300 219 487 174"],
  ["A", "M", "am", "M117 160H273"],
  ["M", "Y", "my", "M327 160H483"],
  ["A", "K", null, "M110 179L277 243"],
  ["Y", "K", null, "M490 179L323 243"],
];
function renderGraph() {
  document
    .querySelector("#dag")
    .setAttribute(
      "aria-label",
      `Causal graph: C (the pair C1 and C2) and unmeasured U cause treatment A and outcome Y. A causes mediator M and Y. A and Y cause collider K. Faded in this view: ${["C", "M", "K", "U"].filter((k) => !state.graphVisible.has(k)).join(", ") || "none"}.`,
    );
  document.querySelector("#edges").innerHTML = edges
    .map(([a, b, key, d]) => {
      const faded = !state.graphVisible.has(a) || !state.graphVisible.has(b);
      const strength = key ? state.p[key] : 0.9;
      return `<g opacity="${faded ? 0.12 : 1}"><path d="${d}" fill="none" stroke="var(--causal-path)" ${key ? arrowStrength(strength, key === "direct" ? 4 : ["am", "my"].includes(key) ? 2 : 3) : 'stroke-width="2"'} stroke-dasharray="${a === "U" ? "5 5" : ""}" marker-end="url(#arrow)"/></g>`;
    })
    .join("");
  document.querySelector("#nodes").innerHTML = Object.entries(coords)
    .map(([k, [x, y]]) => {
      return `<g data-node="${k}" transform="translate(${x} ${y})" opacity="${state.graphVisible.has(k) ? 1 : 0.12}"><circle r="25" fill="var(--node-${k})" stroke="${k === "U" ? "var(--causal-path)" : "none"}" stroke-width="1.5" stroke-dasharray="${k === "U" ? "4 3" : ""}"/><text text-anchor="middle" y="6" class="node-letter">${k}</text>${k === "C" ? '<text text-anchor="middle" y="18" class="node-members">C₁ · C₂</text>' : ""}<text text-anchor="middle" y="${k === "K" ? 35 : -34}" class="node-label">${{ C: "CONFOUNDERS", U: "HIDDEN CONFOUNDER", A: "TREATMENT", M: "MEDIATOR", Y: "OUTCOME", K: "COLLIDER" }[k]}</text></g>`;
    })
    .join("");
  document
    .querySelectorAll("[data-graph-variable]")
    .forEach((el) =>
      el.setAttribute(
        "aria-pressed",
        state.graphVisible.has(el.dataset.graphVariable),
      ),
    );
  document.querySelector("#graph-hint").textContent = state.adjust.size
    ? `Adjusted methods: adjusting for ${["C", "M", "K"].filter((k) => state.adjust.has(k)).join(", ")}`
    : "Adjusted methods: no adjustment";
}
let latestData, latestResult;
function drawPopulation() {
  const canvas = document.querySelector("#population"),
    box = canvas.getBoundingClientRect(),
    dpr = window.devicePixelRatio || 1;
  if (!box.width || !box.height) return;
  canvas.width = box.width * dpr;
  canvas.height = box.height * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  const w = box.width,
    h = box.height;
  // Fixed outcome domain preserves the visual meaning of shifts across scenarios.
  const rowY = (a) => (h - 24) * (a ? 0.79 : 0.27);
  const x = (v) => 44 + ((v + 14) / 32) * (w - 64);
  const colors = getComputedStyle(canvas);
  ctx.font = "10px system-ui";
  ctx.textAlign = "center";
  for (let tick = -12; tick <= 16; tick += 4) {
    ctx.strokeStyle = colors.getPropertyValue("--grid").trim();
    ctx.beginPath();
    ctx.moveTo(x(tick), 6);
    ctx.lineTo(x(tick), h - 22);
    ctx.stroke();
    ctx.fillStyle = colors.getPropertyValue("--text-muted").trim();
    ctx.fillText(tick, x(tick), h - 5);
  }
  const arms = [0, 1].map((a) => colors.getPropertyValue(`--arm-${a}`).trim());
  latestData.forEach((d) => {
    ctx.fillStyle = arms[d.A];
    const yy = rowY(d.A) + (d.jitter - 0.5) * (h - 24) * 0.34;
    ctx.beginPath();
    ctx.arc(Math.max(4, Math.min(w - 4, x(d.Y))), yy, 1.5, 0, Math.PI * 2);
    ctx.fill();
  });
  for (const [a, mean] of [
    [0, latestResult.mean0],
    [1, latestResult.mean1],
  ]) {
    const yy = rowY(a);
    ctx.strokeStyle = arms[a];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x(mean), yy - (h - 24) * 0.2);
    ctx.lineTo(x(mean), yy + (h - 24) * 0.2);
    ctx.stroke();
  }
  ctx.textAlign = "left";
  ctx.fillStyle = arms[0];
  ctx.fillText("A = 0", 2, rowY(0) + 3);
  ctx.fillStyle = arms[1];
  ctx.fillText("A = 1", 2, rowY(1) + 3);
  canvas.setAttribute(
    "aria-label",
    `Outcome clouds: untreated mean ${latestResult.mean0.toFixed(2)}, treated mean ${latestResult.mean1.toFixed(2)}. Vertical marks show group means.`,
  );
}
function renderOverlap() {
  const arms = sandboxOverlap(latestData, latestResult);
  const labels = ["Untreated", "Treated"];
  const ess = (arm) => (arm.ess === null ? "Unavailable" : arm.ess.toFixed(0));
  document.querySelector("#overlap-warning").textContent = arms.some(
    (arm) => arm.clipped || (arm.ess !== null && arm.ess < arm.count * 0.25),
  )
    ? `Clipping or concentrated weights: ${arms.map((arm, a) => `${labels[a].toLowerCase()} ${arm.clipped} clipped, ESS ${ess(arm)} of ${arm.count}`).join("; ")}. Check the treatment model or choose the Poor overlap scenario.`
    : "";
}

function update() {
  const adjustment = [...state.adjust];
  latestData = simulate(state.p, noise, state.world);
  latestResult = estimate(latestData, adjustment, state.models);
  const truth = state.p.direct + state.p.am * state.p.my;
  document.querySelector("#world-select").value = state.world.id;
  const relationships = [];
  if (state.world.treatment)
    relationships.push(
      state.p.ca
        ? "C₁’s influence on treatment depends on C₂."
        : "Treatment interaction inactive because C → A is 0.",
    );
  if (state.world.outcome)
    relationships.push(
      state.p.cy
        ? "C₁’s effect on Y depends on C₂."
        : "Outcome interaction inactive because C → Y is 0.",
    );
  document.querySelector("#world-description").textContent =
    state.world.id === "additive"
      ? "C₁ and C₂ contribute separately to treatment assignment and outcome Y."
      : relationships.join(" ");
  const hasC = adjustment.includes("C");
  document.querySelector("#model-availability").textContent = hasC
    ? "An interaction lets one covariate’s influence depend on the other."
    : "Select C under Adjust for in the results to enable these choices.";
  for (const key of ["outcome", "treatment"]) {
    const control = document.querySelector(`#${key}-model`);
    control.value = state.models[key] ? "interaction" : "main";
    control.disabled = !hasC;
    const active =
      state.world[key] > 0 && state.p[key === "outcome" ? "cy" : "ca"] > 0;
    document.querySelector(`#${key}-terms`).textContent = !hasC
      ? ""
      : state.models[key]
        ? "C₁ + C₂ + C₁ × C₂"
        : active
          ? "C₁ + C₂ · world’s interaction omitted"
          : "C₁ + C₂";
    document
      .querySelector(`#${key}-terms`)
      .classList.toggle("missing-term", hasC && active && !state.models[key]);
  }
  document.querySelectorAll("[data-param]").forEach((el) => {
    el.value = state.p[el.dataset.param];
    el.style.setProperty(
      "--fill",
      `${((el.value - el.min) / (el.max - el.min)) * 100}%`,
    );
    document.querySelector(`#out-${el.dataset.param}`).textContent =
      (+el.value).toFixed(1);
  });
  document.querySelectorAll(".adjust-option input").forEach((el) => {
    el.checked = state.adjust.has(el.value);
  });
  document.querySelector("#truth-value").textContent = truth.toFixed(2);
  document.querySelector("#truth-formula").textContent =
    `${state.p.direct.toFixed(1)} direct + ${(state.p.am * state.p.my).toFixed(1)} mediated`;
  document.querySelector("#n0").textContent = (
    noise.length - latestResult.count
  ).toLocaleString();
  document.querySelector("#n1").textContent =
    latestResult.count.toLocaleString();
  const pos = (error) => 50 + Math.max(-4, Math.min(4, error)) * 12.5;
  const names = ["Unadjusted", "", "Regression adjustment", "IPW", "AIPW"];
  const comparisons = latestResult.values.map((value) =>
    effectComparison(value, truth),
  );
  document.querySelector("#offscale-note").hidden = !latestResult.values.some(
    (value, i) =>
      Math.abs(value - truth) > 4 || Math.abs(startingErrors[i]) > 4,
  );
  const chartMarkup = `<div class="chart-axis"><span>ESTIMATOR</span><div><span>−4</span><b>TRUTH</b><span>+4</span></div><span>ESTIMATE</span></div>${estimatorIndices
    .map((i) => {
      const comparison = comparisons[i];
      const error = latestResult.values[i] - truth;
      const start = startingErrors[i];
      return `<div class="effect-row" data-estimator="${i}" style="--error-tint:${comparison.tint}%"><span class="estimator-label">${i ? helpButton(["", "", "regression", "ipw", "aipw"][i], names[i]) : names[i]}</span><div class="effect-track"><i class="truth-line"></i><i class="bias-line" style="left:${Math.min(50, pos(error))}%;width:${Math.abs(pos(error) - 50)}%"></i><i class="starting-dot ${Math.abs(start) > 4 ? "off-scale" : ""}" style="left:${pos(start)}%" title="Starting error: ${start.toFixed(2)} from truth">${Math.abs(start) > 4 ? (start < 0 ? "‹" : "›") : ""}</i><i class="estimate-dot ${Math.abs(error) > 4 ? "off-scale" : ""}" style="left:${pos(error)}%" title="${comparison.difference}">${Math.abs(error) > 4 ? (error < 0 ? "‹" : "›") : ""}</i></div><span class="effect-value"><strong>${comparison.value}</strong><small aria-label="${comparison.difference}">${comparison.difference.replace(" from truth", "")}</small></span></div>`;
    })
    .join("")}`;
  const effects = document.querySelector("#effects");
  if (!effects.children.length) effects.innerHTML = chartMarkup;
  else {
    const template = document.createElement("template");
    template.innerHTML = chartMarkup;
    effects.querySelectorAll(".effect-row").forEach((row, index) => {
      const next = template.content.querySelectorAll(".effect-row")[index];
      row.style.setProperty(
        "--error-tint",
        `${comparisons[estimatorIndices[index]].tint}%`,
      );
      for (const selector of [".bias-line", ".estimate-dot", ".starting-dot"]) {
        const el = row.querySelector(selector),
          target = next.querySelector(selector);
        el.style.cssText = target.style.cssText;
        el.className = target.className;
        el.title = target.title;
        el.textContent = target.textContent;
      }
      row.querySelector(".effect-value").innerHTML =
        next.querySelector(".effect-value").innerHTML;
    });
  }
  let lesson = "";
  if (state.adjust.has("K"))
    lesson =
      "<b>A collider changes the story.</b> Conditioning on K opens a non-causal path. Compare with K unchecked.";
  else if (state.adjust.has("M"))
    lesson =
      "<b>You’re blocking part of the effect.</b> M is a mediator. With a correctly specified outcome model, regression targets the direct effect instead of the total effect.";
  else if (state.p.ua * state.p.uy > 0)
    lesson =
      "<b>Better estimators can’t see the unseen.</b> U affects treatment and outcome. Adjusting for C cannot remove this hidden confounding.";
  else if (state.p.ca * state.p.cy > 0 && !state.adjust.has("C"))
    lesson =
      "<b>Association isn’t the effect.</b> C influences both treatment and outcome. Adjust for C to close that backdoor path.";
  else if (
    hasC &&
    state.p.ca > 0 &&
    state.p.cy > 0 &&
    ((state.world.outcome > 0 && !state.models.outcome) ||
      (state.world.treatment > 0 && !state.models.treatment))
  ) {
    const missingOutcome = state.world.outcome > 0 && !state.models.outcome;
    const missingTreatment =
      state.world.treatment > 0 && !state.models.treatment;
    lesson =
      missingOutcome && missingTreatment
        ? "<b>Measured does not mean modeled.</b> Both models omit C₁ × C₂. Add it to either model to explore double robustness."
        : missingOutcome
          ? "<b>The outcome model misses a relationship.</b> Regression omits C₁ × C₂. IPW and AIPW can recover using the treatment model; sampling and overlap still matter."
          : "<b>The treatment model misses a relationship.</b> IPW uses an incomplete propensity model. Regression and AIPW can recover using the outcome model.";
  } else if (hasC && (state.p.ca === 0 || state.p.cy === 0))
    lesson =
      "<b>No confounding through C.</b> At least one C path has zero strength. Omitting a model term need not bias the treatment contrast.";
  else if (state.adjust.has("C"))
    lesson =
      "<b>The observed relationships are represented.</b> Both models include the needed C terms. Sampling and limited overlap can still move estimates away from truth.";
  else
    lesson =
      "<b>Treatment is unconfounded.</b> The groups are comparable before treatment. Their outcome difference tracks the true effect.";
  document.querySelector("#lesson").innerHTML =
    `<span class="lesson-icon">↳</span><p>${lesson}</p>`;
  renderOverlap();
  renderGraph();
  drawPopulation();
  updateScenarioStatus();
}
document.querySelectorAll("[data-param]").forEach((el) =>
  el.addEventListener("input", () => {
    state.p[el.dataset.param] = +el.value;
    update();
  }),
);
document.querySelector("#world-select").addEventListener("change", (e) => {
  state.world = worlds.find((w) => w.id === e.target.value);
  update();
});
for (const key of ["outcome", "treatment"]) {
  document.querySelector(`#${key}-model`).addEventListener("change", (e) => {
    state.models[key] = e.target.value === "interaction";
    update();
  });
}
function experimentState() {
  return JSON.stringify([
    state.p,
    [...state.adjust].sort(),
    state.world.id,
    state.models,
  ]);
}
function showControls(panel, scroll = false) {
  for (const name of ["world", "analyst"]) {
    const active = name === panel;
    document.querySelector(`#${name}-panel`).hidden = !active;
    const tab = document.querySelector(`#${name}-tab`);
    tab.setAttribute("aria-selected", active);
    tab.tabIndex = active ? 0 : -1;
  }
  if (scroll && matchMedia("(max-width: 1000px)").matches)
    document
      .querySelector(`#${panel}-panel`)
      .scrollIntoView({ block: "start" });
}
document.querySelectorAll('[role="tab"]').forEach((tab) => {
  tab.addEventListener("click", () =>
    showControls(tab.id.replace("-tab", ""), true),
  );
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const name =
      event.key === "Home"
        ? "world"
        : event.key === "End"
          ? "analyst"
          : tab.id === "world-tab"
            ? "analyst"
            : "world";
    showControls(name, true);
    document.querySelector(`#${name}-tab`).focus();
  });
});
function updateScenarioStatus() {
  const modified =
    selectedScenario.id === "overlap"
      ? document.querySelector("#overlap-strength").value !== "0"
      : experimentState() !== startingState;
  document.querySelector("#scenario-status").textContent = modified
    ? "Modified"
    : "Starting setup";
  document.querySelector("#lesson").hidden = !modified;
}
function enterScenario(scenario) {
  selectedScenario = scenario;
  const isOverlap = scenario.id === "overlap";
  document.querySelector("#scenario-select").value = scenario.id;
  document.querySelector("#scenario-question").textContent = scenario.question;
  document.querySelector("#scenario-action").textContent = scenario.action;
  document.querySelector(".workspace").hidden = isOverlap;
  document.querySelector(".workspace-nav").hidden = isOverlap;
  document.querySelector("#overlap-experiment").hidden = !isOverlap;
  const url = new URL(location.href);
  url.searchParams.set("scenario", scenario.id);
  url.hash = "";
  history.replaceState(null, "", url);
  document.querySelector("#scenario-link").href = url.href;
  if (isOverlap) {
    resetOverlap();
    updateScenarioStatus();
    return;
  }
  state = scenarioState(scenario);
  startingState = experimentState();
  const data = simulate(state.p, noise, state.world);
  const truth = state.p.direct + state.p.am * state.p.my;
  startingErrors = estimate(data, [...state.adjust], state.models).values.map(
    (v) => v - truth,
  );
  document.querySelector(".observed-controls").open =
    state.p.ca !== 0 || state.p.cy !== 0;
  document.querySelector(".hidden-controls").open = scenario.id === "hidden";
  document.querySelector(".path-controls").open = scenario.id === "mediator";
  showControls(
    ["randomized", "hidden"].includes(scenario.id) ? "world" : "analyst",
  );
  update();
}
document
  .querySelector("#scenario-select")
  .addEventListener("change", (e) =>
    enterScenario(scenarios.find((s) => s.id === e.target.value)),
  );
document.querySelectorAll("[data-graph-variable]").forEach((el) =>
  el.addEventListener("click", () => {
    const k = el.dataset.graphVariable;
    state.graphVisible.has(k)
      ? state.graphVisible.delete(k)
      : state.graphVisible.add(k);
    renderGraph();
  }),
);
document.querySelectorAll(".adjust-option input").forEach((el) =>
  el.addEventListener("change", () => {
    el.checked ? state.adjust.add(el.value) : state.adjust.delete(el.value);
    update();
  }),
);
document.querySelector("#reset").addEventListener("click", () => {
  enterScenario(selectedScenario);
});
document
  .querySelector("#methods")
  .addEventListener("click", () =>
    document.querySelector("#about").showModal(),
  );
document
  .querySelector("#close-about")
  .addEventListener("click", () => document.querySelector("#about").close());
new ResizeObserver(() => {
  if (latestData) drawPopulation();
}).observe(document.querySelector(".canvas-wrap"));
const resetOverlap = setupOverlapExperiment(
  document.querySelector("#overlap-experiment"),
);
document
  .querySelector("#overlap-strength")
  .addEventListener("input", updateScenarioStatus);
document.querySelector(".graph-details").open = !matchMedia(
  "(max-width: 1000px)",
).matches;
// Create the shared result help buttons even when opening an overlap link.
const initialScenario = selectedScenario;
if (initialScenario.id === "overlap") enterScenario(scenarios[1]);
enterScenario(initialScenario);

setupHelp();

window.addEventListener("themechange", drawPopulation);
