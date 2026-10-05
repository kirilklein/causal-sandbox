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
import { hospitalChart } from "./did-adjustment-view.js";
import { effectComparison } from "./effect-comparison.js";
import icon from "./brand.svg?raw";

const stages = [
  {
    name: "Starting gaps",
    title: "Different starting points can still give a credible comparison.",
    intro:
      "Six hospitals adopt the program at the same date; six never adopt. All would improve by 10 points without it. Change only the treated hospitals’ starting rate.",
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
      "Return to the 40% treated and 60% comparison starting rates. Keep the same hospitals and program effect; now link adoption to underlying improvement through a baseline characteristic.",
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
  {
    name: "The assumption",
    title: "Adjustment cannot remove an unmeasured new shock.",
    intro:
      "Keep the capacity adjustment. Add an unrelated 10-point improvement to treated hospitals at follow-up. The program’s own effect stays fixed.",
    question:
      "With a treated-only shock, what can we tell the hospital director?",
    choices: [
      "The adjusted difference proves the program’s effect",
      "It estimates the effect only if comparable hospitals would have improved equally without the program",
    ],
    correct: 1,
    feedback:
      "Even within capacity groups, the shock breaks the equal-untreated-change assumption. Measured balance and matching earlier trends cannot prove that assumption.",
  },
];
const el = (id) => document.getElementById(`da-${id}`);
const pp = (risk) =>
  `${risk > 1e-10 ? "+" : risk < -1e-10 ? "−" : ""}${Math.abs(risk * 100)
    .toFixed(1)
    .replace(/\.0$/, "")} pp`;
let step = 0;
let gap = 0.2;
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
      <figure class="did-figure"><div id="da-chart"></div><figcaption><span class="did-key did-treated">▲ Treated hospitals</span><span class="did-key did-comparison">● Comparison hospitals</span><span class="did-chart-note">Observed recovery rates. Thick lines show group means; thin lines show hospitals. Identical hospitals are separated horizontally only. The vertical dotted line marks the shared adoption date.</span></figcaption></figure>
      <div id="da-result" role="status"></div>
      <label class="did-reveal"><input id="da-truth" type="checkbox">Show simulation truth</label>
      <div id="da-interpretation"></div>
    </section>
    <nav class="did-actions" aria-label="Continue comparable hospitals"><button id="da-back">← Back</button><button id="da-reset">Restart lesson</button><button id="da-next" class="primary">Continue →</button></nav>
    <details class="did-details"><summary>Target, assumption, and estimator are different decisions</summary>
      <p><strong>Target:</strong> the post-program ATT across treated hospitals. These hospitals have equal population sizes. With unequal sizes and effects, weighting hospitals equally and weighting patients equally can target different averages.</p>
      <p><strong>Assumption:</strong> within the chosen baseline profiles, treated and comparison hospitals would have equal average untreated changes. Comparison hospitals must cover the profiles present among treated hospitals. We also require no anticipation, consistency, no spillovers, and stable within-hospital patient composition.</p>
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
    gap: step === 0 ? gap : 0.2,
    capacityTrends: step >= 2 || (step === 1 && trends),
    shock: step === 3 && shock ? 0.1 : 0,
  });
  const crude = estimateHospitalDid(world.observed);
  const stratified = stratifiedHospitalDid(world.observed);
  const useAdjustment = step === 3 || (step === 2 && adjusted);
  const estimate = useAdjustment ? stratified.effect : crude.effect;
  const { tint } = effectComparison(estimate, world.truth.effect);
  const split = useAdjustment;
  el("chart").classList.toggle("da-panels", split);
  el("chart").classList.toggle("da-panels-wide", split && width >= 620);
  el("chart").innerHTML = split
    ? ["high", "low"]
        .map((capacity) =>
          hospitalChart(
            world.observed.filter((h) => h.capacity === capacity),
            {
              width: width >= 620 ? (width - 18) / 2 : width,
              title: `${capacity === "high" ? "High" : "Low"} baseline capacity`,
            },
          ),
        )
        .join("")
    : hospitalChart(world.observed, { width });
  el("result").innerHTML = `<div class="did-effect-summary">
    <div class="did-effect-card did-estimate" style="--error-tint:${showTruth ? tint : 0}%"><span>${useAdjustment ? "Capacity-adjusted DiD" : "Crude DiD"}</span><strong>${pp(estimate)}</strong><small>For treated hospitals at follow-up</small>${showTruth ? `<span class="did-effect-error">${pp(estimate - world.truth.effect)} from truth</span>` : ""}</div>
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
      ? `<p>A lower starting rate can make the follow-up association look harmful. The stable gap cancels in changes: crude DiD stays at ${pp(crude.effect)}.</p>`
      : step === 1
        ? `<p>${trends ? "Crude DiD rises to +20 pp. Adopting hospitals now have greater untreated improvement, so subtracting the overall comparison change leaves an extra +5 pp." : "Untreated improvement is still +10 pp in both groups. Turn on capacity-related improvement to test the comparison."}</p>`
        : useAdjustment
          ? `<div class="da-contributions">${contribution}</div><p>Weight the contrasts by the treated mix: (4/6 × ${pp(stratified.strata[0].effect)}) + (2/6 × ${pp(stratified.strata[1].effect)}) = <strong>${pp(stratified.effect)}</strong>.</p><p>${step === 3 && shock ? "The adjusted estimate includes the unrelated +10-point shock. Observed capacity adjustment cannot restore equal untreated changes within profiles." : "Assumption: without the program, average recovery would improve equally within each capacity group. This assumption makes the adjusted comparison causal; balance alone cannot verify it."}</p><details><summary>Which hospitals contribute?</summary><p>Every treated hospital retains weight 1/6. Each of the two high-capacity comparison hospitals contributes 1/3 of the borrowed change; each of the four low-capacity comparison hospitals contributes 1/12. These contributions sum to one in each arm. Recovery endpoints never move when the comparison changes.</p></details>`
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
      ? `<label class="did-slider" for="da-gap"><span>Comparison minus treated starting rate<output id="da-gap-value">${pp(gap)}</output></span><input id="da-gap" type="range" min="10" max="30" step="1" value="${Math.round(gap * 100)}"></label>`
      : `<label class="did-reveal"><input id="da-manipulate" type="checkbox" ${[false, trends, adjusted, shock][step] ? "checked" : ""}>${["", "Link untreated improvement to baseline capacity", "Compare within capacity groups", "Add a treated-only follow-up shock"][step]}</label><p class="small">${step === 2 ? "Analysis control: observed data, target, and truth stay fixed." : "World control: outcomes change; hospital identities, baseline rates, and the +15-point program effect stay fixed."}</p>`;
  el("gap")?.addEventListener("input", (event) => {
    gap = Number(event.target.value) / 100;
    el("gap-value").textContent = pp(gap);
    renderEvidence();
  });
  el("manipulate")?.addEventListener("change", (event) => {
    if (step === 1) trends = event.target.checked;
    if (step === 2) adjusted = event.target.checked;
    if (step === 3) shock = event.target.checked;
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
  gap = 0.2;
  trends = adjusted = shock = showTruth = false;
  answers = stages.map(() => null);
  el("truth").checked = false;
  renderStep(true);
});
new ResizeObserver(([entry]) => {
  const nextWidth = Math.max(250, Math.round(entry.contentRect.width));
  if (nextWidth !== width) {
    width = nextWidth;
    renderEvidence();
  }
}).observe(el("chart"));
renderStep();
