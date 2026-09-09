import "./instrument-lesson.css";
import "./longitudinal-lesson.css";
import { themeControl } from "./theme.js";
import {
  lessonNavigation,
  setupLessonNavigation,
} from "./lesson-navigation.js";
import { effectComparison } from "./effect-comparison.js";
import { studySummary } from "./instrument-simulation.js";
import { longitudinalSample } from "./longitudinal-simulation.js";
import icon from "./brand.svg?raw";

document.querySelector("#app").innerHTML = `
  <div class="instrument-page longitudinal-page">
    <header><a class="brand" href="./">${icon}<span>Causal Sandbox</span></a><a href="?sandbox">Full sandbox ↗</a>${themeControl()}</header>
    <main>
      ${lessonNavigation({ currentOptional: "time-varying-confounding" })}
      <p class="eyebrow">OPTIONAL · TIME-VARYING CONFOUNDING</p>
      <h1 tabindex="-1">When treatment changes the next treatment decision</h1>
      <p class="longitudinal-intro">Treatment can change a patient's health, which then guides their next treatment. Explore two visits in a fictional study. Start here after <a href="?lesson=ipw">IPW</a>, <a href="?lesson=outcome-regression">outcome regression</a>, and <a href="?lesson=mediator">mediators</a>.</p>
      <section class="panel" aria-labelledby="target">
        <h2 id="target">Treat at both visits, or at neither?</h2>
        <p>Compare the average final symptom score if everyone were treated at both visits with the average if no one were treated at either visit. Lower scores are better.</p>
        <div class="longitudinal-steps" role="group" aria-label="Lesson stages">
          <button data-stage="0" aria-pressed="true">1. Two randomized decisions</button>
          <button data-stage="1" aria-pressed="false">2. Treatment responds to health</button>
          <button data-stage="2" aria-pressed="false">3. Weight each decision</button>
        </div>
        <svg class="graph" viewBox="0 0 580 210" role="img" id="history-graph">
          <defs><marker id="history-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><polygon points="0 0,7 3.5,0 7" fill="var(--causal-path)"/></marker></defs>
          <path d="M81 95H188" marker-end="url(#history-arrow)"/>
          <path id="severity-treatment-path" d="M248 95H355" marker-end="url(#history-arrow)"/>
          <path d="M415 95H516" marker-end="url(#history-arrow)"/>
          <path d="M218 118C218 170 545 170 545 120" marker-end="url(#history-arrow)"/>
          <path d="M51 72C51 8 545 8 545 70" marker-end="url(#history-arrow)"/>
          <rect x="21" y="73" width="60" height="44" rx="10" fill="var(--node-A)"/><text x="51" y="101" text-anchor="middle">A₁</text>
          <rect x="188" y="73" width="60" height="44" rx="10" fill="var(--node-C)"/><text x="218" y="101" text-anchor="middle">L</text>
          <rect x="355" y="73" width="60" height="44" rx="10" fill="var(--node-A)"/><text x="385" y="101" text-anchor="middle">A₂</text>
          <rect x="518" y="73" width="54" height="44" rx="10" fill="var(--node-Y)"/><text x="545" y="101" text-anchor="middle">Y</text>
          <g class="graph-time"><text x="51" y="193" text-anchor="middle">Visit 1</text><text x="218" y="193" text-anchor="middle">Between visits</text><text x="385" y="193" text-anchor="middle">Visit 2</text><text x="545" y="193" text-anchor="middle">Outcome</text></g>
        </svg>
        <p class="small">A₁ and A₂: treatment at each visit · L: updated severity (low or high) · Y: final symptom score. Arrows are assumptions of this simulation.</p>
        <p id="stage-explanation" class="note" aria-live="polite"></p>
        <div class="longitudinal-workspace">
          <div>
            <label class="adjust"><input id="adjust-severity" type="checkbox"/> Adjust outcome regression for updated severity L</label>
            <p id="model-caption" class="small"></p>
            <p id="interpretation" aria-live="polite"></p>
          </div>
          <div>
            <div class="results" aria-live="polite" aria-atomic="true">
              <div class="result truth"><span>True total strategy effect</span><strong>−2.80</strong><small>Both visits − neither visit</small></div>
              <div class="result estimate" id="regression-card"><span>Outcome regression</span><strong id="regression-value"></strong><small id="regression-error"></small></div>
              <div class="result estimate" id="ipw-card" hidden><span>Sequential IPW</span><strong id="ipw-value"></strong><small id="ipw-error"></small></div>
            </div>
            <p class="small">Red indicates distance from truth, on the shared 0–2 point error scale. One sample can land close to truth by chance.</p>
          </div>
        </div>
        <div id="weight-section" hidden>
          <p>Use severity to model the second treatment decision. Weight each observed treatment history, then compare the weighted outcomes for both visits versus neither. This lets severity retain its role in the first treatment's effect.</p>
          <details id="weight-detail"><summary>Follow one person's weight</summary>
            <p>Weight both decisions together: multiply their inverse probabilities, using the history available at each visit.</p>
            <div class="sequential-weight-formula">
              <math display="block" aria-label="Weight equals one over q 1 times q 2, the probabilities of the decisions actually observed at visits one and two">
                <mtext>Weight</mtext><mo>=</mo><mfrac><mn>1</mn><mrow><msub><mi>q</mi><mn>1</mn></msub><mo>×</mo><msub><mi>q</mi><mn>2</mn></msub></mrow></mfrac>
              </math>
              <div class="sequential-weight-factors">
                <p><strong>q₁ · Visit 1</strong>Chance of the observed first decision.</p>
                <p><strong>q₂ · Visit 2</strong>Chance of the observed second decision, given first treatment and updated severity.</p>
              </div>
            </div>
            <label for="person">Person <output id="person-number" for="person"></output></label>
            <input id="person" type="range" min="1" max="2400" step="1" value="1"/>
            <p id="person-history"></p><p id="person-weight" class="weight-equation"></p><p id="person-role" class="small"></p>
            <p class="small">The first probability is known from randomization. The second is fitted from people with the same first treatment and severity. Use the probability of the treatment actually received, including no treatment. No weights are clipped.</p>
          </details>
        </div>
        <div class="actions"><button id="redraw">Redraw sample</button><button id="restart">Restart lesson</button><span class="small" id="sample"></span></div>
        <details id="studies"><summary>Compare repeated studies</summary>
          <p>Repeat this world 60 times. Compare the average estimate and its spread with truth; these are not confidence intervals.</p>
          <button id="repeat">Run 60 studies</button><p id="study-status" role="status" class="small"></p><div id="study-results"></div>
        </details>
      </section>
      <details><summary>Why does ordinary adjustment fail here?</summary>
        <p>L carries part of A₁'s effect on Y. When it also guides A₂, it is a confounder for the second decision. Ignoring L leaves that confounding; holding L's distribution fixed in outcome regression removes the earlier treatment's benefit through severity.</p>
        <p>This dual role is treatment–confounder feedback. Time-varying confounding can also occur without earlier treatment affecting the confounder. A measurement before today's dose can still be a consequence of yesterday's dose.</p>
        <p>Regression itself is not the problem. The longitudinal g-formula uses outcome and severity models to let severity change under each strategy. That is a different operation from the ordinary adjustment shown here.</p>
      </details>
      <details><summary>Models, truth, and assumptions</summary>
        <p>The first treatment is randomized with probability 0.5. High severity occurs with probability 0.7 without first treatment and 0.3 with it. The second treatment is randomized in stage 1; in stages 2–3, its probability is 0.8 for high severity and 0.2 for low severity.</p>
        <p>Y = 6 − A₁ − A₂ + 2L + independent noise. Treating at both visits lowers the average score by 2 points directly and 0.8 through severity: the total effect is −2.8. The observational treatment rule does not change that intervention contrast.</p>
        <p>Both regressions fit a separate mean for each observed combination of their predictors, including treatment interactions. With L, predictions are averaged over the same observed severity distribution under both strategies. These models can represent the conditional means exactly; ordinary adjustment still targets the wrong contrast.</p>
        <p>Sequential IPW multiplies inverse treatment probabilities across visits and normalizes weights within each strategy. This estimates two means of a saturated marginal structural model. All histories inform the second treatment model, including people treated at only one visit.</p>
        <p>Identification requires no unmeasured confounding at either decision given the available history, positive probabilities for the strategies within relevant histories, well-defined treatments, and no interference between people. The fitted treatment probabilities must also be adequate. This simulation supplies those conditions; real data cannot establish them from balance alone.</p>
      </details>
      <details><summary>Check your understanding</summary>
        <p>Severity was measured before the second treatment. Why might adjusting for it remove part of the effect we want?</p>
        <details><summary>Reveal the explanation</summary><p>Because the first treatment already changed severity. Holding severity fixed removes that route from the first treatment to the outcome. We need to account for severity when comparing second decisions while preserving its response to the first decision.</p></details>
      </details>
      <details><summary>Sources and next steps</summary>
        <p><a href="https://miguelhernan.org/whatifbook">Hernán & Robins, Causal Inference: What If</a>, chapters 19–21: repeated treatments, treatment–confounder feedback, and g-methods.</p>
        <p><a href="https://hsph.harvard.edu/wp-content/uploads/2012/10/hernan_epid00.pdf">Hernán, Brumback & Robins (2000)</a> apply marginal structural models to treatment decisions influenced by changing CD4 counts.</p>
        <p>Further topics: the longitudinal g-formula, strategies that adapt to a patient's history, and loss to follow-up. This lesson uses two fixed strategies and a final continuous outcome.</p>
      </details>
      <nav class="actions" aria-label="Chapter navigation"><a href="?lesson=timing">← What timing tells us</a><a href="?lesson=assumptions">Explore causal assumptions →</a></nav>
      <footer>Fictional patients and effects. Point estimates only.</footer>
    </main>
  </div>`;
setupLessonNavigation();

const el = (id) => document.getElementById(id);
const state = { seed: 4217, stage: 0 };
let sample;
let runId = 0;
const fmt = (x) => (Number.isFinite(x) ? x.toFixed(3) : "Unavailable");

function renderPerson() {
  const i = Number(el("person").value) - 1;
  const d = sample.data[i];
  const w = sample.weights[i];
  el("person-number").textContent = i + 1;
  el("person-history").textContent =
    `Visit 1: ${d.A1 ? "treated" : "untreated"} → severity: ${d.L ? "high" : "low"} → visit 2: ${d.A2 ? "treated" : "untreated"}.`;
  el("person-weight").textContent =
    `Weight = 1 ÷ (0.500 × ${fmt(w.observedP2)}) = ${fmt(w.weight)}`;
  el("person-role").textContent =
    d.A1 === d.A2
      ? `This person contributes to the weighted mean for ${d.A1 ? "both visits" : "neither visit"}. The displayed calculation is rounded; estimates use full precision.`
      : "This person informs the fitted treatment probabilities, but contributes to neither strategy's outcome mean because their treatment history matches neither.";
}

function renderEstimates() {
  const adjusted = el("adjust-severity").checked;
  for (const [id, value] of [
    ["regression", adjusted ? sample.adjusted : sample.unadjusted],
    ["ipw", sample.ipw],
  ]) {
    const comparison = effectComparison(value, sample.truth);
    el(`${id}-value`).textContent = comparison.value;
    el(`${id}-error`).textContent = comparison.difference;
    el(`${id}-card`).style.setProperty("--error-tint", `${comparison.tint}%`);
  }
  el("model-caption").textContent =
    `Outcome model: ${adjusted ? "adjusting for updated severity L" : "no severity adjustment"}. Both treatment decisions are predictors.`;
  el("interpretation").textContent = adjusted
    ? "Holding severity's distribution fixed removes the first treatment's benefit through severity. The regression comparison approaches −2.00, while our total-effect target remains −2.80."
    : state.stage === 0
      ? "Both decisions are randomized. Across repeated studies, this comparison recovers the total effect, including the first treatment's benefit through severity."
      : "High severity now makes the second treatment more likely and raises the final symptom score. Omitting severity leaves the second decision confounded.";
}

function clearStudies() {
  runId++;
  el("repeat").disabled = false;
  el("study-status").textContent = "";
  el("study-results").innerHTML = "";
}

function render() {
  sample = longitudinalSample({
    seed: state.seed,
    confounded: state.stage > 0,
  });
  document
    .querySelectorAll("[data-stage]")
    .forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        Number(button.dataset.stage) === state.stage,
      ),
    );
  el("severity-treatment-path").style.visibility = state.stage
    ? "visible"
    : "hidden";
  el("history-graph").setAttribute(
    "aria-label",
    `First treatment A1 affects updated severity L and outcome Y. L affects Y${state.stage ? " and second treatment A2" : ""}. A2 affects Y. Both treatments precede the outcome.`,
  );
  el("stage-explanation").textContent = [
    "Both visits use a coin flip to assign treatment. The first treatment still reduces severity between visits. Try adjusting for severity: is it needed for this total effect?",
    "The first decision stays randomized. At the second visit, high severity now makes treatment more likely. L is a mediator for the first decision and a confounder for the second. Compare regression with and without L.",
    "Keep the same patients and treatment decisions. Sequential weighting accounts for severity when modeling the second decision, without holding severity fixed in the outcome comparison.",
  ][state.stage];
  el("ipw-card").hidden = state.stage !== 2;
  el("weight-section").hidden = state.stage !== 2;
  el("sample").textContent = `2,400 people · sample ${state.seed}`;
  renderEstimates();
  renderPerson();
}

document.querySelectorAll("[data-stage]").forEach((button) =>
  button.addEventListener("click", () => {
    if (state.stage === Number(button.dataset.stage)) return;
    state.stage = Number(button.dataset.stage);
    clearStudies();
    render();
  }),
);
el("adjust-severity").addEventListener("change", renderEstimates);
el("person").addEventListener("input", renderPerson);
el("redraw").addEventListener("click", () => {
  state.seed++;
  render();
});
el("restart").addEventListener("click", () => {
  state.seed = 4217;
  state.stage = 0;
  el("adjust-severity").checked = false;
  el("person").value = 1;
  document.querySelectorAll("main details").forEach((detail) => {
    detail.open = false;
  });
  clearStudies();
  render();
});
el("repeat").addEventListener("click", async () => {
  const run = ++runId;
  const stage = state.stage;
  const methods = [
    ["unadjusted", "Regression without L"],
    ["adjusted", "Regression with L"],
    ...(stage === 2 ? [["ipw", "Sequential IPW"]] : []),
  ];
  const results = [];
  el("repeat").disabled = true;
  try {
    for (let i = 0; i < 60; i++) {
      if (run !== runId) return;
      results.push(
        longitudinalSample({ seed: 100 + i, confounded: stage > 0 }),
      );
      el("study-status").textContent = `${i + 1} / 60 studies`;
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    if (run !== runId) return;
    el("study-results").innerHTML =
      `<div class="table-wrap"><table><caption>60 studies × 2,400 people · truth −2.800 · seeds 100–159</caption><thead><tr><th scope="col">Method</th><th scope="col">Mean</th><th scope="col">SD</th><th scope="col">Unavailable</th></tr></thead><tbody>${methods
        .map(([key, name]) => {
          const s = studySummary(
            results.map((r) => r[key]),
            -2.8,
          );
          return `<tr><th scope="row">${name}</th><td>${fmt(s.mean)}</td><td>${fmt(s.sd)}</td><td>${s.unavailable}</td></tr>`;
        })
        .join(
          "",
        )}</tbody></table></div><p class="small">SD is the spread of estimates across studies. Unavailable fits, if any, are excluded and counted separately.</p>`;
    el("study-status").textContent = "60 studies complete.";
  } finally {
    if (run === runId) el("repeat").disabled = false;
  }
});
render();
