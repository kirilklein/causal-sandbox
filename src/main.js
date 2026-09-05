import "./style.css";
import {
  defaults,
  presets,
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
};
const icon =
  '<svg viewBox="0 0 32 32" fill="none"><path d="M8 9L24 16L8 24M8 9V24" stroke="currentColor" stroke-width="1.7"/><circle cx="8" cy="9" r="4" fill="currentColor"/><circle cx="24" cy="16" r="4" fill="currentColor"/><circle cx="8" cy="24" r="4" fill="currentColor"/></svg>';
document.querySelector("#app").innerHTML = `
<header><a class="brand" href="./">${icon}<span>causal<span class="brand-dot">.</span></span></a><span class="header-note">A SMALL WORLD. BIG WHAT-IFS.</span><button id="methods" class="text-button">How this world works <span>↗</span></button></header>
<main><section class="intro"><div><div class="eyebrow">THE CAUSAL INFERENCE PLAYGROUND</div><h1>Change the world.<br class="mobile-break"> Question the evidence.</h1><p>Turn a causal dial. Watch a population respond. Find what the data can—and can’t—tell you.</p></div><div class="live-tag"><i></i> LIVE SIMULATION<span>2,400 individuals · fixed seed</span></div></section>
<nav class="presets" aria-label="Scenarios"><span class="preset-label">EXPLORE A WORLD</span>${presets.map((p, i) => `<button data-preset="${i}" title="${p.name}" class="${i === 1 ? "active" : ""}"><span class="preset-icon">${p.icon}</span>${p.short}</button>`).join("")}</nav>
<div class="workspace"><section class="world panel"><div class="panel-heading"><div><span class="step">01</span><h2>The causal world</h2></div><button id="truth" class="text-button">◉ Hide causal truth</button></div><p class="panel-description">Every arrow is a cause. You set its strength.</p>
<div class="graph-wrap"><svg id="dag" viewBox="0 0 600 290" role="img" aria-label="Causal graph: C and hidden U cause treatment A and outcome Y. A causes mediator M and Y. A and Y cause collider K."><defs><marker id="arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7" fill="context-stroke"/></marker></defs><g id="edges"></g><g id="nodes"></g></svg><div class="graph-key"><span><i class="key-line"></i>Causal path</span><span><i class="key-line dashed"></i>Hidden to analyst</span><span id="graph-hint">Select an adjustment below ↘</span></div></div>
<div class="controls"><div class="control-group"><div class="group-heading">TREATMENT <span>The effect you put into the world</span></div>${slider("direct", "A → Y", "Direct effect", -1, 4, 0.1)}</div><div class="control-group"><div class="group-heading">OBSERVED CONFOUNDING <span class="c-color">C</span></div><div class="slider-pair">${slider("ca", "C → A", "Treatment assignment", 0, 3, 0.1)}${slider("cy", "C → Y", "Outcome influence", 0, 3, 0.1)}</div></div><div class="control-group"><div class="group-heading">HIDDEN CONFOUNDING <span class="u-color">U · never observed</span></div><div class="slider-pair">${slider("ua", "U → A", "Treatment assignment", 0, 3, 0.1)}${slider("uy", "U → Y", "Outcome influence", 0, 3, 0.1)}</div></div><details class="path-controls"><summary>Mediator pathway <span>A → M → Y</span></summary><div class="slider-pair">${slider("am", "A → M", "Mediator response", 0, 2, 0.1)}${slider("my", "M → Y", "Mediated influence", 0, 2, 0.1)}</div></details></div></section>
<div class="right-column"><section class="data panel"><div class="panel-heading"><div><span class="step">02</span><h2>What you observe</h2></div><span class="small-tag">n = 2,400</span></div><div class="population-meta"><span><i class="dot untreated"></i>Untreated <b id="n0"></b></span><span><i class="dot treated"></i>Treated <b id="n1"></b></span><span class="axis-note">Outcome Y →</span></div><div class="canvas-wrap"><canvas id="population" role="img" aria-label="Two population clouds comparing outcomes of untreated and treated individuals"></canvas></div><div class="visibility-row"><span>Analyst can see</span>${["C", "M", "K"].map((k) => `<button class="variable-toggle" data-visible="${k}" aria-pressed="true"><b>${k}</b><span>Visible</span><span class="eye">◉</span></button>`).join("")}<span class="locked-variable" title="U exists in the world but is never available to the analyst">U <span>Hidden · locked</span></span></div></section>
<section class="estimates panel"><div class="panel-heading"><div><span class="step">03</span><h2>Can we recover the effect?</h2></div><span class="small-tag">TOTAL EFFECT</span></div><div class="truth-card"><div><span>True causal effect</span><small id="truth-formula"></small></div><strong id="truth-value">2.00</strong><svg viewBox="0 0 65 32"><path d="M1 25H22L32 6L42 25H65" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="32" cy="6" r="3" fill="currentColor"/></svg></div>
<div class="adjust-row"><span>Adjust for</span>${["C", "M", "K"].map((k) => `<label class="adjust-option"><input type="checkbox" value="${k}"><b>${k}</b><span>${{ C: "Confounder", M: "Mediator", K: "Collider" }[k]}</span></label>`).join("")}</div><div class="effect-chart" id="effects"></div><div class="estimate-key"><span><i class="dot close"></i>Within 0.15 of truth</span><span><i class="dot biased"></i>Further from truth</span><span>Point estimates, not intervals</span></div><div id="lesson" class="lesson" aria-live="polite"></div><div id="overlap" class="overlap"></div></section></div></div>
<footer><span>${icon} A known world. An imperfect view. A better question.</span><span>Same people, every time <i>·</i> Seed 4217 <button id="reset">Reset world ↺</button></span></footer></main>
<dialog id="about"><div class="dialog-heading"><span class="eyebrow">UNDER THE SURFACE</span><button id="close-about" aria-label="Close explanation">×</button></div><h2>A world with an answer key.</h2><p>Each person has fixed, independent background noise. Treatment is assigned by a logistic probability; outcomes follow these structural equations.</p><pre>C, U, εM, εY, εK ~ independent Normal(0,1)
P(A=1) = sigmoid(ca·C + ua·U)
M = am·A + εM
Y = direct·A + cy·C + uy·U + my·M + εY
K = 0.9·A + 0.9·Y + εK

Total causal effect = direct + am·my</pre><p><b>Raw / naive:</b> mean difference and ordinary regression Y ~ A are identical for binary treatment. These baselines intentionally ignore the adjustment set.</p><p><b>Regression:</b> ordinary least squares Y ~ A + selected variables. <b>IPW:</b> normalized inverse propensity weights from logistic regression. <b>AIPW:</b> separate linear outcome models in each arm plus inverse-weighted residual correction.</p><p>Propensities are clipped to [0.02, 0.98]. The app flags clipping and low effective sample size. Finite-sample estimates need not equal the truth.</p><p><b>Post-treatment adjustment:</b> M blocks the mediated path; regression can recover the direct effect in this model. IPW/AIPW with M or K are illustrative invalid total-effect adjustments, not guaranteed direct-effect estimators. K is measured after Y.</p><p>Hiding causal truth conceals hidden paths in the graph. The known total effect stays visible as the teaching reference. Revealing U never makes it observable to estimators.</p></dialog>`;
function slider(key, edge, label, min, max, step) {
  return `<label class="slider-control"><span><b>${edge}</b><output id="out-${key}"></output></span><input aria-label="${edge} ${label}" type="range" data-param="${key}" min="${min}" max="${max}" step="${step}" value="${state.p[key]}"><small>${label}</small></label>`;
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
      const harm = b === "K" && state.adjust.has("K");
      return `<path d="${d}" fill="none" stroke="${harm ? "#b96d4f" : hidden ? "#9c95ad" : "#6e8e83"}" stroke-width="${harm ? 2.5 : 1 + Math.abs(strength) * 0.55}" stroke-dasharray="${hidden ? "5 5" : ""}" opacity="${a === "U" && !state.truth ? 0 : strength === 0 ? 0.18 : 0.8}" marker-end="url(#arrow)"/>`;
    })
    .join("");
  document.querySelector("#nodes").innerHTML = Object.entries(coords)
    .map(([k, [x, y]]) => {
      const hidden = !state.visible.has(k) && !["A", "Y"].includes(k),
        selected = state.adjust.has(k);
      return `<g transform="translate(${x} ${y})" opacity="${k === "U" && !state.truth ? 0 : 1}"><circle r="${selected ? 29 : 25}" fill="${{ A: "#e6efe9", Y: "#e5ebf4", C: "#e7eee6", U: "#efecf3", M: "#f5f0e4", K: "#f4e9e1" }[k]}" stroke="${selected ? (k === "C" ? "#357c65" : "#b96d4f") : hidden ? "#aaa1b8" : "#d0d8cf"}" stroke-width="${selected ? 2 : 1}" stroke-dasharray="${hidden ? "4 3" : ""}"/><text text-anchor="middle" y="6" class="node-letter">${k}</text><text text-anchor="middle" y="${k === "K" ? 35 : -34}" class="node-label">${{ C: "CONFOUNDER", U: "HIDDEN CONFOUNDER", A: "TREATMENT", M: "MEDIATOR", Y: "OUTCOME", K: "COLLIDER" }[k]}</text>${selected ? '<circle cx="21" cy="-20" r="7" fill="' + (k === "C" ? "#357c65" : "#b96d4f") + '"/><text x="21" y="-17" text-anchor="middle" fill="white" font-size="9">✓</text>' : ""}</g>`;
    })
    .join("");
  document.querySelector("#graph-hint").textContent = state.adjust.has("K")
    ? "Collider path conditioned on"
    : state.adjust.has("M")
      ? "Mediator path blocked"
      : state.adjust.has("C")
        ? "Observed confounding adjusted"
        : "Select an adjustment below ↘";
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
  latestData.forEach((d) => {
    ctx.fillStyle = d.A ? "#557ba879" : "#5a8b7079";
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
    ctx.strokeStyle = a ? "#315d8c" : "#286648";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x(mean), yy - (h - 24) * 0.2);
    ctx.lineTo(x(mean), yy + (h - 24) * 0.2);
    ctx.stroke();
  }
  ctx.textAlign = "left";
  ctx.fillStyle = "#66756a";
  ctx.fillText("A = 0", 2, rowY(0) + 3);
  ctx.fillStyle = "#53759a";
  ctx.fillText("A = 1", 2, rowY(1) + 3);
  canvas.setAttribute(
    "aria-label",
    `Outcome clouds: untreated mean ${latestResult.mean0.toFixed(2)}, treated mean ${latestResult.mean1.toFixed(2)}. Vertical marks show group means.`,
  );
}
function update() {
  const adjustment = [...state.adjust].filter((k) => state.visible.has(k));
  latestData = simulate(state.p, noise);
  latestResult = estimate(latestData, adjustment);
  const truth = state.p.direct + state.p.am * state.p.my;
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
  const chartMarkup = `<div class="chart-axis"><span>ESTIMATOR</span><div><span>${(truth - span).toFixed(1)}</span><b>TRUTH</b><span>${(truth + span).toFixed(1)}</span></div><span>ESTIMATE</span></div>${latestResult.values.map((v, i) => `<div class="effect-row" data-estimator="${i}"><span>${names[i]}${i === 1 ? "<small>Y ~ A</small>" : ""}</span><div class="effect-track"><i class="truth-line"></i><i class="bias-line" style="left:${Math.min(50, pos(v))}%;width:${Math.abs(pos(v) - 50)}%;background:${Math.abs(v - truth) < 0.15 ? "#82a691" : "#c99878"}"></i><i class="estimate-dot ${Math.abs(v - truth) < 0.15 ? "good" : "bad"}" style="left:${pos(v)}%" title="Bias ${(v - truth).toFixed(2)}"></i></div><strong class="${Math.abs(v - truth) < 0.15 ? "good-text" : ""}">${v.toFixed(2)}</strong></div>`).join("")}`;
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
      "<b>You’re blocking part of the effect.</b> M is a mediator. Adjustment no longer targets the total effect; regression targets the direct effect here.";
  else if (state.p.ua * state.p.uy > 0)
    lesson =
      "<b>Better estimators can’t see the unseen.</b> U affects treatment and outcome. Adjusting for C cannot remove this hidden confounding.";
  else if (state.p.ca * state.p.cy > 0 && !state.adjust.has("C"))
    lesson = state.visible.has("C")
      ? "<b>Association isn’t the effect.</b> C influences both treatment and outcome. Check C above to close that backdoor path."
      : "<b>The confounder still exists.</b> Hiding C removes it from adjustment, not from the world. Make C visible to recover the effect.";
  else if (state.adjust.has("C"))
    lesson =
      "<b>A clearer view of cause and effect.</b> Adjusting for C closes the observed backdoor path. Small differences remain from sampling.";
  else
    lesson =
      "<b>Treatment is unconfounded.</b> The groups are comparable before treatment. Their outcome difference tracks the true effect.";
  document.querySelector("#lesson").innerHTML =
    `<span class="lesson-icon">↳</span><p>${lesson}</p>`;
  document.querySelector("#overlap").textContent =
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
