import "./instrument-lesson.css";
import "./uncertainty.css";
import "./double-ml.css";
import { themeControl } from "./theme.js";
import icon from "./brand.svg?raw";
import { capture } from "./events.js";
import {
  lessonNavigation,
  setupLessonNavigation,
} from "./lesson-navigation.js";
import { recordPredictionAnswer } from "./progress.js";
import {
  doubleMlBaseline,
  doubleMlSample,
  doubleMlEstimates,
  doubleMlStudies,
  doubleMlSummary,
  outcomeNeighbors,
  zoomRows,
  typicalRow,
} from "./double-ml.js";
import { fmt, intervalPlot } from "./uncertainty-view.js";
import {
  estimatorStrips,
  residualPlot,
  foldSchematic,
  predictionZoom,
  coverageReadout,
  coverageByFlexibility,
} from "./double-ml-view.js";

const STUDIES = 200;
const ZOOM = 30;
const kValues = [1, 2, 3, 5, 10, 20, 40];
const sample = doubleMlSample();
const one = doubleMlEstimates(sample, { outcomeK: 1 });
const focus = typicalRow(sample, one);

document.title = "Why does causal ML need cross-fitting? — Causal Sandbox";
document.querySelector("#app").innerHTML =
  `<div class="instrument-page inference-page dml-page">
  <header class="lesson-header"><a class="brand" href="./">${icon}<span>Causal Sandbox</span></a><a href="?sandbox">Explore scenarios ↗</a>${themeControl()}</header>
  <main class="learning">
    ${lessonNavigation({ currentOptional: "double-ml" })}
    <p class="eyebrow">OPTIONAL · AFTER TMLE</p>
    <h1 tabindex="-1">Why does causal ML need cross-fitting?</h1>
    <p>Same world as the <a href="aipw-double-robustness/">double-robustness lesson</a>: C is measured, there is no hidden confounding, and the true average effect is 2. We learn the outcome and treatment models with a flexible learner, k-nearest neighbours, instead of a regression formula.</p>
    <section class="panel inference-check" aria-labelledby="dml-predict-title">
      <h2 id="dml-predict-title">Predict first</h2>
      <p>A very flexible outcome model reproduces each person's own outcome. We plug it into the AIPW score, using the same people it was trained on. Across many studies, what happens?</p>
      <button data-answer="0" aria-pressed="false">Estimates and 95% intervals both behave well.</button>
      <button data-answer="1" aria-pressed="false">Estimates centre near the truth, but intervals are too narrow.</button>
      <button data-answer="2" aria-pressed="false">The score cannot be computed.</button>
      <p id="dml-feedback" role="status"></p>
    </section>

    <section class="panel" aria-labelledby="smooth-title">
      <div class="experiment-heading"><h2 id="smooth-title">1. Smoothing biases a plug-in estimate</h2><span class="experiment-tag">${STUDIES} studies · ${doubleMlBaseline.n} people · 40 neighbours</span></div>
      <p>Averaging 40 neighbours flattens the curved outcome where treated and untreated people differ most. The plug-in averages m̂₁(C) − m̂₀(C) and inherits that error.</p>
      <div class="actions"><button id="run-smooth" class="primary">Run ${STUDIES} studies</button></div>
      <div id="smooth-plot" aria-live="polite"></div>
      <p id="smooth-takeaway" class="inference-prompt" hidden>The score adds a weighted average of residuals. Outcome-model errors show up in those residuals and cancel to first order. That is orthogonality.</p>
      <details><summary>What “orthogonal” means here</summary>
        <p>A score is orthogonal (Neyman-orthogonal) when small errors in the nuisance models do not move its average, to first order. For the AIPW score, the leftover bias is roughly the average of (error in m̂) × (error in the propensity). Two moderate errors multiply into a small one.</p>
        <p>The plug-in has no such protection: its bias is the outcome-model error itself.</p>
      </details>
    </section>

    <section class="panel" aria-labelledby="folds-title">
      <div class="experiment-heading"><h2 id="folds-title">2. Can a model grade its own homework?</h2><span class="experiment-tag">One study · 1 neighbour</span></div>
      <p>A flexible model fitted to you can simply remember your outcome. Cross-fitting predicts each person with a model that never saw them.</p>
      <label class="dml-switch"><input id="dml-crossfit" type="checkbox" checked> <span>Cross-fitting (5 folds)</span><span class="small">Flip it and watch the ringed person’s residual.</span></label>
      <div id="fold-schematic" class="dml-blocks" role="list" aria-label="Folds"></div>
      <p id="fold-caption" class="small" role="status"></p>
      <h3 class="plot-heading">One person's prediction</h3>
      <div id="zoom-plot"></div>
      <p id="fold-note" role="status"></p>
      <h3 class="plot-heading">Now everyone: residuals for all ${sample.length}</h3>
      <div id="residual-plot"></div>
      <p class="inference-prompt">Zero residuals erase the score's correction and make it look less variable than it is.</p>
      <details><summary>Read the plots</summary>
        <p>The ringed person is a typical one: an untreated person near the middle of C whose cross-fitted residual is closest to the average residual size. Every person behaves the same way: residual 0 without cross-fitting, an ordinary residual with it.</p>
        <p>The zoom shows the ${ZOOM} untreated people nearest in C (${Math.round(ZOOM / 2)} on narrow screens), from the same sample of ${sample.length}. The dashed steps are the one-neighbour fit: each C takes the outcome of its nearest training person. The vertical segment is the residual, Y − m̂(C). With cross-fitting, hollow points share the ringed person's fold and cannot train its prediction.</p>
        <p>The treatment model is learned the same way, from 60 neighbours. With cross-fitting, every person's outcome and treatment predictions come from models trained on the other four folds.</p>
      </details>
    </section>

    <section class="panel" aria-labelledby="coverage-title">
      <div class="experiment-heading"><h2 id="coverage-title">3. Do the intervals cover the truth?</h2><span class="experiment-tag">${STUDIES} studies · 1 neighbour</span></div>
      <div class="actions"><button id="run-coverage" class="primary">Run ${STUDIES} studies</button></div>
      <div class="paired-inference" id="coverage-plots" hidden>
        <div><p class="plot-heading">No cross-fitting</p><div id="interval-in"></div><div id="coverage-in"></div></div>
        <div><p class="plot-heading">Cross-fitted</p><div id="interval-cross"></div><div id="coverage-cross"></div></div>
      </div>
      <p id="coverage-takeaway" class="inference-prompt" hidden>Both centre near 2. Only the cross-fitted intervals reach about 95%. One study could not show this; the repeated studies do.</p>
      <details><summary>Where the interval comes from</summary>
        <p>Each interval is mean(ψ) ± 1.96 × SD(ψ)/√n, where ψ is a person's score. It is valid when the nuisance predictions do not depend on the person's own outcome and both models are accurate enough. Without cross-fitting, ψ understates the spread.</p>
        <p id="coverage-se"></p>
      </details>
    </section>

    <section class="panel" aria-labelledby="explore-title">
      <div class="experiment-heading"><h2 id="explore-title">4. More flexible models need cross-fitting</h2><span class="experiment-tag">${STUDIES} studies at each k</span></div>
      <div class="actions"><button id="run-explore" class="primary">Run ${STUDIES} studies at each k</button></div>
      <div id="explore-plot"></div>
      <p id="explore-takeaway" class="inference-prompt" hidden>Without cross-fitting, coverage falls as the model gets more flexible. Cross-fitted intervals stay near 95% at every k.</p>
    </section>

    <section class="panel" aria-labelledby="ideas-title">
      <h2 id="ideas-title">Three ideas, three problems</h2>
      <dl class="dml-ideas">
        <dt>Double robustness</dt><dd>The estimate is consistent if either the outcome model or the treatment model is correct. It is about which model is right, not about learning speed.</dd>
        <dt>Orthogonality</dt><dd>Nuisance errors enter only as a product, so moderately accurate flexible learners leave little bias. See section 1.</dd>
        <dt>Cross-fitting</dt><dd>No person's outcome trains their own prediction, so the score and its standard error stay honest even for flexible learners. Sections 2–3.</dd>
      </dl>
      <p><strong>What none of them fixes:</strong> hidden confounding and poor overlap. Here C captures all confounding and every C has both treated and untreated people. With an unmeasured confounder, DML targets the wrong quantity precisely. With poor overlap, the 1/p̂ weights explode, as in the <a href="?lesson=overlap">overlap lesson</a>.</p>
    </section>

    <details><summary>Equations, learner settings, and sources</summary>
      <p><strong>Target.</strong> The average treatment effect E[Y(1) − Y(0)], identified by E[m₁(C) − m₀(C)] under consistency, no interference, exchangeability given C, and positivity. No partially linear model is assumed; effects may vary with C.</p>
      <p><strong>Score.</strong> ψ = m̂₁(C) − m̂₀(C) + A(Y − m̂₁(C))/p̂(C) − (1 − A)(Y − m̂₀(C))/(1 − p̂(C)). The estimate is mean(ψ), SE = SD(ψ)/√n.</p>
      <p><strong>Learners.</strong> m̂ₐ: mean outcome of the k nearest same-arm people on C. p̂: share treated among the 60 nearest people, clipped to [0.02, 0.98]. Cross-fitting uses 5 random folds of 120. The world is Y = 2A + 1.5C + 2(C² − 1) + error, with logit P(A = 1 | C) = −0.8 + 0.8C + 0.9(C² − 1).</p>
      <p><strong>Not universal.</strong> Orthogonality bounds bias by a product of errors, not by zero. If both models oversmooth badly (k = 40 and 120 propensity neighbours), the cross-fitted score is also biased and undercovers. See <a href="https://github.com/kirilklein/causal-sandbox/blob/main/docs/double-ml.md">the validation notes</a>.</p>
      <ul><li><a href="https://academic.oup.com/ectj/article/21/1/C1/5056401">Chernozhukov et al. (2018), Double/debiased machine learning for treatment and structural parameters</a></li><li><a href="https://docs.doubleml.org/stable/guide/basics.html">DoubleML: the basics of double machine learning</a></li><li><a href="https://arxiv.org/abs/2203.06469">Kennedy (2023), Semiparametric doubly robust targeted double machine learning: a review</a></li><li><a href="https://www.causalwizard.app/inference/article/double-ml">Causal Wizard: Double ML</a></li></ul>
    </details>
    <nav class="actions" aria-label="Continue learning"><a href="tmle/">← Return to TMLE</a><button id="restart">Restart lesson</button><a class="primary" href="?lesson=overlap">Continue: Too little overlap →</a></nav>
  </main>
</div>`;
setupLessonNavigation();
capture("lesson_started", { lesson: "double-ml" });
const el = (id) => document.getElementById(id);
const width = (id, min = 260) => Math.max(min, el(id).clientWidth);

const cache = new Map();
function studiesAt(outcomeK) {
  if (!cache.has(outcomeK)) {
    const studies = doubleMlStudies({ outcomeK }, STUDIES);
    cache.set(outcomeK, { studies, summary: doubleMlSummary(studies) });
  }
  return cache.get(outcomeK);
}
// Let the button state paint before a synchronous batch of fits.
const later = (fn) => setTimeout(fn, 20);
function running(button, fn) {
  button.disabled = true;
  button.textContent = "Running…";
  later(() => {
    fn();
    button.hidden = true;
  });
}

let smoothShown = false;
function renderSmooth() {
  if (!smoothShown) return;
  const { studies, summary } = studiesAt(40);
  el("smooth-plot").innerHTML = estimatorStrips(
    studies,
    ["plugIn", "inSample"],
    summary,
    { width: width("smooth-plot") },
  );
  el("smooth-takeaway").hidden = false;
}
el("run-smooth").addEventListener("click", (event) =>
  running(event.currentTarget, () => {
    smoothShown = true;
    renderSmooth();
    capture("simulation_run", { lesson: "double-ml", action: "smooth" });
  }),
);

const foldSizes = [0, 1, 2, 3, 4].map(
  (f) => one.foldOf.filter((v) => v === f).length,
);
const focusFold = one.foldOf[focus];
function renderSchematic() {
  const crossFit = el("dml-crossfit").checked;
  el("fold-schematic").innerHTML = foldSchematic(foldSizes, {
    activeFold: focusFold,
    crossFit,
  });
  const others = [1, 2, 3, 4, 5].filter((f) => f !== focusFold + 1);
  el("fold-caption").textContent = crossFit
    ? `Fold ${focusFold + 1} is predicted by a model trained on folds ${others.join(", ")}. Each fold takes its turn, so everyone gets one prediction from a model that never saw them, and all ${sample.length} enter the final average.`
    : `One model is trained on all ${sample.length} people and then predicts those same people.`;
}

function renderZoom() {
  const crossFit = el("dml-crossfit").checked;
  const [neighbor] = outcomeNeighbors(sample, focus, {
    k: 1,
    foldOf: one.foldOf,
    crossFit,
  });
  // Fewer people on phones so each step of the fit stays visible.
  const windowRows = zoomRows(
    sample,
    focus,
    el("zoom-plot").clientWidth < 520 ? Math.round(ZOOM / 2) : ZOOM,
  );
  const pool = sample.flatMap((p, i) =>
    p.A === 0 && (!crossFit || one.foldOf[i] !== focusFold) ? [i] : [],
  );
  el("zoom-plot").innerHTML = predictionZoom(sample, focus, {
    windowRows,
    pool,
    neighbor,
    heldOut: crossFit
      ? windowRows.filter((i) => one.foldOf[i] === focusFold)
      : [],
    width: width("zoom-plot"),
  });
  const residual = (crossFit ? one.crossFit : one.inSample).residuals[focus];
  el("fold-note").textContent = crossFit
    ? `The ringed person is in fold ${focusFold + 1}, so they are held out. Their prediction comes from the nearest untreated person in another fold: residual ${fmt(residual)}.`
    : `The ringed person helped train the model, and their nearest untreated neighbour is themselves. The fit passes through their outcome: residual ${fmt(residual)}.`;
}
function renderResiduals() {
  const crossFit = el("dml-crossfit").checked;
  el("residual-plot").innerHTML = residualPlot(
    sample,
    (crossFit ? one.crossFit : one.inSample).residuals,
    {
      width: width("residual-plot"),
      label: crossFit ? "Cross-fitted" : "No cross-fitting",
    },
  );
}
el("dml-crossfit").addEventListener("change", () => {
  renderSchematic();
  renderZoom();
  renderResiduals();
  capture("simulation_run", { lesson: "double-ml", action: "toggle-folds" });
});

let coverageShown = false;
function renderCoverage() {
  if (!coverageShown) return;
  const { studies, summary } = studiesAt(1);
  const truth = doubleMlBaseline.effect;
  // Show the container first so the plots measure their real width.
  el("coverage-plots").hidden = false;
  for (const [key, plot, readout] of [
    ["inSample", "interval-in", "coverage-in"],
    ["crossFit", "interval-cross", "coverage-cross"],
  ]) {
    el(plot).innerHTML = intervalPlot(
      studies.map((s) => ({ seed: s.seed, truth, ...s[key] })),
      {
        truth: true,
        width: width(plot, 230),
        rowGap: 3.5,
        maxRows: 100,
        fixedRows: 100,
        domain: [1.2, 2.8],
        ticks: [1.5, 2, 2.5],
      },
    );
    el(readout).innerHTML = coverageReadout(summary, key);
  }
  const se = (key) =>
    `average SE ${fmt(summary[key].meanSE)} against an actual spread of ${fmt(summary[key].sd)}`;
  el("coverage-se").textContent =
    `In these ${STUDIES} studies: without cross-fitting, ${se("inSample")}; cross-fitted, ${se("crossFit")}.`;
  el("coverage-takeaway").hidden = false;
}
el("run-coverage").addEventListener("click", (event) =>
  running(event.currentTarget, () => {
    coverageShown = true;
    renderCoverage();
    capture("simulation_run", { lesson: "double-ml", action: "coverage" });
  }),
);

let exploreShown = false;
function renderExplore() {
  if (!exploreShown) return;
  const points = kValues.map((k) => {
    const { summary } = studiesAt(k);
    return {
      k,
      inSample: summary.inSample.coverage,
      crossFit: summary.crossFit.coverage,
    };
  });
  el("explore-plot").innerHTML = coverageByFlexibility(points, {
    width: width("explore-plot"),
  });
  el("explore-takeaway").hidden = false;
}
el("run-explore").addEventListener("click", (event) =>
  running(event.currentTarget, () => {
    exploreShown = true;
    renderExplore();
    capture("simulation_run", { lesson: "double-ml", action: "explore-k" });
  }),
);

el("restart").addEventListener("click", () => location.reload());
for (const button of document.querySelectorAll("[data-answer]"))
  button.addEventListener("click", () => {
    const choice = Number(button.dataset.answer);
    for (const option of document.querySelectorAll("[data-answer]"))
      option.setAttribute("aria-pressed", String(option === button));
    el("dml-feedback").textContent = [
      "Not quite. The estimates do centre near the truth, but section 3 shows the intervals cover it far less than 95% of the time.",
      "Yes. With one neighbour, each residual is zero, so the score collapses to the plug-in and its standard error is too small. Sections 2 and 3 show why.",
      "It can be computed. The problem is quieter: the residual correction vanishes. Sections 2 and 3 show the consequence.",
    ][choice];
    recordPredictionAnswer(
      "double-ml-reuse",
      "double-ml",
      choice,
      choice === 1,
    );
    capture("lesson_prediction_submitted", {
      lesson: "double-ml",
      selected_choice_index: choice,
      is_correct: choice === 1,
    });
  });

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    renderSmooth();
    renderZoom();
    renderResiduals();
    renderCoverage();
    renderExplore();
  }, 100);
});
renderSchematic();
renderZoom();
renderResiduals();
