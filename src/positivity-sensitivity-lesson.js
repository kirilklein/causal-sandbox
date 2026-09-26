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
  propensityDistribution,
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
const retainedCount = Math.round(100 * population.retainedShare);
const excludedCount = 100 - retainedCount;
const retainedRecoveries = Math.round(
  retainedCount * population.retainedTreated,
);
const supportedRecoveries = Math.round(
  retainedCount * population.retainedUntreated,
);
const excludedRecoveries = Math.round(
  excludedCount * population.excludedTreated,
);
const treatedRecoveries = retainedRecoveries + excludedRecoveries;
const initialAssumption = Math.round(
  excludedCount * population.retainedUntreated,
);
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
        ${propensityChart()}
        <div class="ps-evidence">
          <p><strong>Retained · ${percent(population.retainedShare)} of treated patients</strong><span>${percent(population.retainedTreated)} recover with treatment, versus ${percent(population.retainedUntreated)} among comparable controls.</span><b>Supported effect: ${pp(population.retainedTreated - population.retainedUntreated)}</b></p>
          <p><strong>Excluded · ${percent(1 - population.retainedShare)} of treated patients</strong><span>${percent(population.excludedTreated)} recover with treatment. There are no controls with their baseline profile.</span><b>Without treatment: unknown</b></p>
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
        <h3>What if these patients had not been treated?</h3>
        <p class="small">Increase the missing recovery count. Could more patients recover <em>without</em> treatment?</p>
        <figure class="ps-recovery" aria-label="Recovery with and without treatment for the same target population, illustrated per 100 treated patients">
          <figcaption class="ps-key"><span><i class="ps-person ps-recovered" aria-hidden="true"></i> Recovered</span><span><i class="ps-person" aria-hidden="true"></i> Did not recover</span></figcaption>
          <div class="ps-worlds">
            <h4>With treatment</h4><h4>Without treatment</h4>
            <p class="ps-group">Retained <span>${retainedCount} of 100 patients</span></p>
            <div class="ps-recovery-cell" id="ps-retained-treated">
              <p><strong>${retainedRecoveries} recover</strong><small>Observed</small></p>
              ${recoveryDots(retainedCount, retainedRecoveries, "Retained with treatment, observed")}
            </div>
            <div class="ps-recovery-cell" id="ps-retained-untreated">
              <p><strong>${supportedRecoveries} recover</strong><small>From controls</small></p>
              ${recoveryDots(retainedCount, supportedRecoveries, "Retained without treatment, supported by controls")}
            </div>
            <p class="ps-group">Excluded <span>${excludedCount} of 100 patients</span></p>
            <div class="ps-recovery-cell" id="ps-excluded-treated">
              <p><strong>${excludedRecoveries} recover</strong><small>Observed</small></p>
              ${recoveryDots(excludedCount, excludedRecoveries, "Excluded with treatment, observed")}
            </div>
            <div class="ps-recovery-cell ps-missing">
              <label for="ps-recoveries"><strong><output id="ps-recoveries-value" for="ps-recoveries"></output> recover</strong><small>Your assumption</small></label>
              <div id="ps-missing-dots"></div>
              <input id="ps-recoveries" type="range" min="0" max="${excludedCount}" step="2" value="${initialAssumption}" aria-label="Assumed recoveries without treatment among the 40 excluded patients" aria-describedby="ps-recoveries-help">
              <div class="ps-slider-ends" aria-hidden="true"><span>None</span><span>All ${excludedCount}</span></div>
              <p id="ps-recoveries-help" class="small">No controls. You choose this missing count.</p>
            </div>
            <div class="ps-total"><small>All 100 patients</small><strong>${treatedRecoveries} recover</strong><span>${retainedRecoveries} + ${excludedRecoveries} observed</span></div>
            <div class="ps-total"><small>All 100 patients</small><strong id="ps-untreated-total"></strong><span id="ps-untreated-sum"></span></div>
          </div>
        </figure>
        <p id="ps-result" class="ps-result" role="status"></p>
        <p class="small">Counts illustrate population rates, not individual outcomes. Observed recoveries stay fixed.</p>
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
      <p>The plot uses known treatment probabilities for six retained profiles (0.15–0.65) and one always-treated profile (1). Each arm is normalized separately. The final bin’s treated mass is all at score 1. In real data, an empty region of fitted scores can also reflect a small sample or model misspecification.</p>
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

function propensityChart() {
  const { bins } = propensityDistribution();
  const describe = (bin) =>
    `${bin.lower.toFixed(1)}–${bin.upper.toFixed(1)}: ${(bin.control * 100).toFixed(1)}% of controls, ${(bin.treated * 100).toFixed(1)}% of treated${bin.excluded ? ", excluded, all at score 1" : ""}`;
  return `<figure class="ps-propensity" aria-labelledby="ps-propensity-title">
    <figcaption id="ps-propensity-title">Propensity score distributions</figcaption>
    <p class="small">Known treatment probabilities in this toy population.</p>
    <div class="ps-histogram-key"><span><i class="ps-control-swatch"></i>Controls</span><span><i class="ps-treated-swatch"></i>Treated</span><span><i class="ps-excluded-swatch"></i>Excluded</span></div>
    <p class="ps-axis-label">Percent of each treatment group</p>
    <svg id="ps-propensity-chart" viewBox="0 0 420 232" role="img" aria-label="Known propensity score distributions, normalized within each treatment group. ${bins.map(describe).join(". ")}">
      <defs><pattern id="ps-excluded-hatch" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="var(--node-Y)"/><path d="M-1 1L1 -1M0 6L6 0M5 7L7 5" stroke="var(--arm-1)" stroke-width="2"/></pattern></defs>
      <g stroke="var(--grid)"><path d="M40 20H400M40 105H400M40 190H400"/></g>
      <g text-anchor="end"><text x="32" y="25">40</text><text x="32" y="110">20</text><text x="32" y="195">0</text></g>
      ${bins.map((bin, i) => `<g data-bin="${i}"><title>${describe(bin)}</title><rect class="ps-control-bar" x="${42 + i * 36}" y="${190 - bin.control * 425}" width="14" height="${bin.control * 425}" data-share="${bin.control}"/><rect class="ps-treated-bar${bin.excluded ? " ps-excluded-bar" : ""}" x="${58 + i * 36}" y="${190 - bin.treated * 425}" width="14" height="${bin.treated * 425}" data-share="${bin.treated}"/></g>`).join("")}
      <path d="M40 190H400" stroke="var(--text-secondary)"/>
      <text x="40" y="219" text-anchor="middle">0</text><text x="220" y="219" text-anchor="middle">0.5</text><text x="400" y="219" text-anchor="middle">1</text>
    </svg>
    <p class="ps-axis-label ps-x-label">Propensity score · probability of treatment</p>
    <p class="ps-support-note"><strong>The hatched group has score 1: always treated, no controls.</strong> These are the excluded ${percent(1 - population.retainedShare)} of treated patients below.</p>
  </figure>`;
}

function recoveryDots(total, recovered, label) {
  return `<div class="ps-people" role="img" aria-label="${label}: ${recovered} of ${total} recover">${Array.from({ length: total }, (_, i) => `<i class="ps-person${i < recovered ? " ps-recovered" : ""}" aria-hidden="true"></i>`).join("")}</div>`;
}

function render() {
  const assumedRecoveries = Number(el("ps-recoveries").value);
  const result = positivitySensitivity(
    population.excludedTreated - assumedRecoveries / excludedCount,
  );
  const untreatedRecoveries = supportedRecoveries + assumedRecoveries;
  const difference = treatedRecoveries - untreatedRecoveries;
  el("ps-recoveries-value").textContent = assumedRecoveries;
  el("ps-recoveries").setAttribute(
    "aria-valuetext",
    `${assumedRecoveries} of ${excludedCount} excluded patients recover without treatment, assumed`,
  );
  el("ps-missing-dots").innerHTML = recoveryDots(
    excludedCount,
    assumedRecoveries,
    "Excluded without treatment, assumed",
  );
  el("ps-untreated-total").textContent = `${untreatedRecoveries} recover`;
  el("ps-untreated-sum").textContent =
    `${supportedRecoveries} supported + ${assumedRecoveries} assumed`;
  el("ps-result").textContent =
    difference === 0
      ? "Equal recovery overall: benefit and harm cancel under this assumption (ATT: 0 pp)."
      : `${Math.abs(difference)} ${difference > 0 ? "more" : "fewer"} recoveries with treatment per 100 patients, under your assumption (ATT: ${pp(result.overallEffect)}).`;
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
el("ps-recoveries").addEventListener("input", render);
el("ps-restart").addEventListener("click", () => {
  answered = false;
  el("ps-recoveries").value = initialAssumption;
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
