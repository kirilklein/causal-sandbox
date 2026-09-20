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
  uncertaintyRows,
  bootstrapDifference,
  coverageSummary,
} from "./uncertainty.js";
import {
  fmt,
  intervalPlot,
  bootstrapPlot,
  resampleTrace,
  assignmentGraph,
  openingPlot,
} from "./uncertainty-view.js";

document.title = "How uncertain is this estimate? — Causal Sandbox";
document.querySelector("#app").innerHTML =
  `<div class="instrument-page inference-page">
  <header class="lesson-header"><a class="brand" href="./">${icon}<span>Causal Sandbox</span></a><a href="?sandbox">Explore scenarios ↗</a>${themeControl()}</header>
  <main class="learning">
    ${lessonNavigation({ position: coreLessons.findIndex(([, slug]) => slug === "uncertainty") })}
    <p class="eyebrow">ONE STUDY · REPEATED STUDIES · LIMITS</p>
    <h1 tabindex="-1">How uncertain is this estimate?</h1>
    <p class="intro">A study estimates an effect—but is it distinguishable from zero?</p>
    <section id="opening-section" class="panel" aria-labelledby="opening-title">
      <div class="experiment-heading"><h2 id="opening-title">Is there an effect?</h2><span class="experiment-tag">Illustrative study summaries</span></div>
      <div id="opening-plot"></div>
      <p id="opening-prompt" class="inference-prompt" role="status"></p>
      <div class="actions"><button id="opening-next">Compare a larger estimate →</button></div>
      <div id="opening-conclusion" hidden>
        <p><strong>A excludes zero. B is compatible with zero.</strong> Distance from zero alone was not enough; we needed the uncertainty interval.</p>
        <p class="small">Including zero does not prove no effect. These interpretations depend on the analysis assumptions.</p>
        <a href="#single-title">What does 95% confidence mean? ↓</a>
      </div>
    </section>
    <section id="single-section" class="panel" aria-labelledby="single-title" hidden>
      <div class="experiment-heading"><h2 id="single-title" tabindex="-1">1. What does 95% confidence mean?</h2><span class="experiment-tag">Randomized · 200 people per sample</span></div>
      <div class="plot-legend"><span>● Estimate + 95% interval</span><span class="legend-truth">┊ True effect: 2</span><span class="legend-miss">╌ Misses the true effect</span></div>
      <div class="sampling-stage">
        <div id="single-plot"></div>
        <p id="sampling-prompt"><span>New sample. New estimate.<br>Does its interval cross the line?</span></p>
      </div>
      <div class="actions"><button id="reveal-coverage" class="primary">Repeat to 100 samples →</button><button id="uncertainty-redraw">Start with a new sample</button></div>
      <p id="sampling-progress" class="small"></p>
      <div id="coverage-section" hidden>
        <div id="coverage-summary" role="status"></div>
        <p class="inference-prompt">About 95% in the long run—under the assumptions.</p>
        <div class="actions"><button id="show-precision" class="primary">Make the studies bigger →</button></div>
      </div>
      <details><summary>Where does the interval come from?</summary>
        <p>A <a href="glossary/#standard-error">standard error</a> estimates how much this estimate would vary across samples. It uses outcome variation and the number of people in each group.</p>
        <p><strong>95% interval ≈ estimate ± 1.96 × standard error.</strong> This is a large-sample normal approximation. <code>SE = √(s₁²/n₁ + s₀²/n₀)</code>, where s is each group's outcome SD and n its size.</p>
        <p>Outcome SD describes differences among people; SE describes sampling uncertainty in an estimate. A <a href="glossary/#confidence-interval">confidence interval</a> is not a range of individual outcomes or treatment effects.</p>
        <p id="single-result" class="small"></p><p id="uncertainty-sample" class="small"></p>
      </details>
      <details><summary>Why not exactly 95%?</summary>
        <p>The percentage varies from batch to batch. The 95% describes the interval procedure's long-run coverage, not the probability that the fixed effect lies inside one observed interval.</p>
        <p>Each row is a fresh population sample with its own standard error. All 100 intervals remain on the graph. Arrows mark bounds beyond the fixed axis. We know the true effect here because this is a simulation.</p>
      </details>
    </section>
    <section id="precision-section" class="panel" aria-labelledby="precision-title" hidden>
      <h2 id="precision-title" tabindex="-1">2. Narrower. But closer?</h2>
      <div class="inference-controls">
        <div><label for="uncertainty-n">People per study <output id="uncertainty-n-value" for="uncertainty-n">200</output></label><input id="uncertainty-n" type="range" min="200" max="3200" step="200" value="200"></div>
        <label><input id="uncertainty-confounded" type="checkbox"> Add confounding: risk score also affects treatment</label>
      </div>
      <div id="precision-dag"></div><p id="precision-world" class="small"></p>
      <div id="precision-plot"></div>
      <div id="precision-summary" role="status"></div>
      <p id="precision-takeaway" class="inference-prompt"></p>
      <details><summary>What changes—and what stays fixed?</summary>
        <p>Each setting uses the same 50 study seeds and a true effect of 2. The analysis remains an unadjusted mean difference. Larger samples usually narrow intervals; they do not remove confounding.</p>
        <p>Under confounding, these intervals describe the population association and can miss the causal effect. An interval's width measures precision, not causal validity.</p>
      </details>
    </section>
    <details id="bootstrap" class="panel"><summary>Optional: reuse the people you already have</summary>
      <h2>One study → resample → estimate</h2>
      <p class="small">A <a href="glossary/#bootstrap">bootstrap</a> redraws people from the observed study, with replacement.</p>
      <div class="inference-controls"><label><input id="bootstrap-confounded" type="checkbox"> Use a confounded study</label></div>
      <p id="bootstrap-source" class="small"></p>
      <div class="plot-legend"><span>Original → resample</span><span>First 6 of 200 people</span><span class="arm-key-0">○ Untreated</span><span class="arm-key-1">□ Treated</span></div>
      <div id="bootstrap-trace"></div>
      <div class="actions"><button id="draw-bootstrap">Draw one resample</button><button id="run-bootstrap" class="primary" disabled>Show 10 resamples →</button><button id="finish-bootstrap" hidden>Build to 1,000</button></div>
      <p id="bootstrap-counts" class="small" role="status"></p><p id="bootstrap-error" role="status"></p>
      <div id="bootstrap-results" hidden>
        <div id="bootstrap-plot"></div>
        <div class="plot-legend"><span>│ Observed estimate</span><span class="legend-truth">┊ Causal effect: 2</span><span>● First resample</span></div>
        <div id="bootstrap-summary" aria-live="polite"></div>
        <p id="bootstrap-takeaway" class="inference-prompt"></p>
      </div>
      <details><summary>What the bootstrap tells us</summary>
        <ul>
          <li>The spread estimates sampling uncertainty. More resamples stabilize that estimate; they add no new people.</li>
          <li>Resampling does not repair confounding or selection bias. It must preserve dependence, such as clusters or repeated observations.</li>
          <li>This distribution follows the observed estimate. The <a href="?lesson=p-values">p-value lesson</a> uses a zero-effect null distribution.</li>
        </ul>
        <p><a href="https://arxiv.org/abs/1411.5279">Hesterberg: What Teachers Should Know about the Bootstrap</a>.</p>
      </details>
    </details>
    <details id="uncertainty-caveats"><summary>What this interval does—and does not—tell us</summary>
      <p>Its width measures precision for this target and method. It does not automatically account for unmeasured confounding, selection bias, measurement error, or choosing an analysis after seeing its results. A narrow interval does not establish causality.</p>
      <p>It is not an interval containing 95% of future study estimates, nor 95% of people's treatment effects. A Bayesian credible interval answers a different probability question using a model and prior distribution.</p>
      <p>Including zero does not establish no effect. For example, an estimate of +2 with an interval from −1 to +5 leaves room for a small negative effect and a substantial positive one under the analysis assumptions. Excluding zero does not establish practical importance. Values just outside a boundary are not suddenly impossible.</p>
      <p>These intervals assume independent people, adequate group sizes, and finite outcome variances. Clustered or repeated observations need an analysis that accounts for their dependence. Other causal estimators need their own uncertainty calculations.</p>
    </details>
    <section id="uncertainty-check" class="panel inference-check" aria-labelledby="uncertainty-check-title" hidden>
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
let studies = [single];
let samplingFrame;
let samplingRunning = false;
let nextStudySeed = 12000;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let precisionStudies = [];

let openingStage = 0;
function renderOpening() {
  el("opening-plot").innerHTML = openingPlot(
    openingStage,
    width("opening-plot"),
  );
  el("opening-prompt").textContent = [
    "Close to zero. Is that enough to say there is no effect?",
    "Farther from zero. Is that enough to say there is an effect?",
    "Now include uncertainty: which interval crosses zero?",
  ][openingStage];
  el("opening-next").textContent =
    openingStage === 0
      ? "Compare a larger estimate →"
      : "Reveal 95% intervals →";
  el("opening-next").hidden = openingStage === 2;
  el("opening-conclusion").hidden = openingStage !== 2;
  el("single-section").hidden = openingStage !== 2;
}
el("opening-next").addEventListener("click", () => {
  openingStage++;
  renderOpening();
  renderSingle();
  capture("simulation_run", {
    lesson: "uncertainty",
    action: openingStage === 1 ? "compare-estimates" : "reveal-intervals",
  });
});

function renderSingle() {
  el("single-result").textContent =
    single.status === "ok"
      ? `Estimate ${fmt(single.estimate)} · SE ${fmt(single.se)} · outcome units`
      : `Unavailable: ${single.reason}`;
  el("single-plot").innerHTML = intervalPlot(studies, {
    truth: true,
    width: width("single-plot"),
    rowGap: 3.5,
    maxRows: 100,
    fixedRows: 100,
  });
  const summary = coverageSummary(studies);
  el("sampling-progress").textContent =
    `${studies.length} / 100 samples · ${summary.covered} ${summary.covered === 1 ? "crosses" : "cross"} the line${summary.unavailable ? ` · ${summary.unavailable} unavailable` : ""}`;
  el("sampling-prompt").hidden = studies.length > 1 || samplingRunning;
  el("sampling-progress").hidden = studies.length === 100 && !samplingRunning;
  el("single-plot").setAttribute("aria-busy", String(samplingRunning));
  el("uncertainty-sample").textContent =
    `200 people · sample seed ${single.seed}`;
}

function coverageReadout(summary) {
  const rate = summary.valid ? (100 * summary.covered) / summary.valid : 0;
  return `<div class="coverage-readout"><strong>${summary.covered} of ${summary.valid}</strong><span>cover truth · ${summary.valid - summary.covered} miss${summary.unavailable ? ` · ${summary.unavailable} unavailable` : ""}</span><div class="coverage-bar" aria-hidden="true"><span style="width:${rate}%"></span></div></div>`;
}

function finishSampling() {
  samplingRunning = false;
  cancelAnimationFrame(samplingFrame);
  renderSingle();
  const summary = coverageSummary(studies);
  const rate = summary.valid
    ? Math.round((100 * summary.covered) / summary.valid)
    : 0;
  el("coverage-summary").innerHTML =
    `<div class="coverage-readout"><strong>${rate}%</strong><span>${summary.covered} of ${summary.valid} intervals crossed the line${summary.unavailable ? ` · ${summary.unavailable} unavailable` : ""}.</span><div class="coverage-bar" aria-hidden="true"><span style="width:${rate}%"></span></div></div>`;
  el("coverage-section").hidden = false;
  el("reveal-coverage").textContent = "Run another 100 samples";
  el("reveal-coverage").disabled = false;
  el("uncertainty-redraw").disabled = false;
}

function repeatSamples() {
  if (samplingRunning) return;
  // Keep the observed sample as the first interval in each batch.
  studies = [single];
  const batch = [
    single,
    ...Array.from({ length: 99 }, () =>
      uncertaintyStudy({ ...uncertaintyBaseline, seed: nextStudySeed++ }),
    ),
  ];
  samplingRunning = true;
  el("coverage-section").hidden = true;
  el("reveal-coverage").hidden = false;
  el("reveal-coverage").disabled = true;
  el("reveal-coverage").textContent = "Drawing samples…";
  el("uncertainty-redraw").disabled = true;
  renderSingle();
  const start = performance.now();
  function frame(now) {
    const fraction = Math.min(1, (now - start) / 2800);
    const count = reducedMotion.matches
      ? 100
      : 1 + Math.floor(99 * fraction ** 3);
    if (count !== studies.length) {
      studies = batch.slice(0, count);
      renderSingle();
    }
    if (count === 100) finishSampling();
    else samplingFrame = requestAnimationFrame(frame);
  }
  samplingFrame = requestAnimationFrame(frame);
  capture("simulation_run", {
    lesson: "uncertainty",
    action: "repeat-studies",
  });
}

function renderPrecision() {
  if (!precisionStudies.length) return;
  el("precision-plot").innerHTML = intervalPlot(precisionStudies, {
    truth: true,
    width: width("precision-plot"),
    rowGap: 5,
  });
  const valid = precisionStudies.filter((s) => s.status === "ok");
  const summary = coverageSummary(precisionStudies);
  const meanWidth =
    valid.reduce((sum, s) => sum + s.upper - s.lower, 0) / valid.length;
  el("precision-summary").innerHTML =
    `${coverageReadout(summary)}<p class="small">Average interval width: ${fmt(meanWidth)} outcome units</p>`;
  el("precision-takeaway").textContent = el("uncertainty-confounded").checked
    ? "More people. Narrow intervals. Confounding stays."
    : "More people → less sampling spread.";
}

function updatePrecision() {
  const n = Number(el("uncertainty-n").value);
  const selection = el("uncertainty-confounded").checked ? 1.2 : 0;
  el("uncertainty-n-value").textContent = n;
  el("precision-dag").innerHTML = assignmentGraph(Boolean(selection));
  el("precision-world").textContent = selection
    ? "C confounds the comparison. Analysis: no adjustment."
    : "Randomized treatment. Analysis: no adjustment.";
  precisionStudies = Array.from({ length: 50 }, (_, i) =>
    uncertaintyStudy({ ...uncertaintyBaseline, n, selection, seed: 9000 + i }),
  );
  renderPrecision();
}

let bootstrapRows;
let bootstrapResult;
let bootstrapCount = 0;
let bootstrapSeed = 7300;

function resetBootstrap() {
  const selection = el("bootstrap-confounded").checked ? 1.2 : 0;
  bootstrapRows = uncertaintyRows({ selection, seed: state.seed });
  bootstrapResult = null;
  bootstrapCount = 0;
  bootstrapSeed = 7300;
  el("bootstrap-results").hidden = true;
  el("bootstrap-error").textContent = "";
  el("bootstrap-counts").textContent = "";
  el("draw-bootstrap").textContent = "Draw one resample";
  el("run-bootstrap").disabled = true;
  el("run-bootstrap").textContent = "Show 10 resamples →";
  el("finish-bootstrap").hidden = true;
  const treated = bootstrapRows.filter((row) => row.A === 1).length;
  el("bootstrap-source").textContent =
    `200 people · ${treated} treated · ${200 - treated} untreated`;
  el("bootstrap-trace").innerHTML = resampleTrace(bootstrapRows);
}

function renderBootstrap() {
  if (!bootstrapResult) return;
  const b = bootstrapResult;
  el("bootstrap-trace").innerHTML = resampleTrace(bootstrapRows, b.firstCounts);
  const distinct = b.firstCounts.filter((count) => count > 0).length;
  el("bootstrap-counts").textContent =
    `First resample: 200 draws · ${distinct} different people · ${200 - distinct} omitted · estimate ${fmt(b.estimates[0])}.`;
  el("bootstrap-results").hidden = bootstrapCount < 10;
  el("run-bootstrap").disabled = bootstrapCount >= 1000;
  el("run-bootstrap").textContent =
    bootstrapCount < 10
      ? "Show 10 resamples →"
      : bootstrapCount >= 1000
        ? "1,000 resamples complete"
        : "Add 10 resamples";
  el("finish-bootstrap").hidden = bootstrapCount < 20 || bootstrapCount >= 1000;
  if (bootstrapCount < 10) return;
  el("bootstrap-plot").innerHTML = bootstrapPlot(b, width("bootstrap-plot"));
  el("bootstrap-summary").innerHTML =
    `<div class="inference-result"><div><span>Spread of ${bootstrapCount.toLocaleString("en-US")} estimates<br>Bootstrap SE</span><strong>${fmt(b.se)}</strong></div><div><span>Formula SE<br>Same observed study</span><strong>${fmt(b.observed.se)}</strong></div></div><p class="small">Same 200 people · fixed −1 to 5 axis</p>`;
  el("bootstrap-takeaway").textContent = el("bootstrap-confounded").checked
    ? "Resampling reuses the imbalance."
    : "More resamples stabilize the shape. They do not add new people.";
}

function updateBootstrap(count) {
  // Reusing the seed preserves every earlier draw when extending the batch.
  bootstrapResult = bootstrapDifference(bootstrapRows, {
    seed: bootstrapSeed,
    repetitions: count,
  });
  if (bootstrapResult.status !== "ok") {
    el("bootstrap-error").textContent =
      `Unavailable: ${bootstrapResult.reason}`;
    bootstrapResult = null;
    return;
  }
  bootstrapCount = count;
  el("draw-bootstrap").textContent = "Start with a new resample";
  el("run-bootstrap").disabled = false;
  renderBootstrap();
}
el("bootstrap-confounded").addEventListener("change", resetBootstrap);
el("draw-bootstrap").addEventListener("click", () => {
  if (bootstrapCount) bootstrapSeed++;
  updateBootstrap(1);
  capture("simulation_run", {
    lesson: "uncertainty",
    action: "bootstrap-draw",
  });
});
el("run-bootstrap").addEventListener("click", () => {
  updateBootstrap(
    Math.min(1000, bootstrapCount < 10 ? 10 : bootstrapCount + 10),
  );
  capture("simulation_run", {
    lesson: "uncertainty",
    action: "bootstrap-add-ten",
  });
});
el("finish-bootstrap").addEventListener("click", () => {
  updateBootstrap(1000);
  capture("simulation_run", {
    lesson: "uncertainty",
    action: "bootstrap",
    confounded: el("bootstrap-confounded").checked,
  });
});
el("bootstrap").addEventListener("toggle", () => {
  if (el("bootstrap").open) renderBootstrap();
});
if (location.hash === "#bootstrap") {
  el("bootstrap").open = true;
  el("bootstrap").querySelector("summary").focus();
}
resetBootstrap();

el("uncertainty-redraw").addEventListener("click", () => {
  single = uncertaintyStudy({ ...state, seed: ++state.seed });
  studies = [single];
  el("coverage-section").hidden = true;
  el("reveal-coverage").textContent = "Repeat to 100 samples →";
  renderSingle();
  resetBootstrap();
  capture("simulation_run", { lesson: "uncertainty", action: "redraw" });
});
el("reveal-coverage").addEventListener("click", repeatSamples);
el("show-precision").addEventListener("click", () => {
  el("precision-section").hidden = false;
  el("uncertainty-check").hidden = false;
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
  renderOpening();
  renderSingle();
  renderPrecision();
  renderBootstrap();
});
renderOpening();
renderSingle();
