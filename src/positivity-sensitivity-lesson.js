import "./instrument-lesson.css";
import "./positivity-sensitivity.css";
import icon from "./brand.svg?raw";
import { themeControl } from "./theme.js";
import {
  lessonNavigation,
  setupLessonNavigation,
} from "./lesson-navigation.js";
import {
  recoveryPopulation,
  positivitySensitivity,
} from "./positivity-sensitivity.js";

const title = "Beyond trimming: who is still missing?";
const el = (id) => document.getElementById(id);
const pp = (value) => {
  const rounded = Math.round(value * 1000) / 10;
  return `${rounded > 0 ? "+" : ""}${rounded === 0 ? 0 : rounded} pp`;
};
const percent = (value) => `${Math.round(value * 100)}%`;
const population = recoveryPopulation;
let answered = false;

document.title = `${title} · Causal Sandbox`;
document.querySelector("#app").innerHTML = `
<div class="instrument-page positivity-page">
  <header><a class="brand" href="./">${icon}<span>Causal Sandbox</span></a>${themeControl()}</header>
  <main>
    ${lessonNavigation({ currentOptional: "positivity-sensitivity" })}
    <p class="eyebrow">ADVANCED · POSITIVITY</p>
    <h1 tabindex="-1">${title}</h1>
    <p class="intro">Trimming can give us a supported comparison for the patients who remain. What can we say about everyone who was treated?</p>
    <p class="small">Builds on <a href="?lesson=trimming">trimming</a>. Here the target is the average treatment effect on the treated (ATT).</p>
    <section class="panel ps-experiment" aria-labelledby="ps-study-title">
      <p class="eyebrow">FICTIONAL RECOVERY STUDY · EXACT POPULATION PROPORTIONS</p>
      <h2 id="ps-study-title">Some treated patients have no comparable controls</h2>
      <div id="ps-observed">
        <div class="ps-population" role="img" aria-label="Of all treated patients, 60 percent are retained and 40 percent are excluded. Widths show their shares.">
          <div style="width:${percent(population.retainedShare)}"><strong>${percent(population.retainedShare)}</strong><span>Retained</span></div>
          <div class="ps-excluded" style="width:${percent(1 - population.retainedShare)}"><strong>${percent(1 - population.retainedShare)}</strong><span>Excluded</span></div>
        </div>
        <div class="ps-evidence">
          <p><strong>Retained patients</strong><span>${percent(population.retainedTreated)} recover with treatment, versus ${percent(population.retainedUntreated)} among comparable controls.</span><b>Supported effect: ${pp(population.retainedTreated - population.retainedUntreated)}</b></p>
          <p><strong>Excluded patients</strong><span>${percent(population.excludedTreated)} recover with treatment. There are no controls with their baseline profile.</span><b>Without treatment: unknown</b></p>
        </div>
      </div>
      <p class="small">Assume valid adjustment within the retained group. These exact proportions isolate missing support from sampling error.</p>
      <fieldset id="ps-prediction" class="ps-question">
        <legend>Does the retained effect establish a +20-point benefit for all treated patients?</legend>
        <button data-prediction="yes">Yes, the treated recovery rates are equal</button>
        <button data-prediction="no">No, the excluded group’s effect is missing</button>
      </fieldset>
      <details id="ps-feedback" class="ps-feedback" hidden open>
        <summary>Prediction and feedback</summary>
        <p id="ps-feedback-text" tabindex="-1"></p>
      </details>
      <div id="ps-exploration" hidden>
        <h3>Change an assumption. Keep the observations fixed.</h3>
        <label class="ps-slider-label" for="ps-effect">Assumed effect among excluded patients <output id="ps-effect-value" for="ps-effect"></output></label>
        <input id="ps-effect" type="range" min="-40" max="60" step="5" value="20" aria-describedby="ps-effect-help">
        <p id="ps-effect-help" class="small">Percentage points in recovery. Start with the same effect as the retained group, then try harm.</p>
        <div id="ps-chart"></div>
        <p class="small">Bars show the full range compatible with these observations and a binary outcome. They are not confidence intervals. Open circles mark your assumption and its implication.</p>
        <p id="ps-result" class="ps-result" role="status"></p>
        <p id="ps-counterfactual" class="small"></p>
      </div>
    </section>
    <details class="ps-detail" id="ps-calculation">
      <summary>How the two groups combine</summary>
      <p>Average effects using each group’s share of treated patients, not its share of the combined treated-and-control sample.</p>
      <div class="ps-equation" role="math" aria-label="Overall ATT equals retained share times retained ATT plus excluded share times excluded ATT">
        <span>ATT<sub>all</sub> =</span><span>p × ATT<sub>retained</sub></span><span>+ (1 − p) × ATT<sub>excluded</sub></span>
      </div>
      <p id="ps-arithmetic"></p>
      <p id="ps-bounds"></p>
      <p>Matching ages or comorbidities in a Table 1 does not establish equal effects. Trimming changes the target even when those summaries look similar.</p>
    </details>
    <details class="ps-detail">
      <summary>What can we do next?</summary>
      <ul>
        <li><strong>Seek relevant controls.</strong> With rare but possible untreated patients, a larger or better-targeted study can help. If a profile always receives treatment, enlarging the same study cannot create that comparison.</li>
        <li><strong>Report a narrower target.</strong> Estimate the ATT among retained treated patients and describe who was excluded. This leaves the excluded group’s effect unresolved.</li>
        <li><strong>Make extrapolation explicit.</strong> An outcome model can predict into the unsupported group, but its accuracy there needs assumptions beyond the observed comparison. Use a justified range of assumptions to show whether the conclusion changes.</li>
      </ul>
      <p>Weight clipping, a different estimator, or double robustness cannot supply an absent counterfactual comparison. Overlap weighting also changes whom the result represents.</p>
    </details>
    <details class="ps-detail">
      <summary>Can controls come from another calendar period?</summary>
      <p>Possibly, if they represent what would have happened without treatment in the target period after valid adjustment. Similar recorded profiles alone do not establish that.</p>
      <p>If background care, diagnosis, or outcome measurement changes over time, removing calendar time from the propensity model can hide confounding. If time only predicts treatment and is unnecessary for confounding control, including it may worsen precision. The causal role of time decides this, not how much overlap its removal produces.</p>
      <p>Inspect uptake and support within clinically meaningful periods. A transition period with both treatments may support a narrower question. Align eligibility and follow-up in both groups. Time since diagnosis is a separate design issue.</p>
    </details>
    <details class="ps-detail" id="ps-practice">
      <summary>Check your understanding</summary>
      <fieldset class="ps-question"><legend>A much larger study gives a very precise retained-group effect, but still has no controls for excluded patients. What changes?</legend>
        <button data-practice="all">The overall ATT is now identified</button>
        <button data-practice="retained">Only the retained-group estimate becomes more precise</button>
      </fieldset>
      <p id="ps-practice-feedback" role="status"></p>
    </details>
    <details class="ps-detail">
      <summary>Assumptions and sources</summary>
      <p>This is an invented binary recovery outcome at one fixed follow-up time. The baseline-defined groups and their treated shares stay fixed. Consistency, no interference, and exchangeability with adequate support within the retained group are stipulated.</p>
      <p>The excluded group always receives treatment. Its untreated recovery probability is unconstrained between 0 and 1. Each slider position changes only that unobserved probability, so all positions agree with the same observed data. There is no fitted propensity model, estimated cutoff, or confidence interval here. In a finite study, estimating the supported effect and group shares introduces additional uncertainty.</p>
      <ul>
        <li><a href="https://academic.oup.com/biomet/article/105/2/487/4930690">Yang & Ding (2018)</a>: trimming targets and inference after estimated selection.</li>
        <li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC4107929/">Petersen et al. (2012)</a>: diagnosing and responding to positivity violations.</li>
        <li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC3659185/">Mack et al. (2013)</a>: calendar-time-specific propensity scores.</li>
        <li><a href="https://pubmed.ncbi.nlm.nih.gov/39246144/">Liu et al. (2024)</a>: OWATT as further reading. This lesson does not implement OWATT.</li>
      </ul>
    </details>
    <nav class="ps-footer" aria-label="Continue learning"><button id="ps-restart">Restart lesson</button><a href="?lesson=trimming">← Trimming</a><a href="?lesson=topics">All topics</a><a href="?lesson=leaving-the-sandbox">Leaving the sandbox →</a></nav>
  </main>
</div>`;
setupLessonNavigation();

function effectChart(result) {
  const position = (value) => (value + 0.4) * 100;
  const rows = [
    ["Retained", "Supported", result.retainedEffect, null],
    ["Excluded", "Assumed", result.excludedEffect, result.excludedBounds],
    ["All treated", "Implied", result.overallEffect, result.overallBounds],
  ];
  return `<figure class="ps-effects" aria-label="Effects on recovery on a shared scale from minus 40 to plus 60 percentage points">
    ${rows.map(([name, kind, value, bounds]) => `<div class="ps-effect-row"><div class="ps-effect-label"><span>${name} <small>${kind}</small></span><strong>${pp(value)}</strong></div><div class="ps-track" role="img" aria-label="${name}: ${kind.toLowerCase()} effect ${pp(value)}${bounds ? `, compatible range ${pp(bounds[0])} to ${pp(bounds[1])}` : ""}"><i class="ps-zero"></i>${bounds ? `<i class="ps-range" style="left:${position(bounds[0])}%;width:${position(bounds[1]) - position(bounds[0])}%"></i>` : ""}<i class="ps-dot ${bounds ? "ps-assumed-dot" : ""}" style="left:${position(value)}%"></i></div></div>`).join("")}
    <div class="ps-axis">${[-40, -20, 0, 20, 40, 60].map((value) => `<span style="left:${value + 40}%">${value > 0 ? "+" : ""}${value}</span>`).join("")}</div>
    <figcaption>Effect on recovery (percentage points)<br>Negative = harm · Positive = benefit</figcaption>
  </figure>`;
}

function render() {
  const result = positivitySensitivity(Number(el("ps-effect").value) / 100);
  el("ps-effect-value").textContent = pp(result.excludedEffect);
  el("ps-effect").setAttribute(
    "aria-valuetext",
    `${pp(result.excludedEffect)} assumed effect among excluded patients`,
  );
  el("ps-chart").innerHTML = effectChart(result);
  el("ps-result").textContent =
    Math.abs(result.overallEffect) < 1e-10
      ? "Under this assumption, benefit among retained patients and harm among excluded patients cancel: the overall ATT is 0 pp."
      : `Under this assumption, the overall ATT is ${pp(result.overallEffect)}. The retained effect stays ${pp(result.retainedEffect)}.`;
  el("ps-counterfactual").textContent =
    `This assumes ${percent(result.excludedUntreated)} of excluded patients would recover without treatment. Their observed recovery with treatment stays ${percent(population.excludedTreated)}.`;
  el("ps-arithmetic").textContent = answered
    ? `${percent(population.retainedShare)} × (${pp(result.retainedEffect)}) + ${percent(1 - population.retainedShare)} × (${pp(result.excludedEffect)}) = ${pp(result.overallEffect)}. The overall effect reaches zero if the excluded effect is ${pp(result.tippingEffect)}.`
    : "Here, 60% of treated patients contribute the supported effect. The remaining 40% contribute an effect we have not identified.";
  el("ps-bounds").textContent =
    `With ${percent(population.excludedTreated)} recovering under treatment, an untreated recovery rate from 0% to 100% permits an excluded-group effect from ${pp(result.excludedBounds[0])} to ${pp(result.excludedBounds[1])}. This gives an overall ATT from ${pp(result.overallBounds[0])} to ${pp(result.overallBounds[1])}. These bounds do not include sampling uncertainty.`;
}

document.querySelectorAll("[data-prediction]").forEach((button) => {
  button.addEventListener("click", () => {
    answered = true;
    const correct = button.dataset.prediction === "no";
    el("ps-prediction").hidden = true;
    el("ps-feedback").hidden = false;
    el("ps-feedback").dataset.result = correct ? "correct" : "review";
    el("ps-feedback-text").textContent =
      `${correct ? "✓ Correct." : "! Not quite."} You chose: “${button.textContent}”. Equal recovery under treatment does not reveal recovery without treatment. Move the assumption slider to see what remains possible.`;
    el("ps-exploration").hidden = false;
    render();
    el("ps-feedback-text").focus({ preventScroll: true });
  });
});
document.querySelectorAll("[data-practice]").forEach((button) => {
  button.addEventListener("click", () => {
    document
      .querySelectorAll("[data-practice]")
      .forEach((choice) =>
        choice.setAttribute("aria-pressed", String(choice === button)),
      );
    el("ps-practice-feedback").textContent =
      `${button.dataset.practice === "retained" ? "✓ Correct." : "! Not quite."} Greater precision within the retained group leaves the excluded counterfactual missing. More data from the same supported profiles do not identify the overall ATT.`;
  });
});
el("ps-effect").addEventListener("input", render);
el("ps-restart").addEventListener("click", () => {
  answered = false;
  el("ps-effect").value = 20;
  el("ps-prediction").hidden = false;
  el("ps-feedback").hidden = true;
  el("ps-feedback").open = true;
  el("ps-feedback-text").textContent = "";
  el("ps-exploration").hidden = true;
  el("ps-practice-feedback").textContent = "";
  document
    .querySelectorAll("[data-practice]")
    .forEach((button) => button.removeAttribute("aria-pressed"));
  document.querySelectorAll(".ps-detail").forEach((detail) => {
    detail.open = false;
  });
  render();
  document.querySelector("h1").focus();
});
render();
document.querySelector("h1").focus({ preventScroll: true });
