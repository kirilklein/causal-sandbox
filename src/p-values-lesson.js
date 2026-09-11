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
import { fmt, fmtBound, pLabel, nullPlot } from "./uncertainty-view.js";

document.title = "What does a p-value tell us? — Causal Sandbox";
document.querySelector("#app").innerHTML =
  `<div class="instrument-page inference-page">
  <header class="lesson-header"><a class="brand" href="./">${icon}<span>Causal Sandbox</span></a><a href="?sandbox">Explore scenarios ↗</a>${themeControl()}</header>
  <main class="learning">
    ${lessonNavigation({ currentOptional: "p-values" })}
    <p class="eyebrow">OPTIONAL · AFTER UNCERTAINTY</p>
    <h1 tabindex="-1">What does a p-value tell us?</h1>
    <p class="small">Definitions: <a href="glossary/#p-value">p-value</a> · <a href="glossary/#confidence-interval">confidence interval</a>.</p>
    <p class="intro">If the effect were zero, how unusual would a result this extreme be? A p-value answers that question under the null hypothesis and the other analysis assumptions.</p>
    <p class="small">Start with <a href="?lesson=uncertainty">confidence intervals and uncertainty</a> if <a href="glossary/#standard-error">standard errors</a> and repeated studies are new to you.</p>
    <section class="panel" aria-labelledby="null-title">
      <h2 id="null-title">1. Build a zero-effect world</h2>
      <p>Use the same study design as the uncertainty lesson: 200 independent people, randomized treatment, and a risk score that affects outcome. Now set the treatment effect to zero. This is our <strong>null hypothesis</strong>.</p>
      <p>Repeat the study. Each sample can still have a nonzero outcome difference. Divide that difference by its estimated standard error to get <strong>z</strong>: how far the estimate is from zero in standard-error units.</p>
      <div id="null-plot"></div>
      <p id="observed-p" class="inference-takeaway" role="status" hidden></p>
      <p class="small">The curve is the standard normal approximation to z under the null. The dots below it are actual simulated null-study statistics; vertical position only separates them. Values beyond ±4 are placed at the plot edge.</p>
      <div class="actions"><button id="repeat-null" class="primary">Repeat 100 null studies</button></div>
      <p id="null-summary" role="status"></p>
      <details><summary>Inspect the null studies</summary><div id="null-values" class="table-wrap"></div></details>
    </section>
    <section class="panel" aria-labelledby="observed-title">
      <h2 id="observed-title">2. Compare one observed result</h2>
      <p>This separate simulated study has an unknown effect for the analyst. Estimate its outcome difference and standard error, then compare its z statistic with the zero-effect reference above.</p>
      <div id="observed-result" aria-live="polite"></div>
      <div class="actions"><button id="compare-observed" class="primary">Locate this result in the null world</button><button id="redraw-observed">Redraw observed study</button></div>
      <div id="p-interpretation" hidden>
        <p>The two shaded tails contain z values at least as far from zero as the observed z, in either direction. Their combined area is the <strong>two-sided p-value</strong>.</p>
        <p>We calculate this area from the normal approximation, not by counting a small batch of dots. A batch can contain no equally extreme dots even when p is positive.</p>
        <p id="observed-interval-note"></p>
      </div>
    </section>
    <section class="panel" aria-labelledby="precision-title">
      <h2 id="precision-title">3. Same estimated effect, different precision</h2>
      <p>This is an illustrative comparison of study summaries. Keep the estimated difference at +0.35 and increase the sample size. Outcome spread and treatment proportions are held fixed; the standard error scales as 1/√n. These summaries are not newly simulated data.</p>
      <div class="inference-controls">
        <div><label for="p-n">People per study <output id="p-n-value" for="p-n"></output></label><input id="p-n" type="range" min="200" max="3200" step="50" value="200"></div>
        <div><label for="p-estimate">Estimated difference <output id="p-estimate-value" for="p-estimate"></output></label><input id="p-estimate" type="range" min="-1" max="1" step="0.01" value="0.35"></div>
      </div>
      <div id="precision-result" aria-live="polite"></div>
      <div id="precision-null-plot"></div>
      <p id="precision-note" role="status"></p>
      <p>Then move the estimate slowly through zero and across the p = 0.05 boundary. The evidence changes continuously. Nothing special happens to the magnitude or practical importance of the effect at that cutoff.</p>
      <p class="inference-takeaway">A larger study can give a smaller p-value for the same estimated effect. A tiny effect can have a tiny p-value. Read the magnitude and interval together, then ask whether the effect matters.</p>
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
    ? `<div class="inference-result"><div><span>Estimated mean difference</span><strong>${fmt(result.estimate)}</strong></div><div><span>95% confidence interval</span><strong>${fmtBound(result.lower)} to ${fmtBound(result.upper)}</strong></div></div><p class="small">Standard error ${fmt(result.se)} · z = ${fmt(result.z)}</p>`
    : `<p>Unavailable: ${result.reason}</p>`;
}
function intervalNote(result) {
  return `The matching 95% interval ${result.lower <= 0 && result.upper >= 0 ? "includes" : "excludes"} zero. Two-sided p ${pLabel(result.p)}. This does not decide whether the effect is practically important.`;
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
    el("observed-p").textContent =
      `Two-sided p ${pLabel(observed.p)}: the combined shaded tails. Under a zero difference and the other analysis assumptions, approximately ${(100 * observed.p).toFixed(2)}% of repeated-study z statistics would be at least this far from zero.${Math.abs(observed.z) > 4 ? " The statistic is beyond the plotted range; the p-value includes the full tails." : ""}`;
    el("observed-interval-note").textContent = intervalNote(observed);
  }
}
function renderPrecision() {
  const n = Number(el("p-n").value);
  const estimate = Number(el("p-estimate").value);
  const result = normalInference(estimate, referenceSE * Math.sqrt(200 / n));
  el("p-n-value").textContent = n;
  el("p-estimate-value").textContent = fmt(estimate);
  el("precision-result").innerHTML = resultHtml(result);
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
    `${below} of ${valid.length} zero-effect studies have p < 0.05 in this batch. The long-run rate is approximately 5% under the assumptions; it is not fixed at five per batch. ${100 - valid.length} studies unavailable.`;
  el("null-values").innerHTML =
    `<table><caption>Latest 100 null studies</caption><thead><tr><th scope="col">Seed</th><th scope="col">Estimate</th><th scope="col">z</th><th scope="col">p</th></tr></thead><tbody>${nullStudies.map((s) => `<tr><th scope="row">${s.seed}</th>${s.status === "ok" ? `<td>${fmt(s.estimate)}</td><td>${fmt(s.z)}</td><td>${pLabel(s.p)}</td>` : '<td colspan="3">Unavailable</td>'}</tr>`).join("")}</tbody></table>`;
  el("repeat-null").textContent = "Run another 100 null studies";
  renderObserved();
  capture("simulation_run", { lesson: "p-values", action: "repeat-null" });
});
el("compare-observed").addEventListener("click", () => {
  compared = true;
  renderObserved();
  el("null-title").scrollIntoView({ block: "start" });
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
