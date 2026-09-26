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
    <p class="intro">Trimming leaves the excluded group’s effect unknown. See how assumptions about that effect can turn an overall benefit into harm, without changing the observed data.</p>
    <p class="small">Target: the average effect on all treated patients (ATT). Builds on <a href="?lesson=trimming">trimming</a>.</p>
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
      <p class="small">Assume valid adjustment for retained patients. Exact proportions remove sampling error from this example.</p>
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
        <h3>Can the overall effect turn harmful?</h3>
        <label class="ps-slider-label" for="ps-effect">Assumed effect among excluded patients <output id="ps-effect-value" for="ps-effect"></output></label>
        <input id="ps-effect" type="range" min="-40" max="60" step="5" value="20" aria-describedby="ps-effect-help">
        <p id="ps-effect-help" class="small">Move toward harm (negative values). Watch the effect on all treated patients cross zero.</p>
        <div id="ps-chart"></div>
        <p class="small">Bars: effects compatible with the observations, not confidence intervals. Open circles: your assumption and its implication.</p>
        <p id="ps-result" class="ps-result" role="status"></p>
        <p id="ps-counterfactual" class="small"></p>
      </div>
    </section>
    <details class="ps-detail" id="ps-calculation">
      <summary>How the two groups combine</summary>
      <p>Weight each group’s effect by its share of treated patients.</p>
      <div class="ps-equation" role="math" aria-label="Overall ATT equals retained share times retained ATT plus excluded share times excluded ATT">
        <math aria-hidden="true"><msub><mi>τ</mi><mtext>all</mtext></msub><mo>=</mo></math>
        <math aria-hidden="true"><mi>p</mi><mo>·</mo><msub><mi>τ</mi><mtext>retained</mtext></msub></math>
        <math aria-hidden="true"><mo>+</mo><mo>(</mo><mn>1</mn><mo>−</mo><mi>p</mi><mo>)</mo><mo>·</mo><msub><mi>τ</mi><mtext>excluded</mtext></msub></math>
      </div>
      <p class="small">Each <math><mi>τ</mi></math> is a group’s ATT. <math><mi>p</mi></math> is the retained share, here 60%.</p>
      <div id="ps-arithmetic" class="ps-equation ps-arithmetic" role="math" hidden></div>
      <p id="ps-tipping" hidden></p>
      <p id="ps-bounds"></p>
    </details>
    <details class="ps-detail">
      <summary>What can we do next?</summary>
      <ul>
        <li><strong>Find relevant controls.</strong> More data can help when controls are rare. If a profile always receives treatment, enlarging the same study cannot supply them.</li>
        <li><strong>Narrow the target.</strong> Report the retained-group ATT and describe who was excluded. Similar baseline summaries do not establish equal effects.</li>
        <li><strong>State the extrapolation assumptions.</strong> Predictions for excluded patients need assumptions beyond the observed comparisons. Show how plausible alternatives change the conclusion.</li>
      </ul>
      <p>Clipping or double robustness cannot replace missing controls. Overlap weighting changes the target population.</p>
    </details>
    <details class="ps-detail">
      <summary>Can controls come from another calendar period?</summary>
      <p>Only if they represent untreated outcomes in the target period after valid adjustment.</p>
      <p>Changes in care or diagnosis can make calendar time a confounder. Dropping it may hide bias. If time only predicts treatment and is unnecessary for adjustment, including it may worsen precision.</p>
      <p>A period with both treatments may support a narrower comparison. Align eligibility and follow-up across groups.</p>
    </details>
    <details class="ps-detail" id="ps-practice">
      <summary>Check your understanding</summary>
      <fieldset class="ps-question"><legend>A larger study improves precision for retained patients but adds no controls for excluded patients. What changes?</legend>
        <button data-practice="all">The overall ATT is now identified</button>
        <button data-practice="retained">Only the retained-group estimate becomes more precise</button>
      </fieldset>
      <p id="ps-practice-feedback" role="status"></p>
    </details>
    <details class="ps-detail">
      <summary>Assumptions and sources</summary>
      <p>This fictional binary outcome assumes consistency, no interference, and exchangeability with support in the retained group. Baseline groups, treated shares, and follow-up stay fixed.</p>
      <p>Excluded patients always receive treatment. The slider changes only their unobserved recovery without treatment. Real studies also have uncertainty from estimating effects and group shares, omitted here.</p>
      <ul>
        <li><a href="https://academic.oup.com/biomet/article/105/2/487/4930690">Yang & Ding (2018)</a>: trimming targets and inference after estimated selection.</li>
        <li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC4107929/">Petersen et al. (2012)</a>: diagnosing and responding to positivity violations.</li>
        <li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC3659185/">Mack et al. (2013)</a>: calendar-time-specific propensity scores.</li>
        <li><a href="https://pubmed.ncbi.nlm.nih.gov/39246144/">Liu et al. (2024)</a>: further reading on OWATT.</li>
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
      ? "Overall ATT: 0 pp. Benefit and harm cancel under this assumption."
      : `Overall ATT: ${pp(result.overallEffect)} under this assumption. The observed data have not changed.`;
  el("ps-counterfactual").textContent =
    `Excluded patients’ recovery without treatment: ${percent(result.excludedUntreated)} assumed. With treatment: ${percent(population.excludedTreated)} observed.`;
  el("ps-arithmetic").hidden = !answered;
  el("ps-arithmetic").setAttribute(
    "aria-label",
    `60 percent times ${pp(result.retainedEffect)} plus 40 percent times ${pp(result.excludedEffect)} equals ${pp(result.overallEffect)}`,
  );
  el("ps-arithmetic").innerHTML = `
    <math aria-hidden="true"><mn>0.6</mn><mo>×</mo><mn>${Math.round(result.retainedEffect * 100)}</mn></math>
    <math aria-hidden="true"><mo>+</mo><mn>0.4</mn><mo>×</mo><mo>(</mo><mn>${Math.round(result.excludedEffect * 100)}</mn><mo>)</mo></math>
    <math aria-hidden="true"><mo>=</mo><mn>${Math.round(result.overallEffect * 1000) / 10}</mn><mspace width="0.3em"/><mtext>pp</mtext></math>`;
  el("ps-tipping").hidden = !answered;
  el("ps-tipping").textContent =
    `The overall effect reaches zero at an excluded-group effect of ${pp(result.tippingEffect)}.`;
  el("ps-bounds").textContent =
    `Untreated recovery could be 0–100%. With ${percent(population.excludedTreated)} observed recovery under treatment, this allows an excluded effect from ${pp(result.excludedBounds[0])} to ${pp(result.excludedBounds[1])}, and an overall ATT from ${pp(result.overallBounds[0])} to ${pp(result.overallBounds[1])}.`;
}

document.querySelectorAll("[data-prediction]").forEach((button) => {
  button.addEventListener("click", () => {
    answered = true;
    const correct = button.dataset.prediction === "no";
    el("ps-prediction").hidden = true;
    el("ps-feedback").hidden = false;
    el("ps-feedback").dataset.result = correct ? "correct" : "review";
    el("ps-feedback-text").textContent =
      `${correct ? "✓ Correct." : "! Not quite."} You chose: “${button.textContent}”. Equal recovery under treatment leaves recovery without treatment unknown.`;
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
      `${button.dataset.practice === "retained" ? "✓ Correct." : "! Not quite."} A more precise retained effect still leaves the excluded effect unknown.`;
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
