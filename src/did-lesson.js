import "./instrument-lesson.css";
import "./did.css";
import { themeControl } from "./theme.js";
import {
  lessonNavigation,
  setupLessonNavigation,
} from "./lesson-navigation.js";
import {
  didDefaults,
  didWorld,
  estimateDid,
  didHistory,
  didRegression,
} from "./did.js";
import { didChart } from "./did-view.js";
import { effectComparison } from "./effect-comparison.js";
import icon from "./brand.svg?raw";

const steps = [
  "Before & after",
  "The comparison",
  "The missing future",
  "The difference",
  "Break the assumption",
  "Look back in time",
];
const headings = [
  "Recovery improved. Did the program cause it?",
  "Recovery improved elsewhere, too.",
  "Borrow the change, not the outcome.",
  "The remaining gap is the DiD estimate.",
  "What if Hospital A would improve more anyway?",
  "Similar histories help. They do not prove the assumption.",
];
const intros = [
  "Hospital A introduces a new care program. Recovery rises from 40% to 65%. How much of that improvement did the program cause?",
  "Hospital B does not introduce the program. Its recovery rate rises from 60% to 70%. We need to account for improvement that could happen without the program.",
  "Suppose Hospital A would have improved by the same 10 percentage points as B without the program. Apply B’s change to A’s own starting point.",
  "Compare A’s observed recovery with its assumed recovery without the program, in the same post-program period.",
  "Change A’s recovery for a reason unrelated to the program, such as a separate staffing improvement. The simulator keeps the program’s actual effect fixed at +15 percentage points.",
  "These scenarios return to the original starting gap and shared change. Compare earlier periods, then introduce an unrelated improvement alongside the program.",
];
const el = (id) => document.getElementById(`did-${id}`);
const signed = (n) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n)}`;
let step = 0;
let parameters = { ...didDefaults };
let prediction = null;
let practice = null;
let experiment = "gap";
let history = "parallel";
let showTruth = false;
let width = 760;
let regressionAnswer = null;
let communicationAnswer = null;

document.title = "Difference-in-differences · Causal Sandbox";
document.querySelector("#app").innerHTML =
  `<div class="instrument-page did-page">
  <header><a class="brand" href="./">${icon}<span>Causal Sandbox</span></a>${themeControl()}</header>
  <main>${lessonNavigation({ currentOptional: "difference-in-differences" })}
    <p class="eyebrow">A COMPARISON ACROSS GROUPS AND TIME</p>
    <h1>Difference-in-differences</h1>
    <p class="intro">How much would the treated group have improved without treatment?</p>
    <p class="small">As in the earlier lessons, we need the treated group’s missing outcome without treatment. DiD uses a comparison group’s change over time to construct it.</p>
    <nav class="did-steps" aria-label="DiD lesson stages">${steps.map((title, i) => `<button data-did-step="${i}"><span>${i + 1}</span>${title}</button>`).join("")}</nav>
    <section class="panel did-experiment" aria-labelledby="did-title">
      <div class="did-stage-meta"><span id="did-stage"></span><span>Synthetic hospital recovery rates</span></div>
      <h2 id="did-title" tabindex="-1"></h2><p id="did-intro"></p>
      <div id="did-controls"></div>
      <figure class="did-figure"><div id="did-chart"></div><figcaption id="did-caption"></figcaption></figure>
      <div id="did-result" role="status"></div>
      <div id="did-question"></div>
    </section>
    <nav class="did-actions" aria-label="Continue DiD lesson"><button id="did-back">← Back</button><button id="did-reset">Restart lesson</button><button id="did-next" class="primary"></button></nav>
    <section class="did-details" aria-labelledby="did-connection-title">
      <h2 id="did-connection-title">How does DiD fit with adjustment?</h2>
      <p><strong>The target:</strong> ATE asks about the average effect for everyone; ATT asks about those treated. Here we target the ATT for Hospital A’s post-program patients. DiD is a way to estimate an effect, not a different target population.</p>
      <p><strong>The assumption:</strong> earlier adjustment lessons compare outcome levels among people with similar measured confounders. DiD instead assumes comparable <em>untreated changes</em> over time. A stable starting gap can cancel; a hospital-specific improvement need not.</p>
      <p><strong>The connection:</strong> with multiple hospitals, baseline characteristics may help make untreated changes comparable. <a href="?lesson=ipw">Weighting</a> and <a href="?lesson=outcome-regression">outcome regression</a> can then be used within DiD, under parallel trends conditional on those characteristics. More hospitals alone do not make that assumption true.</p>
      <p><a href="?lesson=did-adjustment">Next: which hospitals make a credible comparison? →</a></p>
    </section>
    <details class="did-details"><summary>What makes this a causal comparison?</summary>
      <p><strong>Parallel trends:</strong> without the program, the average recovery rate in A would change by the same number of percentage points as in B. Their starting levels can differ. This assumption concerns untreated outcomes, not the two observed lines after treatment.</p>
      <p>We also assume no effects before the program starts, no spillovers to Hospital B, a consistently defined program and outcome, and stable patient composition. A changing patient mix or another change affecting only A can undermine the comparison.</p>
      <p>The target is the average effect on Hospital A’s post-program patient population (the ATT), compared with that same population without the program. It is not an effect for all hospitals or for each individual patient.</p>
      <p>These are exact, synthetic population rates. There is no sampling error here. Real estimates also need an appropriate uncertainty analysis, especially with few hospitals. Pre-treatment patterns can challenge parallel trends, but cannot verify the missing post-treatment outcomes.</p>
    </details>
    <details class="did-details"><summary>The formula behind the picture</summary>
      <p class="did-equation">DiD = (A after − A before) − (B after − B before)</p>
      <p>Equivalently: A after − [A before + B’s change]. The bracketed term is A’s inferred recovery without the program. The estimate uses only observed group averages. Simulator truth is used only to check it.</p>
    </details>
    <details class="did-details"><summary>The same comparison as a regression</summary>
      <div id="did-regression"></div>
      <p>In OLS with an intercept, binary group, binary period, their interaction, all four cells present, and no extra covariates, the interaction equals the four-cell DiD with the same observations and averaging weights. This algebra still holds when the causal assumptions fail.</p>
      <p>This group-by-period regression is distinct from modelling untreated change using baseline covariates. Adding arbitrary covariates need not preserve the raw four-mean formula; this example does not validate staggered-adoption comparisons.</p>
      <p>Teaching inspiration: Scott Cunningham’s <a href="https://mixtape.scunning.com/08a-difference_in_differences#four-averages-and-three-subtractions">“four averages and three subtractions”</a> in <em>Causal Inference: The Remix</em>, section 9.2.</p>
    </details>
    <details class="did-details"><summary>Explain the result to a hospital director</summary><div id="did-communication"></div></details>
    <details class="did-details"><summary>References and next steps</summary>
      <p><a href="https://pedrohcgs.github.io/files/RSBP_DiD_Review.pdf">Roth, Sant’Anna, Bilinski & Poe (2023)</a> explain identification, parallel trends, and inference in DiD. <a href="https://doi.org/10.1257/aeri.20210236">Roth (2022)</a> explains why passing a pre-trend test does not establish parallel trends.</p>
      <p><a href="https://psantanna.com/DRDID/">Sant’Anna & Zhao (2020)</a> connect covariate-adjusted DiD with outcome regression, weighting, and doubly robust estimation of the ATT.</p>
      <p>This lesson covers one treated group and one untreated comparison group. Staggered adoption and two-way fixed-effects comparisons require a separate extension.</p>
    </details>
    <p class="small">Helpful background: <a href="?lesson=what-if">Potential outcomes</a> · <a href="?lesson=confounding">Confounding</a></p>
    <div class="did-actions did-return"><a href="?lesson=hidden-confounding">← Hidden confounding</a><a href="?lesson=misspecification">Resume core lessons →</a><a href="?lesson=topics">All topics</a></div>
  </main></div>`;
setupLessonNavigation();

function currentWorld() {
  if (step === 5) return didHistory(history);
  return didWorld(
    step < 3
      ? didDefaults
      : { ...parameters, extra: step === 4 ? parameters.extra : 0 },
  );
}

function renderEvidence() {
  const world = currentWorld();
  const estimate = estimateDid(world.observed);
  const {
    treatedBefore: a0,
    treatedAfter: a1,
    comparisonBefore: b0,
    comparisonAfter: b1,
  } = world.observed;
  renderBridge(world.observed);
  el("chart").innerHTML = didChart({ world, estimate, step, showTruth, width });
  el("caption").innerHTML =
    `<span class="did-key did-treated">▲ Hospital A · receives the program</span>${step > 0 ? '<span class="did-key did-comparison">● Hospital B · no program</span>' : ""}${step >= 2 ? '<span class="did-key"><i class="did-dashed"></i>Assumed A without program</span>' : ""}${step >= 4 && showTruth ? '<span class="did-key"><i class="did-truth-key"></i>Simulator-known A without program</span>' : ""}<span class="did-chart-note">Baseline is measured before the program. Follow-up is measured after it. Solid lines connect observed period averages.</span>`;
  if (step === 0) {
    el("result").innerHTML =
      `<div class="did-takeaway"><span>Observed improvement in A</span><strong>65% − 40% = +25 percentage points</strong><p>A before–after difference. We have not isolated the program’s effect.</p></div>`;
  } else if (step === 1) {
    el("result").innerHTML =
      `<div class="did-changes"><div><span>Hospital A’s change</span><strong>+25 pp</strong></div><div><span>Hospital B’s change</span><strong>+10 pp</strong></div></div><p class="small">pp = percentage points. B starts higher, but its change is the comparison we need.</p>`;
  } else if (step === 2) {
    el("result").innerHTML =
      `<div class="did-takeaway"><span>A without the program · assumed, not observed</span><strong>40% + 10 pp = 50%</strong><p>Parallel trends means the same <em>change</em> without treatment. It does not mean the same recovery rate.</p></div>`;
  } else {
    const bias = estimate.effect - world.truth.effect;
    const revealed = step >= 4 && showTruth;
    // Match other recovery-rate lessons: the shared tint uses risk, not pp.
    const { tint } = effectComparison(
      estimate.effect / 100,
      world.truth.effect / 100,
    );
    el("result").innerHTML =
      `<div class="did-effect-summary" aria-label="Effects for Hospital A at follow-up">
        <div class="did-effect-card did-estimate" style="--error-tint:${revealed ? tint : 0}%">
          <span>DiD estimate</span><strong>${signed(estimate.effect)} pp</strong>
          <small>${a1}% − ${estimate.counterfactual}%</small>
          ${revealed ? `<span class="did-effect-error">${signed(bias)} pp from truth</span>` : ""}
        </div>
        ${revealed ? `<div class="did-effect-card did-truth-result"><span>Simulated true effect</span><strong>${signed(world.truth.effect)} pp</strong><small>${a1}% − ${world.truth.untreatedAfter}%</small><span class="did-effect-source">Known only in the simulator</span></div>` : ""}
      </div>
      <p class="did-calculation">DiD = (${signed(estimate.treatedChange)} pp in A) − (${signed(estimate.comparisonChange)} pp in B)</p>
      <p class="did-interpretation">${step === 3 ? `Under parallel trends: ${signed(estimate.effect)} percentage points for A, compared with A without the program. ${experiment === "gap" ? "Changing the starting gap leaves this estimate unchanged." : "A shared improvement cancels when we subtract the changes."}` : step === 4 ? `The program still adds 15 points. ${bias === 0 ? "With no extra change in A, DiD recovers that effect." : `DiD also counts A’s ${signed(bias)}-point unrelated change as a program effect.`}` : history === "parallel" ? "In this simulated world, the untreated changes remain parallel after the program starts. The observed history alone cannot tell us that." : history === "drift" ? "A was already improving faster. Its earlier trend challenges the equal-change assumption." : "The pre-treatment histories are unchanged, but a new staffing improvement affects only A. Parallel pre-trends do not rule out this post-treatment shock."}</p>
      ${revealed ? '<p class="did-color-note">Red tint shows distance from simulator truth.</p>' : ""}`;
  }
}

function slider(id, title, min, max, value) {
  return `<label class="did-slider" for="did-${id}"><span>${title}<output id="did-${id}-value">${signed(value)} pp</output></span><input id="did-${id}" type="range" min="${min}" max="${max}" step="1" value="${value}"></label>`;
}

function renderControls() {
  el("controls").innerHTML =
    step === 3
      ? `<fieldset class="did-choices"><legend>Change one feature of the world</legend><label><input type="radio" name="did-experiment" value="gap" ${experiment === "gap" ? "checked" : ""}>Starting gap</label><label><input type="radio" name="did-experiment" value="common" ${experiment === "common" ? "checked" : ""}>Shared improvement</label></fieldset>${experiment === "gap" ? slider("gap", "B’s starting rate minus A’s", 10, 30, parameters.gap) : slider("common", "Improvement shared by both hospitals", 0, 20, parameters.common)}`
      : step === 4
        ? `<p class="small">Simulation control · changes the world, not an adjustment to the estimator</p>${slider("extra", "A’s extra change without the program", -10, 10, parameters.extra)}`
        : step === 5
          ? `<fieldset class="did-choices"><legend>Compare three simulated histories</legend>${[
              ["parallel", "Parallel untreated changes"],
              ["drift", "A was improving faster"],
              ["shock", "New shock after treatment"],
            ]
              .map(
                ([id, title]) =>
                  `<label><input type="radio" name="did-history" value="${id}" ${history === id ? "checked" : ""}>${title}</label>`,
              )
              .join("")}</fieldset>`
          : "";
  if (step >= 4)
    el("controls").insertAdjacentHTML(
      "beforeend",
      `<label class="did-reveal"><input id="did-truth" type="checkbox" ${showTruth ? "checked" : ""}>Reveal simulator’s untreated outcome</label>`,
    );
  el("controls")
    .querySelectorAll('input[type="range"]')
    .forEach((input) =>
      input.addEventListener("input", () => {
        const key = input.id.replace("did-", "");
        parameters[key] = Number(input.value);
        el(`${key}-value`).textContent = `${signed(parameters[key])} pp`;
        renderEvidence();
      }),
    );
  el("controls")
    .querySelectorAll('[name="did-experiment"]')
    .forEach((input) =>
      input.addEventListener("change", () => {
        experiment = input.value;
        parameters = { ...didDefaults };
        renderControls();
        el(experiment).focus();
        renderEvidence();
      }),
    );
  el("controls")
    .querySelectorAll('[name="did-history"]')
    .forEach((input) =>
      input.addEventListener("change", () => {
        history = input.value;
        renderEvidence();
      }),
    );
  el("truth")?.addEventListener("change", (event) => {
    showTruth = event.target.checked;
    renderEvidence();
  });
}

function renderQuestion() {
  el("question").innerHTML =
    step === 0
      ? `<fieldset class="did-choices"><legend>Does the 25-point rise establish a 25-point program effect?</legend><button data-did-predict="yes" aria-pressed="${prediction === "yes"}">Yes, that is the improvement</button><button data-did-predict="no" aria-pressed="${prediction === "no"}">No, we need a comparison</button></fieldset><p id="did-feedback" class="did-feedback" role="status"></p>`
      : step === 5
        ? `<fieldset class="did-choices"><legend>Matching pre-trends establish that DiD is unbiased. True or false?</legend><button data-did-practice="yes" aria-pressed="${practice === "yes"}">True</button><button data-did-practice="no" aria-pressed="${practice === "no"}">False</button></fieldset><p id="did-feedback" class="did-feedback" role="status"></p>`
        : "";
  const update = () => {
    const answer = step === 0 ? prediction : practice;
    if (!el("feedback")) return;
    el("feedback").textContent =
      answer === null
        ? ""
        : `${answer === "no" ? "✓ Correct." : "! Not quite."} ${step === 0 ? "Some recovery might have improved without the program. Reveal Hospital B to see why the before–after change is not enough." : "A new shock can affect only A after treatment, even if the earlier trends match. The untreated post-treatment comparison remains an assumption."}`;
    el("feedback").dataset.result = answer === "no" ? "correct" : "review";
  };
  el("question")
    .querySelectorAll("button")
    .forEach((button) =>
      button.addEventListener("click", () => {
        if (step === 0) prediction = button.dataset.didPredict;
        else practice = button.dataset.didPractice;
        el("question")
          .querySelectorAll("button")
          .forEach((choice) =>
            choice.setAttribute("aria-pressed", String(choice === button)),
          );
        update();
      }),
    );
  update();
}

function renderStep(focus = false) {
  el("stage").textContent = `STEP ${step + 1} OF ${steps.length}`;
  el("title").textContent = headings[step];
  el("intro").textContent = intros[step];
  document.querySelectorAll("[data-did-step]").forEach((button, i) => {
    if (step === i) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  });
  el("back").hidden = step === 0;
  el("next").hidden = step === steps.length - 1;
  el("next").textContent = [
    "Reveal Hospital B →",
    "Build A’s missing future →",
    "Compare with what happened →",
    "Test parallel trends →",
    "Inspect earlier periods →",
    "",
  ][step];
  renderControls();
  renderEvidence();
  renderQuestion();
  if (focus) el("title").focus();
}
document.querySelectorAll("[data-did-step]").forEach((button) =>
  button.addEventListener("click", () => {
    step = Number(button.dataset.didStep);
    renderStep(true);
  }),
);
el("next").addEventListener("click", () => {
  step++;
  renderStep(true);
});
el("back").addEventListener("click", () => {
  step--;
  renderStep(true);
});
el("reset").addEventListener("click", () => {
  step = 0;
  parameters = { ...didDefaults };
  prediction = practice = regressionAnswer = communicationAnswer = null;
  experiment = "gap";
  history = "parallel";
  showTruth = false;
  renderStep(true);
});
new ResizeObserver(([entry]) => {
  const nextWidth = Math.max(280, Math.round(entry.contentRect.width));
  if (nextWidth !== width) {
    width = nextWidth;
    renderEvidence();
  }
}).observe(el("chart"));
renderStep();

function renderBridge(observed) {
  const r = didRegression(observed);
  const estimate = estimateDid(observed);
  el("regression").innerHTML =
    `<p>Current four-cell contrast: (${observed.treatedAfter} − ${observed.treatedBefore}) − (${observed.comparisonAfter} − ${observed.comparisonBefore}) = ${signed(r.delta)} pp.</p>
    <fieldset class="did-choices"><legend>Predict: does writing this comparison as a regression change the estimate?</legend><button data-regression-answer="yes" aria-pressed="${regressionAnswer === "yes"}">Yes</button><button data-regression-answer="no" aria-pressed="${regressionAnswer === "no"}">No</button></fieldset><p id="did-regression-feedback" role="status"></p>
    <p>Y = α + β × TreatedGroup + γ × Post + δ × (TreatedGroup × Post) + error</p>
    <p>TreatedGroup marks A at both baseline and follow-up. Post marks follow-up for both groups. Y is recovery in percent; differences are percentage points.</p>
    <p>α = ${r.alpha}: B at baseline. β = ${signed(r.beta)}: A minus B at baseline. γ = ${signed(r.gamma)}: B’s change. δ = ${signed(r.delta)}: the difference in changes.</p>
    <p>Fitted B: ${r.alpha}% before, ${r.cells.comparisonAfter}% after. Fitted A: ${r.cells.treatedBefore}% before; ${r.alpha} ${signed(r.beta)} ${signed(r.gamma)} ${signed(r.delta)} = ${r.cells.treatedAfter}% after. Removing the interaction gives ${r.alpha} ${signed(r.beta)} ${signed(r.gamma)} = ${r.counterfactual}%: A’s untreated follow-up <strong>assumed, not observed</strong>.</p>`;
  el("communication").innerHTML =
    `<fieldset class="did-choices"><legend>Which explanation preserves the comparison and its assumption?</legend><button data-communication-answer="improvement" aria-pressed="${communicationAnswer === "improvement"}">A improved ${signed(estimate.treatedChange)} points, so that is the program effect.</button><button data-communication-answer="proven" aria-pressed="${communicationAnswer === "proven"}">The comparison proves an effect of ${signed(estimate.effect)} points.</button><button data-communication-answer="qualified" aria-pressed="${communicationAnswer === "qualified"}">Subtract B’s improvement, if it represents A’s improvement without the program.</button></fieldset><p id="did-communication-feedback" role="status"></p>`;
  updateBridgeFeedback();
}
function updateBridgeFeedback() {
  const estimate = estimateDid(currentWorld().observed);
  el("regression-feedback").textContent =
    regressionAnswer === null
      ? ""
      : `${regressionAnswer === "no" ? "✓ Correct." : "! Reconsider."} The representation changes; the estimate stays ${signed(estimate.effect)} pp. Causal interpretation still requires the design assumptions.`;
  el("communication-feedback").textContent =
    communicationAnswer === null
      ? ""
      : `${communicationAnswer === "qualified" ? "✓ Correct." : "! Reconsider."} Recovery changed by ${signed(estimate.treatedChange)} percentage points in A and ${signed(estimate.comparisonChange)} in B. If A would have changed by the same ${signed(estimate.comparisonChange)} points without the program, the estimated program effect for A is ${signed(estimate.effect)} points.`;
}
el("regression").addEventListener("click", (event) => {
  const button = event.target.closest("[data-regression-answer]");
  if (!button) return;
  regressionAnswer = button.dataset.regressionAnswer;
  el("regression")
    .querySelectorAll("button")
    .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
  updateBridgeFeedback();
});
el("communication").addEventListener("click", (event) => {
  const button = event.target.closest("[data-communication-answer]");
  if (!button) return;
  communicationAnswer = button.dataset.communicationAnswer;
  el("communication")
    .querySelectorAll("button")
    .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
  updateBridgeFeedback();
});
