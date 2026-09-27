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
        <p class="ps-task"><strong>Try it:</strong> find the largest upper limit that keeps the ATT lower bound at or above zero.</p>
        <label class="ps-limit-label" for="ps-limit"><span>Outcome probability without exposure · excluded group</span><output id="ps-limit-value" for="ps-limit"></output></label>
        <input id="ps-limit" type="range" min="0" max="100" step="5" value="100" aria-label="Upper limit on outcome probability without exposure in the excluded group" aria-describedby="ps-limit-help">
        <p id="ps-limit-help" class="small">Allow 0% up to this limit. Moving left strengthens the assumption.</p>
        <figure class="ps-bound-figure" aria-labelledby="ps-bound-title">
          <figcaption><span id="ps-bound-title">ATT bounds</span><strong id="ps-result"></strong></figcaption>
          <div id="ps-bound-plot"></div>
          <p class="ps-plot-key"><span>● Lower bound</span><span>Interval: compatible effects</span><span>Dashed line: zero</span></p>
        </figure>
        <p id="ps-interpretation" class="small" role="status"></p>
        <p class="small">These are identification bounds, not confidence intervals. No true overall effect is specified.</p>
      </div>
    </section>
    <details class="ps-detail" id="ps-calculation">
      <summary>How the two groups combine</summary>
      <p>Retained share: ${percent(population.retainedShare)}. Retained ATT: ${pp(population.retainedTreated - population.retainedUntreated)}. Excluded outcome probability under exposure: ${percent(population.excludedTreated)}.</p>
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

function boundPlot(lower, upper) {
  const position = (value) => 4 + ((value * 100 + 10) / 50) * 92;
  return `<svg id="ps-att-chart" role="img" aria-label="ATT identification bounds ${pp(lower)} to ${pp(upper)}. Dot: lower bound. Dashed reference: zero. No point estimate or true overall effect is specified." data-domain-min="-10" data-domain-max="40">
    <line class="ps-effect-axis" x1="4%" x2="96%" y1="72" y2="72"/>
    <line class="ps-effect-zero" x1="${position(0)}%" x2="${position(0)}%" y1="12" y2="72"/>
    <line class="ps-effect-interval" x1="${position(lower)}%" x2="${position(upper)}%" y1="40" y2="40"/>
    <line class="ps-effect-cap" x1="${position(upper)}%" x2="${position(upper)}%" y1="33" y2="47"/>
    <circle class="ps-effect-bound" cx="${position(lower)}%" cy="40" r="5" data-effect="${lower}"/>
    ${[-10, 0, 10, 20, 30, 40].map((value) => `<text x="${position(value / 100)}%" y="94" text-anchor="middle">${value > 0 ? "+" : ""}${value}</text>`).join("")}
  </svg><p class="ps-effect-axis-title">ATT (percentage points)</p>`;
}

function render() {
  const limit = Number(el("ps-limit").value) / 100;
  const result = positivitySensitivity(population.excludedTreated - limit);
  const [lower, upper] = positivityBounds(limit);
  el("ps-limit-value").textContent = `At most ${percent(limit)}`;
  el("ps-limit").setAttribute(
    "aria-valuetext",
    `At most ${percent(limit)} outcome probability without exposure, assumed upper limit`,
  );
  el("ps-result").textContent = `${pp(lower)} to ${pp(upper)}`;
  el("ps-bound-plot").innerHTML = boundPlot(lower, upper);
  el("ps-interpretation").textContent =
    limit === 1
      ? "Without an additional restriction, the ATT can be negative or positive."
      : Math.abs(lower) < 1e-10
        ? `${percent(limit)} is the tipping point: the ATT lower bound is zero, conditional on this restriction.`
        : lower < 0
          ? "This upper limit still allows a negative ATT."
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
el("ps-limit").addEventListener("input", render);
el("ps-restart").addEventListener("click", () => {
  el("ps-limit").value = 100;
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
