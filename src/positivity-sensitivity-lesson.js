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
  positivityBounds,
} from "./positivity-sensitivity.js";

const title = "Beyond trimming: bounds and sensitivity";
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
document.title = `${title} · Causal Sandbox`;
document.querySelector("#app").innerHTML = `
<div class="instrument-page positivity-page">
  <header><a class="brand" href="./">${icon}<span>Causal Sandbox</span></a>${themeControl()}</header>
  <main>
    ${lessonNavigation({ currentOptional: "positivity-sensitivity" })}
    <p class="eyebrow">ADVANCED · POSITIVITY</p>
    <h1 tabindex="-1">${title}</h1>
    <p class="intro">Bound the ATT under incomplete support. Vary an assumption about the unobserved outcome without exposure.</p>
    <p class="small">Binary exposure A, binary outcome Y. Target: the exposed population (ATT). Builds on <a href="?lesson=trimming">trimming</a>.</p>
    <section class="panel ps-experiment" aria-labelledby="ps-study-title">
      <p class="eyebrow">TOY POPULATION · EXACT PROPORTIONS</p>
      <h2 id="ps-study-title">Start from the missing comparison</h2>
      <div id="ps-observed">
        ${propensityChart()}
      </div>
    </section>
    <section class="panel ps-experiment" aria-labelledby="ps-method-title">
      <p class="eyebrow">METHOD · BOUNDS AND SENSITIVITY ANALYSIS</p>
      <h2 id="ps-method-title">When does the ATT lower bound reach zero?</h2>
      <p class="small">Bound the outcome probability without exposure in the excluded group.</p>
      <div id="ps-exploration">
        <p class="ps-task"><strong>Try it:</strong> find the largest upper limit that keeps the ATT lower bound at or above zero. The right-hand dots show the upper-bound scenario.</p>
        <figure class="ps-recovery" aria-label="Binary outcomes with and without exposure for the same target population, illustrated per 100 exposed units">
          <figcaption class="ps-key"><span><i class="ps-person ps-recovered" aria-hidden="true"></i> Y = 1</span><span><i class="ps-person" aria-hidden="true"></i> Y = 0</span></figcaption>
          <div class="ps-worlds">
            <h4>With exposure</h4><h4>Without exposure</h4>
            <p class="ps-group">Retained <span>${retainedCount} of 100 exposed units</span></p>
            <div class="ps-recovery-cell" id="ps-retained-treated">
              <p><strong>${retainedRecoveries} with Y=1</strong><small>Observed</small></p>
              ${recoveryDots(retainedCount, retainedRecoveries, "Retained with exposure, observed")}
            </div>
            <div class="ps-recovery-cell" id="ps-retained-untreated">
              <p><strong>${supportedRecoveries} with Y=1</strong><small>From controls</small></p>
              ${recoveryDots(retainedCount, supportedRecoveries, "Retained without exposure, supported by controls")}
            </div>
            <p class="ps-group">Excluded <span>${excludedCount} of 100 exposed units</span></p>
            <div class="ps-recovery-cell" id="ps-excluded-treated">
              <p><strong>${excludedRecoveries} with Y=1</strong><small>Observed</small></p>
              ${recoveryDots(excludedCount, excludedRecoveries, "Excluded with exposure, observed")}
            </div>
            <div class="ps-recovery-cell ps-missing">
              <label for="ps-recoveries"><strong>At most <output id="ps-recoveries-value" for="ps-recoveries"></output></strong><small>Y=1, assumed</small></label>
              <div id="ps-missing-dots"></div>
              <input id="ps-recoveries" type="range" min="0" max="${excludedCount}" step="2" value="${excludedCount}" aria-label="Upper limit on Y=1 without exposure among the 40 excluded units" aria-describedby="ps-recoveries-help">
              <div class="ps-slider-ends" aria-hidden="true"><span>None</span><span>All ${excludedCount}</span></div>
              <p id="ps-recoveries-help" class="small">Allow 0 up to this many. Move left to strengthen the assumption.</p>
            </div>
            <div class="ps-total"><small>Total with Y=1</small><strong>${treatedRecoveries}</strong><span>${retainedRecoveries} + ${excludedRecoveries} observed</span></div>
            <div class="ps-total"><small>Total with Y=1</small><strong id="ps-untreated-total"></strong><span id="ps-untreated-sum"></span></div>
          </div>
        </figure>
        <div class="ps-result" role="status"><strong id="ps-result"></strong><p id="ps-interpretation"></p></div>
        <p class="small">These are bounds on the overall ATT, not confidence intervals. Counts illustrate population rates. The observed data stay fixed.</p>
      </div>
    </section>
    <details class="ps-detail" id="ps-calculation">
      <summary>How the two groups combine</summary>
      <p>Weight each group’s effect by its share of exposed units.</p>
      <div class="ps-equation" role="math" aria-label="Overall ATT equals retained share times retained ATT plus excluded share times excluded ATT">
        <math aria-hidden="true"><msub><mi>τ</mi><mtext>all</mtext></msub><mo>=</mo></math>
        <math aria-hidden="true"><mi>p</mi><mo>·</mo><msub><mi>τ</mi><mtext>retained</mtext></msub></math>
        <math aria-hidden="true"><mo>+</mo><mo>(</mo><mn>1</mn><mo>−</mo><mi>p</mi><mo>)</mo><mo>·</mo><msub><mi>τ</mi><mtext>excluded</mtext></msub></math>
      </div>
      <p class="small">Each <math><mi>τ</mi></math> is a group’s ATT. <math><mi>p</mi></math> is the retained share, here 60%.</p>
      <p>The ATT lower bound uses your upper limit on the outcome probability without exposure:</p>
      <div id="ps-arithmetic" class="ps-equation ps-arithmetic" role="math"></div>
      <p id="ps-tipping"></p>
      <p id="ps-bounds"></p>
    </details>
    <details class="ps-detail">
      <summary>Other routes: change the target or the evidence</summary>
      <ul>
        <li><strong>Find relevant controls.</strong> More data can help when controls are rare. If a profile is always exposed, enlarging the same study cannot supply them.</li>
        <li><strong>Narrow the target.</strong> Report the retained-group ATT and describe who was excluded. Similar baseline summaries do not establish equal effects.</li>
        <li><strong>State the extrapolation assumptions.</strong> Predictions for excluded units need assumptions beyond the observed comparisons. Show how plausible alternatives change the conclusion.</li>
      </ul>
      <p>Clipping or double robustness cannot replace missing controls. Overlap weighting changes the target population.</p>
    </details>
    <details class="ps-detail">
      <summary>Can controls come from another calendar period?</summary>
      <p>Only if they represent outcomes without exposure in the target period after valid adjustment.</p>
      <p>Changes in measurement or population composition can make calendar time a confounder. Dropping it may hide bias. If time only predicts exposure and is unnecessary for adjustment, including it may worsen precision.</p>
      <p>A period with both exposure groups may support a narrower comparison. Align eligibility and follow-up across groups.</p>
    </details>
    <details class="ps-detail" id="ps-practice">
      <summary>Apply the method</summary>
      <fieldset class="ps-question"><legend>Assume the excluded group’s outcome probability without exposure is at most 80%. What are the ATT bounds?</legend>
        <button data-practice="point">An ATT of exactly +4 pp</button>
        <button data-practice="bounds">An ATT between +4 and +36 pp, conditional on that bound</button>
      </fieldset>
      <p id="ps-practice-feedback" role="status"></p>
    </details>
    <details class="ps-detail">
      <summary>Assumptions and sources</summary>
      <p>We assume consistency, no interference, and valid adjustment with support in the retained group. Exact population rates omit sampling uncertainty. Baseline groups, exposed shares, and follow-up stay fixed.</p>
      <p>The plot uses known exposure probabilities for six retained profiles (0.15–0.65) and one always-exposed profile (1). Each arm is normalized separately. The final bin’s exposed mass is all at score 1. In real data, an empty region of fitted scores can also reflect a small sample or model misspecification.</p>
      <p>Excluded units are always exposed. The slider restricts their outcome probability without exposure to a range from zero to your chosen maximum. This assumption is not testable from these data and must be justified externally.</p>
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
    `${bin.lower.toFixed(1)}–${bin.upper.toFixed(1)}: ${(bin.control * 100).toFixed(1)}% of controls, ${(bin.treated * 100).toFixed(1)}% of exposed${bin.excluded ? ", excluded, all at score 1" : ""}`;
  return `<figure class="ps-propensity" aria-labelledby="ps-propensity-title">
    <figcaption id="ps-propensity-title">Propensity score distributions</figcaption>
    <p class="small">Known exposure probabilities in this toy population.</p>
    <div class="ps-histogram-key"><span><i class="ps-control-swatch"></i>Unexposed</span><span><i class="ps-treated-swatch"></i>Exposed</span><span><i class="ps-excluded-swatch"></i>Excluded</span></div>
    <p class="ps-axis-label">Percent of each exposure group</p>
    <svg id="ps-propensity-chart" viewBox="0 0 420 232" role="img" aria-label="Known propensity score distributions, normalized within each exposure group. ${bins.map(describe).join(". ")}">
      <defs><pattern id="ps-excluded-hatch" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="var(--node-Y)"/><path d="M-1 1L1 -1M0 6L6 0M5 7L7 5" stroke="var(--arm-1)" stroke-width="2"/></pattern></defs>
      <g stroke="var(--grid)"><path d="M40 20H400M40 105H400M40 190H400"/></g>
      <g text-anchor="end"><text x="32" y="25">40</text><text x="32" y="110">20</text><text x="32" y="195">0</text></g>
      ${bins.map((bin, i) => `<g data-bin="${i}"><title>${describe(bin)}</title><rect class="ps-control-bar" x="${42 + i * 36}" y="${190 - bin.control * 425}" width="14" height="${bin.control * 425}" data-share="${bin.control}"/><rect class="ps-treated-bar${bin.excluded ? " ps-excluded-bar" : ""}" x="${58 + i * 36}" y="${190 - bin.treated * 425}" width="14" height="${bin.treated * 425}" data-share="${bin.treated}"/></g>`).join("")}
      <path d="M40 190H400" stroke="var(--text-secondary)"/>
      <text x="40" y="219" text-anchor="middle">0</text><text x="220" y="219" text-anchor="middle">0.5</text><text x="400" y="219" text-anchor="middle">1</text>
    </svg>
    <p class="ps-axis-label ps-x-label">Propensity score · probability of exposure</p>
    <p class="ps-support-note"><strong>Hatched: the excluded ${percent(1 - population.retainedShare)} of exposed units.</strong> Always exposed (score 1), with no controls.</p>
  </figure>`;
}

function recoveryDots(total, recovered, label) {
  return `<div class="ps-people" role="img" aria-label="${label}: ${recovered} of ${total} have Y=1">${Array.from({ length: total }, (_, i) => `<i class="ps-person${i < recovered ? " ps-recovered" : ""}" aria-hidden="true"></i>`).join("")}</div>`;
}

function render() {
  const maxRecoveries = Number(el("ps-recoveries").value);
  const result = positivitySensitivity(
    population.excludedTreated - maxRecoveries / excludedCount,
  );
  const untreatedRecoveries = supportedRecoveries + maxRecoveries;
  const [lower, upper] = positivityBounds(maxRecoveries / excludedCount);
  const difference = treatedRecoveries - untreatedRecoveries;
  el("ps-recoveries-value").textContent = maxRecoveries;
  el("ps-recoveries").setAttribute(
    "aria-valuetext",
    `At most ${maxRecoveries} of ${excludedCount} excluded units have Y=1 without exposure, assumed upper limit`,
  );
  el("ps-missing-dots").innerHTML = recoveryDots(
    excludedCount,
    maxRecoveries,
    "Excluded without exposure at your assumed upper limit",
  );
  el("ps-untreated-total").textContent =
    `${supportedRecoveries}–${untreatedRecoveries}`;
  el("ps-untreated-sum").textContent =
    `${supportedRecoveries} supported + 0–${maxRecoveries} assumed`;
  el("ps-result").textContent = `Overall ATT: ${pp(lower)} to ${pp(upper)}`;
  el("ps-interpretation").textContent =
    maxRecoveries === excludedCount
      ? "Without an additional restriction, the ATT can be negative or positive."
      : difference < 0
        ? "This upper limit still allows a negative ATT."
        : difference === 0
          ? `At most ${maxRecoveries} of ${excludedCount} (${percent(maxRecoveries / excludedCount)}) is the tipping point: the ATT lower bound is zero, conditional on this restriction.`
          : `The ATT is at least ${pp(lower)}, conditional on this upper limit.`;
  el("ps-arithmetic").setAttribute(
    "aria-label",
    `Lower bound: 60 percent times ${pp(result.retainedEffect)} plus 40 percent times ${pp(result.excludedEffect)} equals ${pp(result.overallEffect)}`,
  );
  el("ps-arithmetic").innerHTML = `
    <math aria-hidden="true"><mn>0.6</mn><mo>×</mo><mn>${Math.round(result.retainedEffect * 100)}</mn></math>
    <math aria-hidden="true"><mo>+</mo><mn>0.4</mn><mo>×</mo><mo>(</mo><mn>${Math.round(result.excludedEffect * 100)}</mn><mo>)</mo></math>
    <math aria-hidden="true"><mo>=</mo><mn>${Math.round(result.overallEffect * 1000) / 10}</mn><mspace width="0.3em"/><mtext>pp</mtext></math>`;
  el("ps-tipping").textContent =
    `An upper limit of 90% gives an ATT lower bound of zero. A stricter limit implies a positive ATT.`;
  el("ps-bounds").textContent =
    `Without the added restriction, overall bounds are ${pp(result.overallBounds[0])} to ${pp(result.overallBounds[1])}. The upper bound stays ${pp(upper)} because an outcome probability of zero without exposure remains allowed in the excluded group.`;
}

document.querySelectorAll("[data-practice]").forEach((button) => {
  button.addEventListener("click", () => {
    document
      .querySelectorAll("[data-practice]")
      .forEach((choice) =>
        choice.setAttribute("aria-pressed", String(choice === button)),
      );
    el("ps-practice-feedback").textContent =
      `${button.dataset.practice === "bounds" ? "✓ Correct." : "! Not quite."} An 80% upper limit gives ATT bounds of +4 to +36 pp. This is an assumption-dependent interval, not a point estimate.`;
  });
});
el("ps-recoveries").addEventListener("input", render);
el("ps-restart").addEventListener("click", () => {
  el("ps-recoveries").value = excludedCount;
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
