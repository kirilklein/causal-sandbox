import "./instrument-lesson.css";
import "./uncertainty.css";
import { themeControl } from "./theme.js";
import icon from "./brand.svg?raw";
import { capture } from "./events.js";
import {
  lessonNavigation,
  setupLessonNavigation,
} from "./lesson-navigation.js";
import { recordPredictionAnswer } from "./progress.js";
import {
  uncertaintyBaseline,
  uncertaintyStudy,
  normalInference,
} from "./uncertainty.js";
import { fmt, pLabel, nullPlot, estimatePlot } from "./uncertainty-view.js";

document.title = "What does a p-value tell us? — Causal Sandbox";
document.querySelector("#app").innerHTML =
  `<div class="instrument-page inference-page">
  <header class="lesson-header"><a class="brand" href="./">${icon}<span>Causal Sandbox</span></a><a href="?sandbox">Explore scenarios ↗</a>${themeControl()}</header>
  <main class="learning">
    ${lessonNavigation({ currentOptional: "p-values" })}
    <p class="eyebrow">OPTIONAL · AFTER UNCERTAINTY</p>
    <h1 tabindex="-1">What does a p-value tell us?</h1>
    <section class="panel" aria-labelledby="null-title">
      <div class="experiment-heading"><h2 id="null-title">1. How unusual if the effect were zero?</h2><span class="experiment-tag">Randomized · 200 people</span></div>
      <div id="observed-result" aria-live="polite"></div>
      <div class="actions"><button id="compare-observed" class="primary">Place this result on the curve</button><button id="redraw-observed">Draw a new observed study</button></div>
      <div id="null-plot"></div>
      <div id="observed-p" class="p-readout" role="status" hidden></div>
      <div class="actions"><button id="repeat-null">Draw 100 zero-effect studies</button></div>
      <p id="null-summary" class="small" role="status"></p>
      <div id="p-interpretation" hidden><p class="inference-prompt">Both tails: results at least this far from zero.</p><p id="observed-interval-note" class="small"></p></div>
      <details><summary>Read the curve and dots</summary>
        <p>The curve approximates the distribution of z under a zero mean difference. <strong>z = estimate ÷ standard error</strong>: distance from zero in standard-error units. Dots are simulated zero-effect studies; their height just separates them.</p>
        <p>The <a href="glossary/#p-value">two-sided p-value</a> is the combined area beyond ±|observed z|. It comes from the normal curve, not the small batch of dots. Values beyond ±4 sit at the edge; the calculation includes the full tails.</p>
        <p>A batch need not put exactly 5 of 100 dots beyond the p = 0.05 cutoff. Its long-run rate is approximately 5% under the assumptions.</p>
      </details>
    </section>
    <section class="panel" aria-labelledby="precision-title">
      <div class="experiment-heading"><h2 id="precision-title">2. Same estimate. Smaller p-value?</h2><span class="experiment-tag">Illustrative study summaries</span></div>
      <div class="inference-controls">
        <div><label for="p-n">People per study <output id="p-n-value" for="p-n"></output></label><input id="p-n" type="range" min="200" max="3200" step="50" value="200"></div>
        <div><label for="p-estimate">Estimated difference <output id="p-estimate-value" for="p-estimate"></output></label><input id="p-estimate" type="range" min="-1" max="1" step="0.01" value="0.35"></div>
      </div>
      <div class="paired-inference">
        <div><p class="plot-heading">Outcome units</p><div id="precision-interval"></div></div>
        <div><p class="plot-heading">Distance from zero in SE units</p><div id="precision-null-plot"></div></div>
      </div>
      <div id="precision-result" class="p-readout" aria-live="polite"></div>
      <p id="precision-note" class="small" role="status"></p>
      <p class="inference-prompt">The interval narrows. The effect need not grow.</p>
      <details><summary>What is held fixed?</summary>
        <p>This compares illustrative study summaries, not newly simulated datasets. Outcome spread and treatment proportions stay fixed; the standard error scales as 1/√n. Moving the second slider changes the estimated difference.</p>
        <p>Zero sits on the matching 95% interval boundary at p = 0.05. Moving past it changes neither the effect's magnitude nor its practical importance abruptly.</p>
        <p><a href="glossary/#confidence-interval">Confidence intervals</a> and <a href="glossary/#standard-error">standard errors</a> are explored in the <a href="?lesson=uncertainty">uncertainty lesson</a>.</p>
      </details>
    </section>
    <details id="p-caveats"><summary>What a p-value does not mean</summary>
      <ul><li>It is not the probability that the null hypothesis is true.</li><li>It is not the probability that the result happened “by chance.” It is a probability of results at least as extreme under a specified model.</li><li>A small p-value does not establish causality, practical importance, or which assumption is wrong.</li><li>A large p-value does not establish no effect. An imprecise study can leave substantial effects compatible with its data.</li><li>Trying many analyses and reporting the smallest p-value undermines its usual interpretation. The analysis and reporting choices matter.</li></ul>
    </details>
    <section class="panel inference-check" aria-labelledby="p-check-title">
      <h2 id="p-check-title">Check your interpretation</h2>
      <p>Two studies both estimate +0.35 outcome units. The larger study has a narrower interval and a smaller p-value. What changed?</p>
      <button data-answer="0" aria-pressed="false">The larger study estimated a bigger treatment effect.</button>
      <button data-answer="1" aria-pressed="false">The estimated magnitude stayed the same; the larger study estimated it more precisely.</button>
      <button data-answer="2" aria-pressed="false">The smaller p-value proves the result is causal.</button>
      <p id="p-feedback" role="status"></p>
    </section>
    <details><summary>Assumptions, calculation, and sources</summary>
      <p>The test is z = (mean treated − mean untreated) / SE, with SE = √(s₁²/n₁ + s₀²/n₀). Its two-sided p-value is P(|Z| ≥ |z|) for a standard normal Z. The matching 95% interval is estimate ± 1.96 × SE. Both are large-sample approximations, requiring independent people and adequate group sizes.</p>
      <p>The null studies set the causal effect to zero. The observed-study generator sets it to 0.1; this value is not used in its estimate, SE, or p-value. Randomization makes the population outcome difference equal the causal effect here. With confounding, a test of zero outcome difference need not test zero causal effect.</p>
      <p>Exactly at p = 0.05, zero lies on the matching 95% interval boundary. The relation need not hold for an interval and test based on different methods or assumptions.</p>
      <ul><li><a href="https://link.springer.com/article/10.1007/s10654-016-0149-3">Greenland et al. (2016), Statistical tests, P values, confidence intervals, and power: a guide to misinterpretations</a></li><li><a href="https://link.springer.com/article/10.1186/s12874-020-01105-9">Rafi & Greenland (2020), Compatibility and surprise</a></li></ul>
    </details>
    <nav class="actions" aria-label="Continue learning"><a href="?lesson=uncertainty">← Return to uncertainty</a><button id="restart">Restart lesson</button><a class="primary" href="inverse-probability-weighting/">Continue: Adjustment with IPW →</a></nav>
  </main>
</div>`;
setupLessonNavigation();
capture("lesson_started", { lesson: "p-values" });
const el = (id) => document.getElementById(id);
const width = (id) => Math.max(230, el(id).clientWidth);
let nullStudies = [];
let batch = 0;
let seed = uncertaintyBaseline.seed;
let observed = uncertaintyStudy({ ...uncertaintyBaseline, effect: 0.1 });
const referenceSE = observed.se;
let compared = false;

function resultHtml(result) {
  return result.status === "ok"
    ? `<div class="observed-chain"><div><span>Observed estimate</span><strong>${fmt(result.estimate)}</strong></div><span aria-hidden="true">÷</span><div><span>Standard error</span><strong>${fmt(result.se)}</strong></div><span aria-label="approximately">≈</span><div><span>SEs from zero (z)</span><strong>${fmt(result.z)}</strong></div></div>`
    : `<p>Unavailable: ${result.reason}</p>`;
}
function intervalNote(result) {
  return `95% interval ${result.lower <= 0 && result.upper >= 0 ? "includes" : "excludes"} zero · p ${pLabel(result.p)}.`;
}
function renderObserved() {
  const comparison = compared && observed.status === "ok" ? observed : null;
  el("null-plot").innerHTML = nullPlot(
    nullStudies,
    comparison,
    width("null-plot"),
  );
  el("observed-result").innerHTML = resultHtml(observed);
  el("compare-observed").disabled = observed.status !== "ok";
  el("p-interpretation").hidden = !comparison;
  el("observed-p").hidden = !comparison;
  if (comparison) {
    el("observed-p").innerHTML =
      `<strong>p ${pLabel(observed.p)}</strong><span>Combined shaded tails</span>`;
    el("observed-interval-note").textContent = intervalNote(observed);
  }
}
function renderPrecision() {
  const n = Number(el("p-n").value);
  const estimate = Number(el("p-estimate").value);
  const result = normalInference(estimate, referenceSE * Math.sqrt(200 / n));
  el("p-n-value").textContent = n;
  el("p-estimate-value").textContent = fmt(estimate);
  el("precision-interval").innerHTML = estimatePlot(result, {
    domain: [-1.6, 1.6],
    width: width("precision-interval"),
  });
  el("precision-result").innerHTML =
    `<strong>p ${pLabel(result.p)}</strong><span>Estimate ${fmt(estimate)} · SE ${fmt(result.se)}</span>`;
  el("precision-null-plot").innerHTML = nullPlot(
    [],
    result,
    width("precision-null-plot"),
  );
  el("precision-note").textContent =
    intervalNote(result) +
    (Math.abs(result.z) > 4
      ? " The observed statistic is beyond the plotted range; the p-value includes the full tails."
      : "");
}
el("repeat-null").addEventListener("click", () => {
  nullStudies = Array.from({ length: 100 }, (_, i) =>
    uncertaintyStudy({
      ...uncertaintyBaseline,
      effect: 0,
      seed: 20000 + batch * 100 + i,
    }),
  );
  batch += 1;
  const valid = nullStudies.filter((s) => s.status === "ok");
  const below = valid.filter((s) => s.p < 0.05).length;
  el("null-summary").textContent =
    `${below} of ${valid.length} zero-effect studies have p < 0.05.${100 - valid.length ? ` ${100 - valid.length} unavailable.` : ""}`;
  el("repeat-null").textContent = "Run another 100 null studies";
  renderObserved();
  capture("simulation_run", { lesson: "p-values", action: "repeat-null" });
});
el("compare-observed").addEventListener("click", () => {
  compared = true;
  renderObserved();
});
el("redraw-observed").addEventListener("click", () => {
  observed = uncertaintyStudy({
    ...uncertaintyBaseline,
    effect: 0.1,
    seed: ++seed,
  });
  renderObserved();
  capture("simulation_run", { lesson: "p-values", action: "redraw" });
});
for (const id of ["p-n", "p-estimate"])
  el(id).addEventListener("input", renderPrecision);
el("restart").addEventListener("click", () => location.reload());
for (const button of document.querySelectorAll("[data-answer]"))
  button.addEventListener("click", () => {
    const choice = Number(button.dataset.answer);
    for (const option of document.querySelectorAll("[data-answer]"))
      option.setAttribute("aria-pressed", String(option === button));
    el("p-feedback").textContent = [
      "Both estimates are +0.35. A smaller p-value can result from a smaller standard error without a larger estimated effect. Try again.",
      "Yes. The effect estimates are identical, while precision differs. Neither the p-value nor the interval width determines practical importance.",
      "The p-value describes compatibility with a statistical model. It does not establish that confounding or other biases are absent. Try again.",
    ][choice];
    recordPredictionAnswer(
      "p-values-precision",
      "p-values",
      choice,
      choice === 1,
    );
    capture("lesson_prediction_submitted", {
      lesson: "p-values",
      selected_choice_index: choice,
      is_correct: choice === 1,
    });
  });
window.addEventListener("resize", () => {
  renderObserved();
  renderPrecision();
});
renderObserved();
renderPrecision();
