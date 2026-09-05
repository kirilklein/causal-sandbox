import icon from "./brand.svg?raw";
import "./style.css";
import { glossary } from "./glossary.js";
import { setupHelp } from "./help.js";
import {
  defaults,
  presets,
  worlds,
  makeNoise,
  simulate,
  estimate,
} from "./simulation.js";
const noise = makeNoise();
const state = {
  p: { ...defaults },
  visible: new Set(["C", "M", "K"]),
  adjust: new Set(),
  truth: true,
  preset: 1,
  world: worlds[0],
  models: { outcome: false, treatment: false },
};
document.querySelector("#app").innerHTML = `
<header><a class="brand" href="./">${icon}<span>Causal Sandbox</span></a><a class="lessons-link" href="./">Start the lessons</a><button id="methods" class="text-button">How this world works <span>↗</span></button></header>
<main><section class="intro"><div><div class="eyebrow">LEVEL 11 OF 11 · FULL SANDBOX</div><h1>Change the world.<br class="mobile-break"> Question the evidence.</h1><p>This starts a separate experiment. C now groups two measured baseline variables, C₁ and C₂. An interaction lets the influence of one depend on the other. Combine the causal pathways and model choices below.</p></div><div class="world-picker"><label for="world-select">THE WORLD’S RELATIONSHIPS</label><small id="world-help">Choose how C₁ and C₂ shape the simulated population.</small><select id="world-select" aria-describedby="world-help world-description">${worlds.map((w) => `<option value="${w.id}">${w.name}</option>`).join("")}</select><span id="world-description"></span></div></section>
<nav class="presets" aria-label="Scenarios"><span class="preset-label">TRY A SCENARIO</span>${presets.map((p, i) => `<button data-preset="${i}" title="${p.name}" class="${i === 1 ? "active" : ""}"><span class="preset-icon">${p.icon}</span>${p.short}</button>`).join("")}</nav>
<div class="workspace"><section class="world panel"><div class="panel-heading"><div><span class="step">01</span><h2>The causal world</h2></div><button id="truth" class="text-button">◉ Hide causal truth</button></div><p class="panel-description">Every arrow is a cause. You set its strength.</p>
<div class="graph-wrap"><svg id="dag" viewBox="0 0 600 290" role="img" aria-label="Causal graph: C (the pair C1 and C2) and hidden U cause treatment A and outcome Y. A causes mediator M and Y. A and Y cause collider K."><defs><marker id="arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7" fill="context-stroke"/></marker></defs><g id="edges"></g><g id="nodes"></g></svg><div class="graph-key"><span><i class="key-line"></i>Causal path</span><span><i class="key-line dashed"></i>Hidden to analyst</span><span id="graph-hint">Select an adjustment below ↘</span></div></div>
<div class="controls"><div class="control-group"><div class="group-heading">TREATMENT <span>The effect you put into the world</span></div>${slider("direct", "A → Y", "How much treatment A directly changes outcome Y.", -1, 4, 0.1)}</div><div class="control-group"><div class="group-heading">${helpButton("confounder", "OBSERVED CONFOUNDING")}<span class="c-color">C = C₁, C₂</span></div><div class="slider-pair">${slider("ca", "C → A", "How strongly observed C influences who receives treatment. Zero removes this path.", 0, 3, 0.1)}${slider("cy", "C → Y", "How strongly observed C changes outcome Y. Zero removes this path.", 0, 3, 0.1)}</div></div><div class="control-group"><div class="group-heading">${helpButton("hidden", "HIDDEN CONFOUNDING")}<span class="u-color">U · never observed</span></div><div class="slider-pair">${slider("ua", "U → A", "How strongly hidden U influences who receives treatment. Zero removes this path.", 0, 3, 0.1)}${slider("uy", "U → Y", "How strongly hidden U changes outcome Y. Zero removes this path.", 0, 3, 0.1)}</div></div><details class="path-controls"><summary>Mediator pathway <span>A → M → Y</span></summary><div class="slider-pair">${slider("am", "A → M", "How strongly treatment A changes mediator M.", 0, 2, 0.1)}${slider("my", "M → Y", "How strongly mediator M changes outcome Y.", 0, 2, 0.1)}</div></details></div></section>
<div class="right-column"><section class="data panel"><div class="panel-heading"><div><span class="step">02</span><h2>What you observe</h2></div><span class="small-tag">n = 2,400</span></div><div class="population-meta"><span><i class="dot untreated"></i>Untreated <b id="n0"></b></span><span><i class="dot treated"></i>Treated <b id="n1"></b></span><span class="axis-note">Outcome Y →</span></div><div class="canvas-wrap"><canvas id="population" role="img" aria-label="Two population clouds comparing outcomes of untreated and treated individuals"></canvas></div><div class="visibility-row"><span class="choice-explanation"><b>Analyst can see</b><small>Measured and available, but not used automatically.</small></span>${["C", "M", "K"].map((k) => `<button class="variable-toggle" data-visible="${k}" aria-pressed="true"><b>${k}</b><span>Visible</span><span class="eye">◉</span></button>`).join("")}<span class="locked-variable" title="U exists in the world but is never available to the analyst">U <span>Hidden · locked</span></span></div></section>
<section class="estimates panel"><div class="panel-heading"><div><span class="step">03</span><h2>Can we recover the effect?</h2></div><span class="small-tag">TOTAL EFFECT</span></div><div class="truth-card"><div><span>${helpButton("ate", "Total effect (ATE)")}</span><small id="truth-formula"></small></div><strong id="truth-value">2.00</strong><svg viewBox="0 0 65 32"><path d="M1 25H22L32 6L42 25H65" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="32" cy="6" r="3" fill="currentColor"/></svg></div>
<div class="adjust-row"><span class="choice-explanation"><b>${helpButton("adjustment", "Adjust for")}</b><small>Variables the estimators actually use.</small></span>${["C", "M", "K"].map((k) => `<div class="adjust-choice"><label class="adjust-option"><input type="checkbox" value="${k}" aria-label="Adjust for ${k} (${{ C: "Confounder", M: "Mediator", K: "Collider" }[k]})"><b>${k}</b></label>${helpButton({ C: "confounder", M: "mediator", K: "collider" }[k])}</div>`).join("")}</div><div class="model-controls" aria-label="Analyst models"><div class="model-intro"><span>ANALYST’S MODELS</span><small id="model-purpose">Choose how the analysis uses C₁ and C₂.</small><small id="model-availability">C groups two observed covariates: C₁ and C₂.</small></div><div class="model-pair">${["outcome", "treatment"].map((k) => `<div class="model-control"><div class="term-label"><label for="${k}-model">${k === "outcome" ? "Outcome model" : "Treatment model"}</label>${k === "treatment" ? helpButton("propensity", "Propensity score") : ""}</div><small id="${k}-purpose">${k === "outcome" ? "Predicts outcome Y under each treatment." : "Predicts each person’s chance of treatment."}</small><select id="${k}-model" aria-describedby="model-purpose model-availability ${k}-purpose ${k}-terms"><option value="main">C₁ and C₂ separately</option><option value="interaction">Include C₁ × C₂ interaction</option></select><small id="${k}-terms"></small></div>`).join("")}</div></div><div class="effect-chart" id="effects"></div><div class="estimate-key"><span>${helpButton("error", "Distance from truth")}</span><span>Fixed-sample point estimates, not intervals</span></div><div id="lesson" class="lesson" aria-live="polite"></div><div id="overlap" class="overlap"><span id="overlap-warning"></span><span class="overlap-help"><span class="term-label">${helpButton("overlap")}</span><span class="term-label">${helpButton("ess")}</span></span></div></section></div></div>
<footer><span>${icon} A known world. An imperfect view. A better question.</span><span>Same 2,400 people after every change <i>·</i> Seed 4217 <button id="reset">Reset world ↺</button></span></footer></main>
<dialog id="about" aria-labelledby="about-title"><div class="dialog-heading"><span class="eyebrow">UNDER THE SURFACE</span><button id="close-about" aria-label="Close explanation">×</button></div><h2 id="about-title">A world with an answer key.</h2><details class="glossary"><summary>Glossary · causal terms in plain language</summary><dl>${Object.entries(
  glossary,
)
  .map(
    ([key, term]) =>
      `<dt>${term.title}</dt><dd data-glossary="${key}">${term.text}</dd>`,
  )
  .join(
    "",
  )}</dl></details><p>Each person has fixed, independent background noise. Treatment is assigned by a logistic probability; outcomes follow these structural equations.</p><p><b>Arrow controls:</b> A → Y sets the direct contribution to Y, while A → M and M → Y together form the mediated contribution. C → A and U → A change treatment log odds, not a fixed percentage of people treated. Setting an arrow to zero removes only that pathway; treatment is randomized only when both C → A and U → A are zero.</p><pre>C₁, C₂ ~ independent Uniform(-√3, √3)
U, εM, εY, εK ~ independent Normal(0,1)
S = 0.8·C₁ + 0.6·C₂; I = C₁·C₂
P(A=1) = sigmoid(-0.8 + ca·(S + ta·I) + ua·U)
M = am·A + εM
Y = direct·A + cy·(S + oy·I) + uy·U + my·M + εY
K = 0.9·A + 0.9·Y + εK

Total causal effect = direct + am·my
World interactions: ta ∈ {0, 0.7}; oy ∈ {0, 1.5}</pre><p><b>World versus model:</b> the four worlds switch interaction terms in the generating equations. The analyst independently chooses whether to include C₁ × C₂ in each fitted model. Main effects hold each covariate’s contribution constant across values of the other; C₁ × C₂ allows one covariate’s influence to depend on the other. Both covariates are included whenever C is adjusted for. Hiding C removes both, including their interaction.</p><p><b>Measured versus adjusted:</b> “Analyst can see” makes a variable available. “Adjust for” actually includes it in estimation. C always represents both observed covariates, C₁ and C₂.</p><p><b>Double robustness:</b> with sufficient observed adjustment and overlap, AIPW can remain consistent if either fitted model represents the relevant conditional mean correctly. Including an interaction alone does not solve hidden confounding or post-treatment adjustment. A single sample need not favor AIPW.</p><p><b>Raw / naive:</b> mean difference and ordinary regression Y ~ A are identical for binary treatment. These baselines intentionally ignore the adjustment set.</p><p><b>Regression:</b> average predicted outcomes under A=1 minus A=0, using a pooled OLS model with the selected variables and optional interaction. <b>IPW:</b> normalized inverse propensity weights from logistic regression. <b>AIPW:</b> the same outcome predictions as regression plus inverse-weighted residual correction, using the chosen propensity model.</p><p>Propensities are clipped to [0.02, 0.98]. The app flags clipping and low effective sample size. The same fixed population is reused after every change; finite-sample estimates need not equal the truth.</p><p><b>Post-treatment adjustment:</b> M blocks the mediated path; regression can recover the direct effect when its outcome model is correctly specified. IPW/AIPW with M or K are illustrative invalid total-effect adjustments, not guaranteed direct-effect estimators. K is measured after Y.</p><p>Hiding causal truth conceals hidden paths in the graph. The known total effect stays visible as the teaching reference. Revealing U never makes it observable to estimators.</p><p class="help-credit">Contextual glossary and planned guided experiments inspired by Carlos Mendez’s <a href="https://carlos-mendez.org/post/stata_matching/web_app/">Treatment Effects in Stata — Interactive Lab</a>. Explanations written for this sandbox.</p></dialog>
${Object.entries(glossary)
  .map(
    ([key, term]) =>
      `<section id="help-${key}" class="term-help" popover aria-labelledby="help-title-${key}"><div class="dialog-heading"><span class="eyebrow">CAUSAL GLOSSARY</span><button type="button" class="close-help" popovertarget="help-${key}" popovertargetaction="hide" aria-label="Close ${term.title} explanation">×</button></div><h2 id="help-title-${key}">${term.title}</h2><p>${term.text}</p></section>`,
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
  document.querySelector("#edges").innerHTML = edges
    .map(([a, b, key, d]) => {
      const hidden =
        (!state.visible.has(a) && !["A", "Y"].includes(a)) ||
        (!state.visible.has(b) && !["A", "Y"].includes(b));
      const strength = key ? state.p[key] : 0.9;
      return `<path d="${d}" fill="none" stroke="var(--causal-path)" stroke-width="${1 + Math.abs(strength) * 0.55}" stroke-dasharray="${hidden ? "5 5" : ""}" opacity="${a === "U" && !state.truth ? 0 : strength === 0 ? 0.18 : 1}" marker-end="url(#arrow)"/>`;
    })
    .join("");
  document.querySelector("#nodes").innerHTML = Object.entries(coords)
    .map(([k, [x, y]]) => {
      const hidden = !state.visible.has(k) && !["A", "Y"].includes(k);
      return `<g transform="translate(${x} ${y})" opacity="${k === "U" && !state.truth ? 0 : 1}"><circle r="25" fill="var(--node-${k})" stroke="${hidden ? "var(--causal-path)" : "none"}" stroke-width="1.5" stroke-dasharray="${hidden ? "4 3" : ""}"/><text text-anchor="middle" y="6" class="node-letter">${k}</text>${k === "C" ? '<text text-anchor="middle" y="18" class="node-members">C₁ · C₂</text>' : ""}<text text-anchor="middle" y="${k === "K" ? 35 : -34}" class="node-label">${{ C: "CONFOUNDERS", U: "HIDDEN CONFOUNDER", A: "TREATMENT", M: "MEDIATOR", Y: "OUTCOME", K: "COLLIDER" }[k]}</text></g>`;
    })
    .join("");
  document.querySelector("#graph-hint").textContent = state.adjust.size
    ? `Adjusted methods: adjusting for ${["C", "M", "K"].filter((k) => state.adjust.has(k)).join(", ")}`
    : "Adjusted methods: no adjustment";
}
let latestData, latestResult;
function drawPopulation() {
  const canvas = document.querySelector("#population"),
    box = canvas.getBoundingClientRect(),
    dpr = window.devicePixelRatio || 1;
  canvas.width = box.width * dpr;
  canvas.height = box.height * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  const w = box.width,
    h = box.height;
  // Fixed outcome domain preserves the visual meaning of shifts across scenarios.
  const rowY = (a) => (h - 24) * (a ? 0.79 : 0.27);
  const x = (v) => 44 + ((v + 14) / 32) * (w - 64);
  ctx.font = "10px system-ui";
  ctx.textAlign = "center";
  for (let tick = -12; tick <= 16; tick += 4) {
    ctx.strokeStyle = "#e6e7e0";
    ctx.beginPath();
    ctx.moveTo(x(tick), 6);
    ctx.lineTo(x(tick), h - 22);
    ctx.stroke();
    ctx.fillStyle = "#8a908a";
    ctx.fillText(tick, x(tick), h - 5);
  }
  const colors = getComputedStyle(canvas);
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
function update() {
  const adjustment = [...state.adjust].filter((k) => state.visible.has(k));
  latestData = simulate(state.p, noise, state.world);
  latestResult = estimate(latestData, adjustment, state.models);
  const truth = state.p.direct + state.p.am * state.p.my;
  document.querySelector("#world-select").value = state.world.id;
  const activePaths = [];
  if (state.world.treatment && state.p.ca) activePaths.push("treatment");
  if (state.world.outcome && state.p.cy) activePaths.push("outcome");
  document.querySelector("#world-description").textContent =
    state.world.id === "additive"
      ? "C₁ and C₂ contribute separately."
      : activePaths.length
        ? `C₁ × C₂ affects ${activePaths.join(" and ")}.`
        : "Interaction paths are off at zero strength.";
  const hasC = adjustment.includes("C");
  document.querySelector("#model-availability").textContent = hasC
    ? "An interaction lets one covariate’s influence depend on the other."
    : state.visible.has("C")
      ? "Check ‘Adjust for C’ above to enable these choices."
      : "Make C visible, then check ‘Adjust for C’ above to enable these choices.";
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
  document
    .querySelectorAll("[data-preset]")
    .forEach((el) =>
      el.classList.toggle("active", +el.dataset.preset === state.preset),
    );
  document.querySelectorAll("[data-visible]").forEach((el) => {
    const on = state.visible.has(el.dataset.visible);
    el.setAttribute("aria-pressed", on);
    el.querySelector("span").textContent = on ? "Visible" : "Hidden";
  });
  document.querySelectorAll(".adjust-option input").forEach((el) => {
    el.checked = state.adjust.has(el.value);
    el.disabled = !state.visible.has(el.value);
    el.closest("label").classList.toggle("unavailable", el.disabled);
  });
  document.querySelector("#truth").textContent = state.truth
    ? "◉ Hide causal truth"
    : "◉ Reveal causal truth";
  document.querySelector("#truth-value").textContent = truth.toFixed(2);
  document.querySelector("#truth-formula").textContent =
    `${state.p.direct.toFixed(1)} direct + ${(state.p.am * state.p.my).toFixed(1)} mediated`;
  document.querySelector("#n0").textContent = (
    noise.length - latestResult.count
  ).toLocaleString();
  document.querySelector("#n1").textContent =
    latestResult.count.toLocaleString();
  const span = Math.max(
    2,
    Math.ceil(
      Math.max(...latestResult.values.map((v) => Math.abs(v - truth))) * 1.15,
    ),
  );
  const pos = (v) => 50 + ((v - truth) / span) * 50;
  const names = [
    "Raw association",
    "Naive regression",
    "Regression adjustment",
    "IPW",
    "AIPW",
  ];
  const chartMarkup = `<div class="chart-axis"><span>ESTIMATOR</span><div><span>${(truth - span).toFixed(1)}</span><b>TRUTH</b><span>${(truth + span).toFixed(1)}</span></div><span>ESTIMATE</span></div>${latestResult.values.map((v, i) => `<div class="effect-row" data-estimator="${i}"><span class="estimator-label">${i >= 2 ? helpButton(["", "", "regression", "ipw", "aipw"][i], names[i]) : `<span>${names[i]}${i === 1 ? "<small>Y ~ A</small>" : ""}</span>`}</span><div class="effect-track"><i class="truth-line"></i><i class="bias-line" style="left:${Math.min(50, pos(v))}%;width:${Math.abs(pos(v) - 50)}%"></i><i class="estimate-dot" style="left:${pos(v)}%" title="Difference from truth ${(v - truth).toFixed(2)}"></i></div><strong>${v.toFixed(2)}</strong></div>`).join("")}`;
  const effects = document.querySelector("#effects");
  if (!effects.children.length) effects.innerHTML = chartMarkup;
  else {
    const template = document.createElement("template");
    template.innerHTML = chartMarkup;
    effects.querySelector(".chart-axis").innerHTML =
      template.content.querySelector(".chart-axis").innerHTML;
    effects.querySelectorAll(".effect-row").forEach((row, i) => {
      const next = template.content.querySelectorAll(".effect-row")[i];
      for (const selector of [".bias-line", ".estimate-dot"]) {
        const el = row.querySelector(selector),
          target = next.querySelector(selector);
        el.style.cssText = target.style.cssText;
        el.className = target.className;
        el.title = target.title;
      }
      row.querySelector("strong").textContent =
        next.querySelector("strong").textContent;
      row.querySelector("strong").className =
        next.querySelector("strong").className;
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
    lesson = state.visible.has("C")
      ? "<b>Association isn’t the effect.</b> C influences both treatment and outcome. Check C above to close that backdoor path."
      : "<b>The confounder still exists.</b> Hiding C removes it from adjustment, not from the world. Make C visible to recover the effect.";
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
  document.querySelector("#overlap-warning").textContent =
    latestResult.clipped || latestResult.ess < noise.length * 0.25
      ? `${latestResult.clipped} propensities clipped to [0.02, 0.98] · weighted effective n ≈ ${Math.round(latestResult.ess)}. Limited overlap can distort estimates.`
      : "";
  renderGraph();
  drawPopulation();
}
document.querySelectorAll("[data-param]").forEach((el) =>
  el.addEventListener("input", () => {
    state.p[el.dataset.param] = +el.value;
    state.preset = -1;
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
function preset(i) {
  state.p = { ...presets[i].p };
  state.preset = i;
  state.visible = new Set(["C", "M", "K"]);
  state.adjust = new Set(presets[i].adjust);
  update();
}
document
  .querySelectorAll("[data-preset]")
  .forEach((el) =>
    el.addEventListener("click", () => preset(+el.dataset.preset)),
  );
document.querySelectorAll("[data-visible]").forEach((el) =>
  el.addEventListener("click", () => {
    const k = el.dataset.visible;
    if (state.visible.has(k)) {
      state.visible.delete(k);
      state.adjust.delete(k);
    } else state.visible.add(k);
    update();
  }),
);
document.querySelectorAll(".adjust-option input").forEach((el) =>
  el.addEventListener("change", () => {
    el.checked ? state.adjust.add(el.value) : state.adjust.delete(el.value);
    update();
  }),
);
document.querySelector("#truth").addEventListener("click", () => {
  state.truth = !state.truth;
  update();
});
document.querySelector("#reset").addEventListener("click", () => {
  state.truth = true;
  state.world = worlds[0];
  state.models = { outcome: false, treatment: false };
  preset(1);
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
update();

setupHelp();
