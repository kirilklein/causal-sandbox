import "./instrument-lesson.css";
import "./relevance-lesson.css";
import { themeControl } from "./theme.js";
import {
  lessonNavigation,
  setupLessonNavigation,
} from "./lesson-navigation.js";
import { relevanceSample } from "./relevance-simulation.js";
import { studySummary } from "./instrument-simulation.js";
import { effectComparison } from "./effect-comparison.js";
import icon from "./brand.svg?raw";

const pairs = [
  ["unrelated", "predictor"],
  ["predictor", "proxy"],
  ["proxy", "collider"],
];
const worlds = {
  unrelated: {
    title: "An unrelated variable",
    explanation:
      "V is independent of A and Y in this stipulated world. It neither causes Y nor adds predictive information. Adjusting for it is unnecessary; finite samples can still show a small change in either result.",
    adjustment:
      "No confounding to remove; adding V has no population prediction benefit.",
    nodes: { A: [70, 180], Y: [330, 180], V: [200, 50] },
    edges: [["A", "Y"]],
    hidden: [],
  },
  predictor: {
    title: "An outcome cause and predictor",
    explanation:
      "V causes Y but does not affect randomized treatment A. Including V explains outcome variation: across studies, the treatment estimate is more precise. V is not a confounder of A and Y here.",
    adjustment:
      "No confounding to remove; adding V improves precision in this model.",
    nodes: { A: [70, 180], Y: [330, 180], V: [200, 50] },
    edges: [
      ["A", "Y"],
      ["V", "Y"],
    ],
    hidden: [],
  },
  proxy: {
    title: "A proxy for a hidden common cause",
    explanation:
      "V is a noisy measurement of U. Changing V alone would not change U or Y, yet V carries information about both treatment and outcome. Adjusting for V reduces bias in this model, but cannot fully remove confounding by U. Other proxy settings need not improve bias.",
    adjustment:
      "The path A ← U → Y remains open; V alone is not a sufficient adjustment set.",
    nodes: { A: [70, 180], Y: [330, 180], U: [100, 50], V: [300, 50] },
    edges: [
      ["A", "Y"],
      ["U", "A"],
      ["U", "Y"],
      ["U", "V"],
    ],
    hidden: ["U"],
  },
  collider: {
    title: "A collider measured before treatment",
    explanation:
      "V is a common effect of P and R. It helps predict Y through R, despite having no causal effect on Y. Adjusting for V connects the otherwise independent causes P and R: prediction improves here while the treatment-effect estimate becomes biased.",
    adjustment:
      "Adding V opens A ← P → V ← R → Y. Being measured before A does not make V safe.",
    nodes: {
      A: [70, 190],
      Y: [330, 190],
      P: [70, 45],
      R: [330, 45],
      V: [200, 105],
    },
    edges: [
      ["A", "Y"],
      ["P", "A"],
      ["R", "Y"],
      ["P", "V"],
      ["R", "V"],
    ],
    hidden: ["P", "R"],
  },
};

document.querySelector("#app").innerHTML = `
<div class="instrument-page relevance-page">
  <header><a class="brand" href="./">${icon}<span>Causal Sandbox</span></a>${themeControl()}</header>
  <main>
    ${lessonNavigation({ currentOptional: "causal-relevance" })}
    <p class="eyebrow">OPTIONAL · CAUSAL ROLES</p>
    <h1 tabindex="-1">Does this variable matter?</h1>
    <p class="intro">Not contributing to what? Causing an outcome, predicting it, and helping estimate a treatment effect are different jobs.</p>
    <p><strong>Our question:</strong> What is the average total effect of giving treatment A rather than no treatment on outcome Y? V is another measured variable, recorded before A.</p>
    <details><summary>Helpful background</summary><p>Start with <a href="?lesson=mediator">mediators</a>, <a href="?lesson=collider">colliders</a>, and <a href="?lesson=hidden-confounding">hidden common causes</a>.</p></details>

    <section class="panel" aria-labelledby="comparison-title">
      <div class="relevance-step"><h2 id="comparison-title">Comparison 1 of 3</h2><div class="actions"><button id="previous">← Previous</button><button id="next">Next comparison →</button></div></div>
      <p id="comparison-question"></p>
      <fieldset class="relevance-worlds"><legend>Compare two fictional worlds</legend><label><input type="radio" name="world" value="0" checked> World 1</label><label><input type="radio" name="world" value="1"> World 2</label></fieldset>
      <p class="small">Switch worlds to change the generating mechanism. Within each world, both models use the same people.</p>
      <h3>What the analyst can calculate</h3>
      <table class="relevance-metrics">
        <caption>Outcome regression, with or without V</caption>
        <thead><tr><th scope="col">Question</th><th scope="col">A only</th><th scope="col">A + V</th></tr></thead>
        <tbody><tr><th scope="row">Predict Y<br><small>Error on new people ↓</small></th><td id="prediction-0"></td><td id="prediction-1"></td></tr>
        <tr><th scope="row">Estimate A’s effect<br><small>Fitted A coefficient</small></th><td id="effect-0"></td><td id="effect-1"></td></tr></tbody>
      </table>
      <p class="small">Fit on 1,200 people; predict outcomes for 1,200 different people from the same world. Prediction error is root mean squared error (RMSE), in outcome units; lower is better.</p>
      <p class="note">Does better prediction tell you whether V causes Y, or whether adjusting for V is safe?</p>
      <button id="reveal" class="primary" aria-expanded="false" aria-controls="world-truth">Reveal the toy world</button>
      <div id="world-truth" hidden>
        <h3 id="world-title"></h3>
        <div class="relevance-story"><div id="world-graph"></div><div><p id="world-explanation"></p><p id="adjustment-path" class="small"></p></div></div>
        <p id="causal-truth" class="relevance-truth"></p>
        <p class="small">The graph and truth come from the simulator’s equations, not from fitting the data. Estimate colors show distance from the true effect of A on the shared 0–2 outcome-unit scale.</p>
      </div>
      <div class="actions"><button id="redraw">Redraw sample</button><button id="reset">Restart lesson</button><span id="sample" class="small"></span></div>
      <details id="studies"><summary>Does this pattern persist across studies?</summary>
        <p>Repeat both fits on 60 independent samples. Compare their mean effect estimates and spread; one sample cannot establish bias or precision.</p>
        <button id="repeat">Run 60 studies</button><p id="study-status" role="status"></p><div id="study-results"></div>
      </details>
    </section>

    <details><summary>Five meanings of “does not contribute”</summary>
      <dl class="relevance-definitions">
        <dt>No direct effect on Y</dt><dd>No direct V → Y effect. V could still act through a mediator: V → M → Y.</dd>
        <dt>No total effect on Y</dt><dd>Changing V produces no net change in Y for the intervention and population considered. Opposing paths can cancel; a zero average can also hide different effects in different people. Try <a href="?lesson=arrow-strength&example=paths-cancel">the cancellation experiment</a>.</dd>
        <dt>No directed causal path to Y</dt><dd>In the stipulated graph, changing V cannot reach Y. A proxy or collider can still be associated with Y through other paths.</dd>
        <dt>No predictive information</dt><dd>V adds nothing for predicting Y given the other inputs in the target setting. A small coefficient or low feature importance in one fitted model does not establish this, or causal irrelevance.</dd>
        <dt>No adjustment benefit</dt><dd>A claim about estimating A’s effect using a particular method. A variable may improve precision, leave confounding, or introduce bias; prediction accuracy cannot decide which.</dd>
      </dl>
    </details>
    <details><summary>What would justify a missing arrow in real data?</summary>
      <p>Specify what changing V would mean and when it could affect Y. Use study design, biological or other subject-matter knowledge, and intervention evidence to argue for or against particular paths. Timing can rule out backward causation; being earlier does not establish an effect.</p>
      <p>Randomization can justify missing causes of treatment assignment. It does not remove paths among other variables. A null association alone cannot justify deleting an arrow: cancellation, noisy measurement, or an unsuitable model can hide effects.</p>
      <p>If several graphs remain plausible, compare whether the intended adjustment works in each and report the unresolved assumption. The four toy worlds are examples, not an exhaustive classification or a graph-discovery algorithm.</p>
    </details>
    <section class="panel" aria-labelledby="practice-title">
      <h2 id="practice-title">Try the distinction</h2>
      <p>A biomarker measured before treatment improves prediction of recovery in new patients. You do not know its causal role. What does this establish about adjusting for it when estimating the treatment’s total effect?</p>
      <div class="relevance-answers" role="group" aria-label="Choose an answer">
        <button data-answer="include">Include it: prediction improved.</button>
        <button data-answer="exclude">Omit it: it is not a proven cause.</button>
        <button data-answer="unknown">Its adjustment role is still uncertain.</button>
      </div>
      <p id="practice-feedback" role="status"></p>
    </section>
    <details><summary>Sources and model assumptions</summary>
      <p>These additive toy models have independent background causes and a constant treatment effect. Proxy adjustment is ordinary regression, not a specialized method that identifies effects from proxies. Predictive performance is assessed under the same observational distribution, not after intervention or distribution shift.</p>
      <ul><li><a href="https://miguelhernan.org/whatifbook">Hernán & Robins: Causal Inference: What If</a>, chapters 6–8, on causal diagrams, confounding, and selection.</li><li><a href="https://dagitty.net/learn/graphs/roles.html">DAGitty: covariate roles</a>.</li><li><a href="https://arxiv.org/abs/1804.10846">Hernán et al.: description, prediction, and counterfactual prediction</a>.</li></ul>
    </details>
    <nav class="actions" aria-label="Chapter navigation"><a href="?lesson=timing">← Timing and adjustment</a><a href="?lesson=topics">All topics</a><a class="primary" href="?lesson=misspecification">Resume core lessons →</a></nav>
    <footer>Fictional worlds; causal roles are stipulated, not discovered.</footer>
  </main>
</div>`;
setupLessonNavigation();

const el = (id) => document.getElementById(id);
const state = { pair: 0, choice: 0, seed: 4217, revealed: false };
let result;
let batch = null;
let runId = 0;
const fmt = (value) =>
  Number.isFinite(value) ? value.toFixed(3) : "Unavailable";
const currentWorld = () => pairs[state.pair][state.choice];

function graph(world) {
  const { nodes, edges, hidden } = world;
  const description = edges
    .map(([from, to]) => `${from} causes ${to}`)
    .join(". ");
  return `<svg class="graph" viewBox="0 0 400 235" role="img" aria-label="${description}. ${hidden.length ? `${hidden.join(" and ")} unmeasured.` : "All shown variables measured."}">
    <defs><marker id="relevance-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" /></marker></defs>
    ${edges
      .map(([from, to]) => {
        const [x, y] = nodes[from];
        const [tx, ty] = nodes[to];
        const length = Math.hypot(tx - x, ty - y);
        const dx = (tx - x) / length,
          dy = (ty - y) / length;
        return `<path d="M${x + dx * 24} ${y + dy * 24}L${tx - dx * 28} ${ty - dy * 28}" marker-end="url(#relevance-arrow)" ${hidden.includes(from) ? 'stroke-dasharray="5 4"' : ""} />`;
      })
      .join("")}
    ${Object.entries(nodes)
      .map(
        ([name, [x, y]]) =>
          `<circle cx="${x}" cy="${y}" r="24" fill="var(--node-${["A", "Y"].includes(name) ? name : hidden.includes(name) ? "U" : "C"})" ${hidden.includes(name) ? 'class="unmeasured"' : ""}/><text x="${x}" y="${y + 7}" text-anchor="middle">${name}</text>`,
      )
      .join("")}
    </svg><p class="small">A: treatment · Y: outcome · V: measured variable.${hidden.length ? ` Dashed: ${hidden.join(", ")} unmeasured.` : ""}</p>`;
}

function renderBatch() {
  if (!batch) {
    el("study-results").innerHTML = "";
    return;
  }
  el("study-results").innerHTML =
    `<table class="relevance-metrics"><caption>60 studies · ${state.revealed ? "true effect of A: 2" : "causal truth not revealed"}</caption><thead><tr><th scope="col">Across studies</th><th scope="col">A only</th><th scope="col">A + V</th></tr></thead><tbody><tr><th scope="row">Mean effect estimate</th>${batch.map((b) => `<td>${fmt(b.effect.mean)}</td>`).join("")}</tr><tr><th scope="row">Effect estimate SD</th>${batch.map((b) => `<td>${fmt(b.effect.sd)}</td>`).join("")}</tr><tr><th scope="row">Mean prediction RMSE</th>${batch.map((b) => `<td>${fmt(b.prediction.mean)}</td>`).join("")}</tr></tbody></table><p class="small">Seeds 100–159. SD measures spread across studies, not uncertainty about the causal graph. Smaller prediction RMSE does not establish less bias.</p>`;
}

function render() {
  const world = worlds[currentWorld()];
  el("comparison-title").textContent = `Comparison ${state.pair + 1} of 3`;
  el("comparison-question").textContent = [
    "Does V add useful information for predicting Y?",
    "Must a useful predictor cause Y? World 1 keeps the previous comparison’s World 2.",
    "Does better prediction mean safer adjustment? World 1 keeps the previous comparison’s World 2.",
  ][state.pair];
  el("previous").disabled = state.pair === 0;
  el("next").disabled = state.pair === 2;
  document
    .querySelectorAll('[name="world"]')
    .forEach((radio) => (radio.checked = Number(radio.value) === state.choice));
  result.fits.forEach((fit, i) => {
    el(`prediction-${i}`).textContent = fmt(fit.rmse);
    const comparison = effectComparison(fit.effect, result.truth);
    el(`effect-${i}`).innerHTML = state.revealed
      ? `<span class="comparison-value" style="--error-tint:${comparison.tint}%"><strong>${fmt(fit.effect)}</strong><small>${comparison.difference}</small></span>`
      : fmt(fit.effect);
  });
  el("reveal").setAttribute("aria-expanded", String(state.revealed));
  el("reveal").textContent = state.revealed
    ? "Return to analyst view"
    : "Reveal the toy world";
  el("world-truth").hidden = !state.revealed;
  // Clear the hidden content too: analyst mode must not expose truth to assistive tools.
  el("world-title").textContent = state.revealed ? world.title : "";
  el("world-graph").innerHTML = state.revealed ? graph(world) : "";
  el("world-explanation").textContent = state.revealed ? world.explanation : "";
  el("adjustment-path").textContent = state.revealed ? world.adjustment : "";
  el("causal-truth").textContent = state.revealed
    ? `True total effect of A: 2. V’s direct effect on Y: ${result.vEffect}. V’s total effect on Y: ${result.vEffect}. ${result.vEffect ? "V has a directed path to Y." : "V has no directed path to Y."} V effects refer to a one-unit increase.`
    : "";
  el("sample").textContent = `Sample ${state.seed} · 2,400 people`;
  renderBatch();
}

function clearStudies() {
  runId++;
  batch = null;
  el("repeat").disabled = false;
  el("study-status").textContent = "";
  el("studies").open = false;
}

function changeWorld() {
  clearStudies();
  state.revealed = false;
  result = relevanceSample({ world: currentWorld(), seed: state.seed });
  render();
}

document.querySelectorAll('[name="world"]').forEach((radio) =>
  radio.addEventListener("change", () => {
    state.choice = Number(radio.value);
    changeWorld();
  }),
);
for (const [id, step] of [
  ["previous", -1],
  ["next", 1],
])
  el(id).addEventListener("click", () => {
    state.pair += step;
    state.choice = 0;
    changeWorld();
  });
el("reveal").addEventListener("click", () => {
  state.revealed = !state.revealed;
  render();
});
el("redraw").addEventListener("click", () => {
  state.seed++;
  result = relevanceSample({ world: currentWorld(), seed: state.seed });
  render();
});
el("reset").addEventListener("click", () => {
  Object.assign(state, { pair: 0, choice: 0, seed: 4217 });
  el("practice-feedback").textContent = "";
  document
    .querySelectorAll("[data-answer]")
    .forEach((button) => button.removeAttribute("aria-pressed"));
  changeWorld();
});
el("repeat").addEventListener("click", async () => {
  const current = ++runId;
  const world = currentWorld();
  const effects = [[], []],
    predictions = [[], []];
  batch = null;
  renderBatch();
  el("repeat").disabled = true;
  try {
    for (let i = 0; i < 60; i++) {
      if (current !== runId) return;
      const study = relevanceSample({ world, seed: 100 + i });
      study.fits.forEach((fit, j) => {
        effects[j].push(fit.effect);
        predictions[j].push(fit.rmse);
      });
      el("study-status").textContent = `${i + 1} of 60 studies`;
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    if (current !== runId) return;
    batch = effects.map((values, i) => ({
      effect: studySummary(values),
      prediction: studySummary(predictions[i]),
    }));
    el("study-status").textContent = "60 studies complete.";
    renderBatch();
  } finally {
    if (current === runId) el("repeat").disabled = false;
  }
});

const feedback = {
  include:
    "Better prediction is not enough. In comparison 3, a baseline collider predicts Y but adjusting for it opens a biasing path. Ask how the biomarker is generated and what paths conditioning on it would open or block.",
  exclude:
    "Not causing Y does not make a variable useless. A proxy can carry information about a hidden cause, as in comparison 2. Whether to adjust still requires a causal argument; proxy adjustment is not guaranteed to remove bias.",
  unknown:
    "Yes. Predictive usefulness is established for the tested setting; adjustment safety is not. Use study design and knowledge of the biomarker’s causes and effects to assess plausible graphs and adjustment sets.",
};
document.querySelectorAll("[data-answer]").forEach((button) =>
  button.addEventListener("click", () => {
    document
      .querySelectorAll("[data-answer]")
      .forEach((answer) =>
        answer.setAttribute("aria-pressed", String(answer === button)),
      );
    el("practice-feedback").textContent = feedback[button.dataset.answer];
  }),
);
document.title = "Does this variable matter? · Causal Sandbox";
changeWorld();
document.querySelector("h1").focus();
