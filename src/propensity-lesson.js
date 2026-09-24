import "./instrument-lesson.css";
import "./propensity.css";
import { themeControl } from "./theme.js";
import icon from "./brand.svg?raw";
import {
  lessonNavigation,
  setupLessonNavigation,
} from "./lesson-navigation.js";
import { EstimationError, fitPropensity } from "./simulation.js";
import {
  extent,
  propensityBaseline,
  propensityCohort,
  propensityContours,
} from "./propensity-experiment.js";
import {
  armLegend,
  patientMark,
  percent,
  personOptions,
} from "./propensity-view.js";

document.querySelector("#app").innerHTML =
  `<div class="instrument-page ps-page">
  <header><a class="brand" href="./">${icon}<span>Causal Sandbox</span></a><a href="?sandbox">Explore scenarios ↗</a>${themeControl()}</header>
  <main>
    ${lessonNavigation({ currentOptional: "propensity-score" })}
    <p class="eyebrow">OPTIONAL · FOUNDATIONS</p>
    <h1 tabindex="-1">Where do propensity scores come from?</h1>
    <p class="intro">How likely was someone with these characteristics to receive treatment? A propensity score puts that chance on a scale from 0 to 100%.</p>
    <section class="panel" aria-labelledby="ps-question">
      <h2 id="ps-question">Who receives treatment?</h2>
      <p>Age and baseline severity can affect both treatment and outcome in this separate fictional cohort. Each mark is one person. Select someone to inspect their profile.</p>
      <p>Fit logistic regression using age, severity, and treatment received (yes/no) for all 400 people. It predicts a treatment probability for each profile. Outcomes are not used in this fit.</p>
      <div class="ps-fit-actions"><button id="ps-fit" class="primary">Fit treatment model</button><span id="ps-fit-status" class="small" role="status"></span></div>
      ${armLegend}
      <div id="ps-controls" hidden>
        <h3>How treatment is assigned</h3>
        <div class="ps-controls">
          <div><label for="ps-age">Age influence <output id="ps-age-value" for="ps-age"></output></label><input id="ps-age" type="range" min="-2" max="2" step="0.1" value="0.8"/></div>
          <div><label for="ps-severity">Severity influence <output id="ps-severity-value" for="ps-severity"></output></label><input id="ps-severity" type="range" min="-2" max="2" step="0.1" value="0.8"/></div>
        </div>
        <p class="small">Positive values favor treating older or more severe patients; negative values reverse that pattern. Change either influence: patient positions stay fixed, treatment updates, and the model refits.</p>
      </div>
      <div class="ps-explore">
        <div><div id="ps-scatter"></div><p id="ps-contour-note" class="small" hidden>Dashed lines connect profiles with the same estimated treatment probability. They are fitted from this sample.</p></div>
        <aside class="ps-person" aria-label="Selected person">
          <label class="ps-person-label" for="ps-person">Inspect a person <select id="ps-person"></select></label>
          <dl><dt>Age (C₁)</dt><dd id="ps-person-age"></dd><dt>Severity (C₂)</dt><dd id="ps-person-severity"></dd><dt>Observed treatment</dt><dd id="ps-person-arm"></dd></dl>
          <div id="ps-person-prediction" class="ps-probability" aria-live="polite"></div>
        </aside>
      </div>
      <details><summary>What does fitting do?</summary>
        <p>The model learns an intercept and a coefficient for each characteristic. It chooses them to make the observed yes/no treatments more likely under the model. A logistic transformation converts their combined value into a probability between 0 and 1.</p>
        <p>The assignment sliders define this fictional world; the fitted coefficients are estimated from its data. They will usually differ slightly. With both influences at zero, the true probability is constant, but a finite sample can still give small fitted slopes.</p>
        <p><code>p̂ = 1 / (1 + exp(−(b₀ + b₁C₁ + b₂C₂)))</code></p>
        <p class="small">For fitting, age and severity are centered and scaled. This changes the coefficient units, not the profiles or probabilities. This additive logistic model matches the assignment mechanism here. If age’s influence on log odds depended on severity, it would need an age × severity interaction.</p>
      </details>
      <section id="ps-score-section" class="ps-score-section" aria-labelledby="ps-score-heading" hidden>
        <h2 id="ps-score-heading">Two characteristics → one estimated probability</h2>
        <div id="ps-scores"></div>
        <p class="small">The same 400 people, arranged by fitted score and observed treatment. Vertical spread within each row only separates the marks.</p>
        <p>Strengthen both influences to see the treatment groups separate on this scale. Where one group becomes sparse, comparable people receiving that treatment are harder to find: the overlap problem.</p>
        <div id="ps-weight" class="ps-weight" aria-live="polite"></div>
        <p class="small">This is the basic, unclipped weight. Calculating propensity scores alone has not balanced the groups or estimated a treatment effect. Similar scores also do not mean identical age and severity.</p>
      </section>
      <div class="actions"><button id="ps-redraw">Redraw sample</button><button id="ps-reset">Restart lesson</button><span id="ps-sample" class="small"></span></div>
    </section>
    <details><summary>What can this score tell us?</summary>
      <p>The score describes treatment receipt given the measured characteristics in this study. It is not a person's chance of benefiting from treatment or having a good outcome. A person can receive no treatment even when their predicted treatment probability is high.</p>
      <p>Using scores for causal adjustment requires a defensible adjustment set and adequate overlap. A fitted-score plot cannot show that confounding has been controlled. The <a href="?lesson=overlap">overlap lesson</a> examines sparse comparisons and extreme weights.</p>
      <p><a href="https://academic.oup.com/biomet/article-abstract/70/1/41/240879">Rosenbaum & Rubin (1983), The central role of the propensity score</a></p>
    </details>
    <p>Choosing the right covariates is only one step. <a href="?lesson=misspecification">When a model is too simple</a> explores what happens when a fitted model misses the shape of their relationship.</p>
    <nav class="actions" aria-label="Continue learning"><a class="primary" href="?lesson=ipw">← Return to IPW</a><a href="?lesson=outcome-regression">Continue: Outcome regression →</a></nav>
  </main>
</div>`;
setupLessonNavigation();

const el = (id) => document.getElementById(id);
let state = { ...propensityBaseline };
let fitted = false;
let data;
let model;
let fitError = "";
function renderSelection() {
  const width = Math.max(250, el("ps-scatter").clientWidth);
  const bottom = width < 400 ? 235 : 295;
  const x = (c) => 45 + ((c + extent) / (2 * extent)) * (width - 65);
  const y = (c) => bottom - ((c + extent) / (2 * extent)) * (bottom - 35);
  const selected = Number(el("ps-person").value);
  const person = data.find((d) => d.person === selected);
  const marks = (position) =>
    data
      .filter((d) => d !== person)
      .map((d) => patientMark(d, ...position(d)))
      .join("") + patientMark(person, ...position(person), true);
  const contours = model ? propensityContours(model.beta) : [];
  el("ps-contour-note").textContent = contours.length
    ? "Dashed lines connect profiles with the same estimated treatment probability. They are fitted from this sample."
    : "The fitted probabilities do not cross the 20%, 50%, or 80% reference levels in this view. Inspect a person for their score.";
  el("ps-scatter").innerHTML =
    `<svg class="ps-chart" viewBox="0 0 ${width} ${bottom + 55}" role="img" aria-label="Age versus baseline disease severity. Select a person using a mark or the Inspect a person selector.">
    ${[-extent, 0, extent].map((c, i) => `<path class="ps-grid" d="M45 ${y(c)}H${width - 20}M${x(c)} 35V${bottom}"/><text x="35" y="${y(c) + 4}" text-anchor="end">${i * 5}</text><text x="${x(c)}" y="${bottom + 22}" text-anchor="middle">${40 + i * 20}</text>`).join("")}
    <text x="${x(0)}" y="${bottom + 47}" text-anchor="middle">Age (years)</text><text x="45" y="17">Baseline severity (0–10)</text>
    ${contours.map(({ points: [a, b] }) => `<path class="ps-curve" d="M${x(a.C1)} ${y(a.C2)}L${x(b.C1)} ${y(b.C2)}"/>`).join("")}
    ${marks((d) => [x(d.C1), y(d.C2)])}
    ${contours.map(({ p, points: [a, b] }) => `<text class="ps-contour-label" x="${x(a.C1 * 0.8 + b.C1 * 0.2)}" y="${y(a.C2 * 0.8 + b.C2 * 0.2) - 7}" text-anchor="middle">${p * 100}%</text>`).join("")}
  </svg>`;
  el("ps-person-age").textContent = `${person.age.toFixed(1)} years`;
  el("ps-person-severity").textContent = `${person.severity.toFixed(1)} / 10`;
  el("ps-person-arm").textContent = person.A ? "Treated" : "Untreated";
  el("ps-person-prediction").innerHTML = model
    ? `<span class="small">Estimated probability of treatment</span><strong>${percent(person.p)}</strong><p class="small">For profiles like this, the model predicts about ${percent(person.p)} would receive treatment. This person ${person.A ? "did" : "did not"}.</p>`
    : `<p class="small">${fitError || "We know what this person received. Fit the model to estimate how likely treatment was for their profile."}</p>`;
  if (!model) {
    el("ps-scores").innerHTML = "";
    el("ps-weight").innerHTML = "";
    return;
  }
  const scoreWidth = Math.max(250, el("ps-scores").clientWidth);
  const scoreX = (p) => 80 + p * (scoreWidth - 100);
  const ticks = scoreWidth < 400 ? [0, 0.5, 1] : [0, 0.25, 0.5, 0.75, 1];
  el("ps-scores").innerHTML =
    `<svg class="ps-chart" viewBox="0 0 ${scoreWidth} 162" role="img" aria-label="Estimated treatment probabilities for the same people, separated into untreated and treated rows.">
    <text x="5" y="44">Untreated</text><text x="5" y="100">Treated</text>
    ${ticks.map((p) => `<path class="ps-grid" d="M${scoreX(p)} 18V118"/><text x="${scoreX(p)}" y="137" text-anchor="middle">${p * 100}%</text>`).join("")}
    ${marks((d) => [scoreX(d.p), 40 + 56 * d.A + (d.jitter - 0.5) * 24])}
    <text x="${scoreWidth / 2}" y="159" text-anchor="middle">Estimated treatment probability</text>
  </svg>`;
  const received = person.A ? person.p : 1 - person.p;
  el("ps-weight").innerHTML =
    `<strong>Person ${person.person}: from probability to weight</strong><p>This ${person.A ? "treated" : "untreated"} person's estimated chance of ${person.A ? "receiving treatment" : "receiving no treatment"} is ${percent(received)}${person.A ? "" : ` (100% − ${percent(person.p)})`}. Their weight from the IPW formula is <strong>1 / ${received.toPrecision(3)} ≈ ${(1 / received).toFixed(2)}</strong>.</p>`;
}

function updateStudy(resetPerson = false) {
  data = propensityCohort(state);
  model = undefined;
  fitError = "";
  if (fitted) {
    try {
      model = fitPropensity(data, ["C"]);
      data = data.map((d, i) => ({ ...d, p: model.propensities[i] }));
    } catch (error) {
      if (!(error instanceof EstimationError)) throw error;
      fitError =
        "The treatment model could not be fitted. Reduce the influences or redraw the sample.";
    }
  }
  if (resetPerson) {
    el("ps-person").innerHTML = personOptions(data);
    const candidates = data.filter((d) => !d.A);
    const example = candidates.reduce(
      (best, d) => (d.C1 + d.C2 > best.C1 + best.C2 ? d : best),
      candidates[0] || data[0],
    );
    el("ps-person").value = example.person;
  }
  for (const variable of ["age", "severity"]) {
    el(`ps-${variable}`).value = state[variable];
    el(`ps-${variable}-value`).textContent = state[variable].toFixed(1);
  }
  el("ps-fit").textContent = fitError
    ? "Model unavailable · adjust controls"
    : fitted
      ? "Model fitted · updates automatically"
      : "Fit treatment model";
  el("ps-fit").setAttribute("aria-disabled", String(fitted));
  el("ps-fit-status").textContent =
    fitError ||
    (model ? "Estimated from this sample using age and severity." : "");
  el("ps-controls").hidden = !fitted;
  el("ps-contour-note").hidden = !model;
  el("ps-score-section").hidden = !model;
  el("ps-sample").textContent = `400 people · Sample seed ${state.seed}`;
  renderSelection();
}

el("ps-person").addEventListener("change", renderSelection);
for (const id of ["ps-scatter", "ps-scores"]) {
  el(id).addEventListener("click", (event) => {
    const mark = event.target.closest("[data-patient]");
    if (!mark) return;
    el("ps-person").value = mark.dataset.patient;
    renderSelection();
  });
}
el("ps-fit").addEventListener("click", () => {
  if (fitted) return;
  fitted = true;
  updateStudy();
});
for (const variable of ["age", "severity"]) {
  el(`ps-${variable}`).addEventListener("input", (event) => {
    state[variable] = Number(event.target.value);
    updateStudy();
  });
}
el("ps-redraw").addEventListener("click", () => {
  state.seed++;
  updateStudy(true);
});
el("ps-reset").addEventListener("click", () => {
  state = { ...propensityBaseline };
  fitted = false;
  updateStudy(true);
});
updateStudy(true);
window.addEventListener("resize", renderSelection);
