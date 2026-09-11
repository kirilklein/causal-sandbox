import "./instrument-lesson.css";
import "./uncertainty.css";
import { themeControl } from "./theme.js";
import icon from "./brand.svg?raw";
import { capture } from "./events.js";
import {
  coreLessons,
  lessonNavigation,
  setupLessonNavigation,
} from "./lesson-navigation.js";
import {
  recordLessonStarted,
  recordLessonCompleted,
  recordPredictionAnswer,
} from "./progress.js";
import {
  uncertaintyBaseline,
  uncertaintyStudy,
  coverageSummary,
} from "./uncertainty.js";
import { fmt, intervalPlot, studyTable } from "./uncertainty-view.js";

document.title = "How uncertain is this estimate? — Causal Sandbox";
document.querySelector("#app").innerHTML =
  `<div class="instrument-page inference-page">
  <header class="lesson-header"><a class="brand" href="./">${icon}<span>Causal Sandbox</span></a><a href="?sandbox">Explore scenarios ↗</a>${themeControl()}</header>
  <main class="learning">
    ${lessonNavigation({ position: coreLessons.findIndex(([, slug]) => slug === "uncertainty") })}
    <p class="eyebrow">ONE STUDY · REPEATED STUDIES · LIMITS</p>
    <h1 tabindex="-1">How uncertain is this estimate?</h1>
    <p class="intro">Estimates change across samples. But usually we have only one study. How precise is its estimate—and what could still make it wrong?</p>
    <section class="panel" aria-labelledby="single-title">
      <h2 id="single-title">1. One study, one interval</h2>
      <p>We want the population's average treatment effect: the average outcome if everyone were treated minus the average if nobody were. We start with random assignment and independent people. The risk score still affects outcome.</p>
      <p>Our estimate is the treated group's mean outcome minus the untreated group's mean. We hide the true effect: a real study cannot look it up.</p>
      <div id="single-result" aria-live="polite"></div>
      <div id="single-plot"></div>
      <p>A confidence interval adds a measure of precision to the point estimate. It describes sampling uncertainty under the analysis assumptions. It is not a range of individual outcomes or individual treatment effects.</p>
      <details><summary>How can one sample give an interval?</summary>
        <p>The variation of outcomes within each treatment group and the number of people in each group let us estimate how much the mean difference would fluctuate across studies. This estimated spread is the <strong>standard error</strong>.</p>
        <p><strong>95% interval ≈ estimate ± 1.96 × standard error.</strong> We use a large-sample normal approximation, not an exact finite-sample guarantee.</p>
        <p><code>SE = √(s₁²/n₁ + s₀²/n₀)</code>, where s₁ and s₀ are the outcome standard deviations and n₁ and n₀ are the group sizes. Outcome SD describes variation among people; SE describes uncertainty in the estimated mean difference.</p>
        <div id="single-values" class="table-wrap"></div>
      </details>
      <div class="actions"><button id="uncertainty-redraw">Redraw this study</button><span id="uncertainty-sample" class="small"></span></div>
      <div class="actions"><button id="reveal-coverage" class="primary">Reveal truth & repeat 50 studies →</button></div>
    </section>
    <section id="coverage-section" class="panel" aria-labelledby="coverage-title" hidden>
      <h2 id="coverage-title" tabindex="-1">2. What does 95% mean?</h2>
      <p>Each row is a new study, with its own estimate and interval calculated from that study's data. The dashed vertical line marks the same true effect in every study.</p>
      <div id="coverage-plot"></div>
      <p id="coverage-summary" class="inference-takeaway" role="status"></p>
      <p class="small">Dots are estimates; horizontal lines are intervals. Red, broken intervals miss the true effect. Arrows mark bounds outside the fixed −1 to 5 axis; exact bounds are below. The chart shows the latest 50 studies; the count includes the whole batch.</p>
      <p>Under the assumptions, this procedure should cover the target in approximately 95% of repeated studies. A batch can cover more or less often. The 95% belongs to the procedure—not a probability assigned to the fixed effect inside this particular observed interval.</p>
      <div class="actions"><button id="repeat-coverage">Add 50 studies</button><button id="show-precision" class="primary">Explore precision & bias →</button></div>
      <details><summary>Inspect all study intervals</summary><div id="coverage-values" class="table-wrap"></div></details>
    </section>
    <section id="precision-section" class="panel" aria-labelledby="precision-title" hidden>
      <h2 id="precision-title" tabindex="-1">3. Can an estimate be precise and wrong?</h2>
      <p>Increase the sample size, then let the risk score influence treatment too. The true treatment effect stays at 2. The analysis still compares the groups without adjustment.</p>
      <div class="inference-controls">
        <div><label for="uncertainty-n">People per study <output id="uncertainty-n-value" for="uncertainty-n">200</output></label><input id="uncertainty-n" type="range" min="200" max="3200" step="200" value="200"></div>
        <label><input id="uncertainty-confounded" type="checkbox"> Risk score also influences treatment</label>
      </div>
      <p id="precision-world"></p>
      <div id="precision-plot"></div>
      <p id="precision-summary" class="inference-takeaway" role="status"></p>
      <p class="small">Each setting recomputes the same 50 study seeds. Changing sample size uses more or fewer people per study; it does not pool studies. Intervals are calculated separately. Larger studies usually give narrower intervals.</p>
      <p>With confounding, a narrow interval can describe the wrong comparison very precisely. It can cover the population association while missing the causal effect. More observations do not remove the confounding.</p>
      <details><summary>Inspect this comparison</summary><div id="precision-values" class="table-wrap"></div></details>
    </section>
    <details id="uncertainty-caveats"><summary>What this interval does—and does not—tell us</summary>
      <p>Its width measures precision for this target and method. It does not automatically account for unmeasured confounding, selection bias, measurement error, or choosing an analysis after seeing its results. A narrow interval does not establish causality.</p>
      <p>It is not an interval containing 95% of future study estimates, nor 95% of people's treatment effects. A Bayesian credible interval answers a different probability question using a model and prior distribution.</p>
      <p>Including zero does not establish no effect. For example, an estimate of +2 with an interval from −1 to +5 leaves room for a small negative effect and a substantial positive one under the analysis assumptions. Excluding zero does not establish practical importance. Values just outside a boundary are not suddenly impossible.</p>
      <p>These intervals assume independent people, adequate group sizes, and finite outcome variances. Clustered or repeated observations need an analysis that accounts for their dependence. Other causal estimators need their own uncertainty calculations.</p>
    </details>
    <section class="panel inference-check" aria-labelledby="uncertainty-check-title">
      <h2 id="uncertainty-check-title">Check your interpretation</h2>
      <p>A large observational study reports an effect of +2.0, with a narrow interval from +1.9 to +2.1. A common cause was not measured. What does the interval establish?</p>
      <button data-answer="0" aria-pressed="false">There is a 95% chance the causal effect is between 1.9 and 2.1.</button>
      <button data-answer="1" aria-pressed="false">The estimate is precise under the analysis assumptions; confounding can still distort it.</button>
      <button data-answer="2" aria-pressed="false">The large sample has removed the confounding.</button>
      <p id="uncertainty-feedback" role="status"></p>
    </section>
    <details><summary>Sources and simulation details</summary>
      <p>This reuses the common-cause lesson's world: C is a bounded risk score with variance 1; Y = 2A + 1.5C + independent noise. Treatment probability is logistic(−0.8 + selection × C), with selection 0 or 1.2. Everyone's treatment effect is 2. The analysis uses only treatment and observed outcome.</p>
      <ul><li><a href="https://miguelhernan.org/whatifbook">Hernán & Robins, Causal Inference: What If, Chapter 10: Random variability</a></li>
      <li><a href="https://link.springer.com/article/10.1007/s10654-016-0149-3">Greenland et al. (2016), A guide to statistical misinterpretations</a></li>
      <li><a href="https://www.bmj.com/content/331/7521/903">Altman & Bland (2005), Standard deviations and standard errors</a></li>
      <li><a href="https://link.springer.com/article/10.1186/s12874-020-01105-9">Rafi & Greenland (2020), Compatibility and surprise</a></li></ul>
    </details>
    <nav class="actions" aria-label="Continue learning"><a id="back" href="?lesson=confounding">← Back</a><button id="restart">Restart lesson</button><a id="continue" class="primary" href="inverse-probability-weighting/">Continue: Adjustment with IPW →</a></nav>
    <aside class="panel" aria-label="Optional exploration"><p class="small">Optional exploration</p><h2><a id="p-values-link" href="?lesson=p-values">What does a p-value tell us? →</a></h2><p>Compare an observed result with a zero-effect world, then connect the tail probability to its interval.</p></aside>
  </main>
</div>`;
setupLessonNavigation();
recordLessonStarted("uncertainty");
capture("lesson_started", { lesson: "uncertainty" });

const el = (id) => document.getElementById(id);
const width = (id) => Math.max(230, el(id).clientWidth);
let state = { ...uncertaintyBaseline };
let single = uncertaintyStudy(state);
let studies = [];
let precisionStudies = [];
let revealed = false;

function renderSingle() {
  el("single-result").innerHTML =
    single.status === "ok"
      ? `<div class="inference-result"><div><span>Estimated mean difference</span><strong>${fmt(single.estimate)}</strong></div><div><span>95% confidence interval</span><strong>${fmt(single.lower)} to ${fmt(single.upper)}</strong></div></div><p class="small">${single.arms[1].n} treated · ${single.arms[0].n} untreated · estimated standard error ${fmt(single.se)} outcome units</p>`
      : `<p>Unavailable: ${single.reason}</p>`;
  el("single-plot").innerHTML = intervalPlot([single], {
    truth: revealed,
    width: width("single-plot"),
  });
  el("single-values").innerHTML = studyTable([single], revealed);
  el("uncertainty-sample").textContent =
    `200 people · sample seed ${single.seed}`;
}

function renderCoverage() {
  if (!revealed) return;
  const summary = coverageSummary(studies);
  el("coverage-plot").innerHTML = intervalPlot(studies, {
    truth: true,
    width: width("coverage-plot"),
  });
  el("coverage-summary").textContent =
    `${summary.covered} of ${summary.valid} intervals cover the true effect of 2 (${((100 * summary.covered) / summary.valid).toFixed(1)}%). ${summary.unavailable} unavailable studies.`;
  el("coverage-values").innerHTML = studyTable(studies, true);
  el("repeat-coverage").disabled = studies.length >= 500;
  el("repeat-coverage").textContent =
    studies.length >= 500
      ? "500 studies complete · restart for a new batch"
      : "Add 50 studies";
}

function renderPrecision() {
  if (!precisionStudies.length) return;
  el("precision-plot").innerHTML = intervalPlot(precisionStudies, {
    truth: true,
    width: width("precision-plot"),
  });
  const valid = precisionStudies.filter((s) => s.status === "ok");
  const summary = coverageSummary(precisionStudies);
  const meanWidth =
    valid.reduce((sum, s) => sum + s.upper - s.lower, 0) / valid.length;
  el("precision-summary").textContent =
    `Average interval width: ${fmt(meanWidth)} outcome units. ${summary.covered} of ${summary.valid} intervals cover the causal effect of 2. ${summary.unavailable} unavailable studies.`;
  el("precision-values").innerHTML = studyTable(precisionStudies, true);
}

function updatePrecision() {
  const n = Number(el("uncertainty-n").value);
  const selection = el("uncertainty-confounded").checked ? 1.2 : 0;
  el("uncertainty-n-value").textContent = n;
  el("precision-world").textContent = selection
    ? "World: C → A, C → Y, A → Y. C now confounds the comparison. Analysis: unadjusted difference in means."
    : "World: A → Y and C → Y; treatment is randomized. Analysis: unadjusted difference in means.";
  precisionStudies = Array.from({ length: 50 }, (_, i) =>
    uncertaintyStudy({ ...uncertaintyBaseline, n, selection, seed: 9000 + i }),
  );
  renderPrecision();
}

el("uncertainty-redraw").addEventListener("click", () => {
  single = uncertaintyStudy({ ...state, seed: ++state.seed });
  renderSingle();
  capture("simulation_run", { lesson: "uncertainty", action: "redraw" });
});
function addStudies() {
  const firstSeed = 12000 + studies.length;
  studies.push(
    ...Array.from({ length: 50 }, (_, i) =>
      uncertaintyStudy({ ...uncertaintyBaseline, seed: firstSeed + i }),
    ),
  );
  renderCoverage();
  capture("simulation_run", {
    lesson: "uncertainty",
    action: "repeat-studies",
  });
}
el("reveal-coverage").addEventListener("click", () => {
  revealed = true;
  el("coverage-section").hidden = false;
  el("reveal-coverage").hidden = true;
  renderSingle();
  addStudies();
  el("coverage-title").focus();
});
el("repeat-coverage").addEventListener("click", addStudies);
el("show-precision").addEventListener("click", () => {
  el("precision-section").hidden = false;
  el("show-precision").hidden = true;
  updatePrecision();
  el("precision-title").focus();
});
el("uncertainty-n").addEventListener("input", updatePrecision);
el("uncertainty-confounded").addEventListener("change", updatePrecision);
el("restart").addEventListener("click", () => location.reload());
for (const id of ["continue", "p-values-link"])
  el(id).addEventListener("click", () => {
    recordLessonCompleted("uncertainty");
    void capture(
      "lesson_advanced",
      { lesson: "uncertainty" },
      { transport: "sendBeacon" },
    );
  });
for (const button of document.querySelectorAll("[data-answer]"))
  button.addEventListener("click", () => {
    const choice = Number(button.dataset.answer);
    for (const option of document.querySelectorAll("[data-answer]"))
      option.setAttribute("aria-pressed", String(option === button));
    el("uncertainty-feedback").textContent = [
      "The 95% refers to coverage across repeated studies under the assumptions, not a probability for this fixed interval. Unmeasured confounding can also invalidate its causal interpretation. Try again.",
      "Yes. Small sampling uncertainty can coexist with systematic bias. The causal interpretation still needs a defensible adjustment set.",
      "More people reduce sampling uncertainty, but do not make the treatment groups comparable on an unmeasured common cause. Try again.",
    ][choice];
    recordPredictionAnswer(
      "uncertainty-interpretation",
      "uncertainty",
      choice,
      choice === 1,
    );
    capture("lesson_prediction_submitted", {
      lesson: "uncertainty",
      selected_choice_index: choice,
      is_correct: choice === 1,
    });
  });
window.addEventListener("resize", () => {
  renderSingle();
  renderCoverage();
  renderPrecision();
});
renderSingle();
