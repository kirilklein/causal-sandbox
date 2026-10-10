import "./instrument-lesson.css";
import "./did.css";
import "./did-adjustment.css";
import { themeControl } from "./theme.js";
import {
  lessonNavigation,
  setupLessonNavigation,
} from "./lesson-navigation.js";
import {
  hospitalWorld,
  estimateHospitalDid,
  stratifiedHospitalDid,
} from "./did-adjustment.js";
import { hospitalChart, borrowingChart } from "./did-adjustment-view.js";
import { effectComparison } from "./effect-comparison.js";
import icon from "./brand.svg?raw";

const stages = [
  {
    name: "Starting gaps",
    title: "Different starting points can still give a credible comparison.",
    intro:
      "Six hospitals adopt the program at the same date; six never adopt. They start at different recovery rates. All would improve by 10 points without the program. Borrow the comparison hospitals’ +10-point improvement to build a missing follow-up for each treated hospital.",
    question: "Does a stable starting gap alone invalidate DiD?",
    choices: [
      "Yes, their levels must match",
      "No, equal untreated changes can suffice",
    ],
    correct: 1,
    feedback:
      "Subtracting baseline from follow-up removes a stable additive gap. Equal untreated changes, rather than equal starting rates, is the needed comparison.",
  },
  {
    name: "Different changes",
    title: "What if adoption is linked to underlying improvement?",
    intro:
      "Keep all 12 hospitals, their starting rates, and the +15-point program effect fixed. Now let a baseline characteristic predict both adoption and untreated improvement.",
    question:
      "Will crude DiD still isolate the program if adopters would improve more anyway?",
    choices: [
      "Yes, baseline subtraction removes every difference",
      "No, unrelated improvement can remain",
    ],
    correct: 1,
    feedback:
      "A change affecting adopters more strongly survives baseline subtraction. More hospitals do not make that change disappear.",
  },
  {
    name: "Comparable profiles",
    title: "Borrow changes from hospitals with comparable capacity.",
    intro:
      "Start with capacity-related improvement switched on. Four of six adopters have high baseline capacity, compared with two of six comparison hospitals. Keep this observed panel fixed while changing the comparison.",
    question:
      "Which mix of capacity groups matches our treated-hospital target?",
    choices: [
      "The comparison mix: 1/3 high, 2/3 low",
      "The treated mix: 2/3 high, 1/3 low",
    ],
    correct: 1,
    feedback:
      "Our target is the treated hospitals. Average the within-capacity contrasts using their baseline profile shares; do not change anyone’s recovery rate.",
  },
];
const el = (id) => document.getElementById(`da-${id}`);
const pp = (risk) =>
  `${risk > 1e-10 ? "+" : risk < -1e-10 ? "−" : ""}${Math.abs(risk * 100)
    .toFixed(1)
    .replace(/\.0$/, "")} pp`;
let step = 0;
let trends = false;
let adjusted = false;
let shock = false;
let showTruth = false;
let answers = stages.map(() => null);
let width = 760;

document.title = "Comparable hospitals · Causal Sandbox";
document.querySelector("#app").innerHTML =
  `<div class="instrument-page did-page da-page">
  <header><a class="brand" href="./">${icon}<span>Causal Sandbox</span></a>${themeControl()}</header>
  <main>${lessonNavigation({ currentOptional: "did-adjustment" })}
    <p class="eyebrow">DIFFERENCE-IN-DIFFERENCES · COMPARABLE HOSPITALS</p>
    <h1>Which hospitals make a credible comparison?</h1>
    <p class="intro">A starting gap can cancel. A different underlying improvement may not.</p>
    <p class="small">Prerequisites: <a href="?lesson=difference-in-differences">Basic DiD</a> · <a href="?lesson=confounding">Confounding</a> · <a href="?lesson=what-if">Potential outcomes</a></p>
    <nav class="did-steps" aria-label="Comparable hospital stages">${stages.map((s, i) => `<button data-da-step="${i}"><span>${i + 1}</span>${s.name}</button>`).join("")}</nav>
    <section class="panel did-experiment" aria-labelledby="da-title">
      <p class="da-target"><strong>Target:</strong> average program effect across the six treated hospitals at follow-up (ATT). Each hospital counts equally.</p>
      <h2 id="da-title" tabindex="-1"></h2><p id="da-intro"></p>
      <div id="da-question"></div><div id="da-controls"></div>
      <figure class="did-figure"><div id="da-chart"></div><figcaption><span id="da-caption" class="did-chart-note"></span></figcaption></figure>
      <div id="da-result" role="status"></div>
      <details class="da-trajectories"><summary>Inspect all 12 observed trajectories</summary><div id="da-trajectories"></div></details>
      <label class="did-reveal"><input id="da-truth" type="checkbox">Show simulation truth</label>
      <div id="da-interpretation"></div>
      <details id="da-shock-details" class="da-shock" hidden><summary>Stress-test the remaining assumption</summary><p>Would capacity adjustment remove an unrelated improvement affecting only treated hospitals?</p><label class="did-reveal"><input id="da-shock" type="checkbox">Add a treated-only +10 pp follow-up shock</label><p id="da-shock-feedback" role="status"></p></details>
    </section>
    <nav class="did-actions" aria-label="Continue comparable hospitals"><button id="da-back">← Back</button><button id="da-reset">Restart lesson</button><button id="da-next" class="primary">Continue →</button></nav>
    <details class="did-details"><summary>Target, assumption, and estimator are different decisions</summary>
      <p><strong>Target:</strong> the post-program ATT across treated hospitals. These hospitals have equal population sizes. With unequal sizes and effects, weighting hospitals equally and weighting patients equally can target different averages.</p>
      <p><strong>Assumption:</strong> within the chosen baseline profiles, treated and comparison hospitals would have equal average untreated changes. Comparison hospitals must cover the profiles present among treated hospitals. We also require no anticipation, consistency, no spillovers, and stable within-hospital patient composition.</p>
      <p>A row’s gap is not an identified hospital-specific effect. Parallel trends identifies the average gap for the treated population under the stated assumptions.</p>
      <p><strong>Estimator:</strong> compare changes within capacity groups, then average using the treated hospitals’ capacity shares. Neither DiD nor covariate adjustment universally replaces the other’s identifying assumptions.</p>
      <p>Baseline resource capacity helps define this comparison. Staffing changed by the program is a post-treatment variable; adjusting for it could remove part of the program’s effect. Do not adjust for every recorded difference.</p>
    </details>
    <details class="did-details"><summary>What these exact rates can tell us</summary>
      <p>The same hospitals recur at baseline and follow-up; the individual patients need not. Patient composition stays stable within each hospital. These are exact synthetic population rates, with no sampling error or confidence intervals.</p>
      <p>More hospitals can supply information and potential comparators, but cannot establish identification. More patients in the same hospitals do not create more independent program assignments. Repeated-study precision and hospital-cluster inference belong to a separate extension.</p>
    </details>
    <details class="did-details"><summary>References and next steps</summary>
      <p><a href="https://arxiv.org/abs/1812.01723">Sant’Anna & Zhao (2020)</a> develop conditional DiD estimation for ATT. <a href="https://www.jonathandroth.com/assets/files/DiD_Review_Paper.pdf">Roth, Sant’Anna, Bilinski & Poe (2023)</a> discuss identification, covariates, and inference.</p>
      <p>The <a href="https://github.com/kirilklein/causal-sandbox/issues/309">planned follow-ups</a> connect this comparison to regression, ATT weighting, and doubly robust estimation, then study hospital-level uncertainty. Staggered adoption is a separate topic.</p>
    </details>
    <div class="did-actions did-return"><a href="?lesson=difference-in-differences">← Basic DiD</a><a href="?lesson=misspecification">Resume core lessons →</a><a href="?lesson=topics">All topics</a></div>
  </main></div>`;
setupLessonNavigation();

function renderEvidence() {
  const world = hospitalWorld({
    variedBaselines: true,
    capacityTrends: step >= 2 || (step === 1 && trends),
    shock: step === 2 && shock ? 0.1 : 0,
  });
  const crude = estimateHospitalDid(world.observed);
  const stratified = stratifiedHospitalDid(world.observed);
  const useAdjustment = step === 2 && adjusted;
  const estimate = useAdjustment ? stratified.effect : crude.effect;
  const { tint } = effectComparison(estimate, world.truth.effect);
  el("chart").innerHTML = borrowingChart(world.observed, {
    width,
    adjusted: useAdjustment,
  });
  el("trajectories").innerHTML = hospitalChart(world.observed);
  el("caption").textContent =
    "Dashed segments borrow the mean change shown in the comparison panel. Diamonds are assumed endpoints, not observed outcomes. Solid segments show the remaining gaps.";
  el("shock-details").hidden = step !== 2;
  el("shock-feedback").textContent = shock
    ? "The adjusted estimate is +25 pp, but the program still adds 15. The unrelated shock breaks equal untreated changes even within capacity groups."
    : "Capacity adjustment still requires equal average untreated changes within each profile. Balance and earlier trends cannot prove that assumption.";
  el("result").innerHTML = `<div class="did-effect-summary">
    <div class="did-effect-card did-estimate" style="--error-tint:${showTruth ? tint : 0}%"><span>${useAdjustment ? "Capacity-adjusted DiD" : "Crude DiD"}</span><strong>${pp(estimate)}</strong><small>Average of the six treated-hospital gaps</small>${showTruth ? `<span class="did-effect-error">${pp(estimate - world.truth.effect)} from truth</span>` : ""}</div>
    ${showTruth ? `<div class="did-effect-card did-truth-result"><span>Simulator ATT</span><strong>${pp(world.truth.effect)}</strong><small>Known only in the simulator</small></div>` : ""}
    </div><p class="small">Follow-up-only association: ${pp(crude.association)}. Crude DiD: ${pp(crude.treatedChange)} − ${pp(crude.comparisonChange)} = ${pp(crude.effect)}.</p>`;
  const contribution = stratified.strata
    .map(
      (s) =>
        `<div><strong>${s.capacity === "high" ? "High" : "Low"} capacity</strong><p>${s.treatedCount} treated · ${s.comparisonCount} comparison</p><p>${pp(s.treatedChange)} − ${pp(s.comparisonChange)} = <strong>${pp(s.effect)}</strong></p><p>${s.treatedCount}/6 of the target</p><div class="da-share" role="img" aria-label="${s.treatedCount} of 6 treated hospitals"><span style="width:${s.share * 100}%"></span></div></div>`,
    )
    .join("");
  el("interpretation").innerHTML =
    step === 0
      ? `<p>The treated hospitals start at 30–50% recovery; comparison hospitals at 50–70%. Yet all treated changes are +25 pp and all comparison changes are +10 pp. Subtracting changes cancels the starting differences: ${pp(crude.effect)}.</p>`
      : step === 1
        ? `<p>${trends ? "Crude DiD rises to +20 pp. Adopting hospitals now have greater untreated improvement, so subtracting the overall comparison change leaves an extra +5 pp." : "Untreated improvement is still +10 pp in both groups. Turn on capacity-related improvement to test the comparison."}</p>`
        : useAdjustment
          ? `<div class="da-contributions">${contribution}</div><p>Weight the contrasts by the treated mix: (4/6 × ${pp(stratified.strata[0].effect)}) + (2/6 × ${pp(stratified.strata[1].effect)}) = <strong>${pp(stratified.effect)}</strong>.</p><p>${shock ? "The adjusted estimate includes the unrelated +10-point shock. Observed capacity adjustment cannot restore equal untreated changes within profiles." : "Assumption: without the program, average recovery would improve equally within each capacity group. This assumption makes the adjusted comparison causal; balance alone cannot verify it."}</p><details><summary>Which hospitals contribute?</summary><p>Every treated hospital retains weight 1/6. Each of the two high-capacity comparison hospitals contributes 1/3 of the borrowed change; each of the four low-capacity comparison hospitals contributes 1/12. These contributions sum to one in each arm. Observed recovery endpoints never move when the comparison changes.</p></details>`
          : `<p>The raw comparison group has too few high-capacity hospitals for our target. Reveal within-capacity comparisons, then average with the treated mix.</p>`;
}

function renderQuestion() {
  const s = stages[step];
  el("question").innerHTML =
    `<fieldset class="did-choices"><legend>Predict: ${s.question}</legend>${s.choices.map((choice, i) => `<button data-da-answer="${i}" aria-pressed="${answers[step] === i}">${choice}</button>`).join("")}</fieldset><p class="did-feedback" id="da-feedback" role="status"></p>`;
  const feedback = () => {
    const answer = answers[step];
    el("feedback").textContent =
      answer === null
        ? ""
        : `${answer === s.correct ? "✓ Correct." : "! Reconsider."} ${s.feedback}`;
    el("feedback").dataset.result = answer === s.correct ? "correct" : "review";
  };
  el("question")
    .querySelectorAll("button")
    .forEach((button) =>
      button.addEventListener("click", () => {
        answers[step] = Number(button.dataset.daAnswer);
        el("question")
          .querySelectorAll("button")
          .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
        feedback();
      }),
    );
  feedback();
}

function renderStep(focus = false) {
  el("title").textContent = stages[step].title;
  el("intro").textContent = stages[step].intro;
  document.querySelectorAll("[data-da-step]").forEach((button, i) => {
    if (i === step) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  });
  el("back").hidden = step === 0;
  el("next").hidden = step === stages.length - 1;
  el("controls").innerHTML =
    step === 0
      ? ""
      : `<label class="did-reveal"><input id="da-manipulate" type="checkbox" ${(step === 1 ? trends : adjusted) ? "checked" : ""}>${step === 1 ? "Link untreated improvement to baseline capacity" : "Borrow changes within capacity groups"}</label><p class="small">${step === 1 ? "World control: high-capacity hospitals improve 20 pp without the program; low-capacity hospitals improve 5 pp. Starting rates and the program effect stay fixed." : "Analysis control: only the assumed endpoints change. Observed hospital outcomes, target, and program effect stay fixed."}</p>`;
  el("manipulate")?.addEventListener("change", (event) => {
    if (step === 1) trends = event.target.checked;
    else adjusted = event.target.checked;
    renderEvidence();
  });
  renderQuestion();
  renderEvidence();
  if (focus) el("title").focus();
}
document.querySelectorAll("[data-da-step]").forEach((button) =>
  button.addEventListener("click", () => {
    step = Number(button.dataset.daStep);
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
el("truth").addEventListener("change", (event) => {
  showTruth = event.target.checked;
  renderEvidence();
});
el("reset").addEventListener("click", () => {
  step = 0;
  document.querySelector(".da-trajectories").open = false;
  el("shock").checked = false;
  el("shock-details").open = false;
  trends = adjusted = shock = showTruth = false;
  answers = stages.map(() => null);
  el("truth").checked = false;
  renderStep(true);
});
el("shock").addEventListener("change", (event) => {
  shock = event.target.checked;
  renderEvidence();
});
new ResizeObserver(([entry]) => {
  const nextWidth = Math.max(250, Math.round(entry.contentRect.width));
  if (nextWidth !== width) {
    width = nextWidth;
    renderEvidence();
  }
}).observe(el("chart"));
renderStep();
