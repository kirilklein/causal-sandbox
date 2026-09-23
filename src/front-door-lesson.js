import "./instrument-lesson.css";
import "./front-door.css";
import { themeControl } from "./theme.js";
import {
  lessonNavigation,
  setupLessonNavigation,
} from "./lesson-navigation.js";
import { frontDoorPopulation, reconstructFrontDoor } from "./front-door.js";
import {
  frontDoorGraph,
  frontDoorWorlds,
  probabilityBar,
  effectPlot,
  mixture,
  percent,
} from "./front-door-view.js";
import icon from "./brand.svg?raw";

const steps = [
  "The problem",
  "A → M",
  "M → Y",
  "Put it together",
  "Test the limits",
];
let stage = 0;
let world = "valid";
let selection = 0.6;
let prediction = null;
let answer = null;
const el = (id) => document.getElementById(id);

document.title = "The front-door criterion · Causal Sandbox";
document.querySelector("#app").innerHTML =
  `<div class="instrument-page fd-page">
  <header><a class="brand" href="./">${icon}<span>Causal Sandbox</span></a>${themeControl()}</header>
  <main>${lessonNavigation({ currentOptional: "front-door" })}
    <p class="eyebrow">ADVANCED · IDENTIFICATION</p>
    <h1 tabindex="-1">The front-door criterion</h1>
    <p class="intro fd-takeaway">A mediator can reveal the total effect even with hidden confounding—if it meets the front-door conditions.</p>
    <nav class="fd-steps" aria-label="Experiment steps">${steps.map((label, i) => `<button data-step="${i}"><span>${i + 1}</span>${label}</button>`).join("")}</nav>
    <section class="panel fd-experiment" aria-labelledby="fd-title">
      <div class="fd-workspace"><aside class="fd-world"><p class="eyebrow">OUR FICTIONAL STUDY</p><h2>Does tutoring help students pass?</h2><div id="fd-graph"></div><p class="small">A, M and Y are measured. U is hidden.<br>Target: tutoring everyone versus no one.</p><p class="small fd-exact">Exact population proportions.<br>No sampling noise in this experiment.</p></aside><div class="fd-stage"><p id="fd-step-label" class="eyebrow"></p><h2 id="fd-title" tabindex="-1"></h2><div id="fd-content"></div></div></div>
      <nav class="fd-actions" aria-label="Move through experiment"><button id="fd-back">← Back</button><span id="fd-position"></span><button id="fd-next" class="primary"></button></nav>
    </section>
    <details class="fd-details"><summary>The four front-door conditions</summary><ol><li>Every causal path from A to Y passes through M.</li><li>There is no open back-door path from A to M.</li><li>Conditioning on A blocks every back-door path from M to Y.</li><li>The A/M combinations needed for both averages occur in the data.</li></ol><p>These conditions describe the assumed causal structure and support. An observed association or a successful fit cannot establish the graph. Consistency and no interference are also assumed.</p></details>
    <details class="fd-details"><summary>The formula, connected to the pictures</summary><p>For binary Y, let r(m) = Σ<sub>a′</sub> P(Y=1 | M=m, A=a′) P(A=a′). The second relationship averages the within-group pass rates over the population’s tutoring mix.</p><p class="fd-formula">P(Y=1 | do(A=a)) = Σ<sub>m</sub> P(M=m | A=a) r(m)</p><p>The final reconstruction averages those responses over the practice mix produced by tutoring or no tutoring. Subtract the two risks to get the total effect. The a′ in the inner average ranges over both observed groups, regardless of the intervention a.</p><p>Simply adjusting Y for A and M and reading off A’s coefficient does not perform this reconstruction. Holding M fixed blocks the mediated route we want to include.</p></details>
    <details class="fd-details"><summary>Model and source</summary><p>This is an invented example, not evidence about tutoring. U, A, M and Y are binary with independent background randomness. P(U=1)=0.5; P(A=1|U)=0.5+s(U−0.5); P(M=1|A)=0.2+0.5A; P(Y=1|M,U)=0.1+0.4M+0.3U. Initially s=0.6.</p><p>The direct-path world adds 0.15A to the outcome probability. The hidden-mediator-cause world adds 0.2U to the practice probability. The no-overlap world sets M=A. Truth comes from intervening on A in each model. The reconstruction receives only the observed A/M/Y distribution.</p><p>Exact enumeration isolates identification. In finite studies the probabilities must be estimated, adding sampling error and possibly model error.</p><p><a href="https://bayes.cs.ucla.edu/PRIMER/primer-ch3.pdf">Pearl, Glymour & Jewell, Causal Inference in Statistics: A Primer</a>, §3.4, definition and theorem 3.4.1.</p></details>
    <nav class="fd-footer" aria-label="Continue learning"><button id="fd-restart">Restart lesson</button><a href="?lesson=hidden-confounding">← Hidden confounding</a><a href="?lesson=topics">All topics</a><a href="?lesson=misspecification">Resume core lessons →</a></nav>
  </main></div>`;
setupLessonNavigation();

function render(focus = false) {
  const population = frontDoorPopulation({
    world: stage === 4 ? world : "valid",
    selection: stage === 4 ? selection : 0.6,
  });
  const result = reconstructFrontDoor(population.cells);
  el("fd-graph").innerHTML = frontDoorGraph({
    stage,
    world: stage === 4 ? world : "valid",
    selection: stage === 4 ? selection : 0.6,
  });
  document.querySelectorAll("[data-step]").forEach((button) => {
    if (Number(button.dataset.step) === stage)
      button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  });
  el("fd-step-label").textContent = [
    "START WITH THE CAUSAL QUESTION",
    "FIRST RELATIONSHIP · TUTORING → PRACTICE",
    "SECOND RELATIONSHIP · PRACTICE → PASSING",
    "TWO RELATIONSHIPS → ONE TOTAL EFFECT",
    "CHANGE THE ASSUMPTIONS",
  ][stage];
  el("fd-title").textContent = [
    "The groups already differ",
    "Tutoring changes the practice mix",
    "Compare practice within each tutoring group",
    "Keep the response. Change the mix.",
    "A mediator is not enough",
  ][stage];
  el("fd-position").textContent = `${stage + 1} / ${steps.length}`;
  el("fd-back").disabled = stage === 0;
  el("fd-next").hidden = stage === 4;
  el("fd-next").textContent =
    [
      "Follow the mediator →",
      "Find the practice effect →",
      "Rebuild the total effect →",
      "Test the limits →",
    ][stage] || "";
  if (stage === 0) {
    el("fd-content").innerHTML =
      `<p>Readiness affects both joining tutoring and passing. The observed groups differ before tutoring can help.</p>${probabilityBar("No tutoring", result.observed[0], { arm: 0 })}${probabilityBar("Tutoring", result.observed[1], { arm: 1 })}<p class="small">Observed pass rates · same 0–100% scale</p>${effectPlot(result, population)}<fieldset class="fd-question"><legend>Does that +38 pp difference tell us the total effect?</legend><button data-predict="yes">Yes</button><button data-predict="no">No</button></fieldset><p id="fd-prediction" class="fd-feedback" role="status">${prediction ? predictionText() : ""}</p>`;
    document.querySelectorAll("[data-predict]").forEach((button) =>
      button.addEventListener("click", () => {
        prediction = button.dataset.predict;
        el("fd-prediction").textContent = predictionText();
        document
          .querySelectorAll("[data-predict]")
          .forEach((choice) =>
            choice.setAttribute(
              "aria-pressed",
              String(choice.dataset.predict === prediction),
            ),
          );
      }),
    );
  } else if (stage === 1) {
    el("fd-content").innerHTML =
      `<p>In this assumed graph, A → M has no open back-door path. The observed practice mix tells us what tutoring changes.</p><div class="fd-practice-pair">${[0, 1].map((a) => `<div class="fd-practice-card"><h3>${a ? "Tutoring" : "No tutoring"}</h3><div class="fd-waffle" role="img" aria-label="${percent(result.pM[a][1])} practice regularly">${Array.from({ length: 20 }, (_, i) => `<i class="${i < Math.round(result.pM[a][1] * 20) ? "fd-practices" : ""}"></i>`).join("")}</div><strong>${percent(result.pM[a][1])}</strong><span>practice regularly</span></div>`).join("")}</div><p class="small">Each square is 5% of that group. Filled squares: regular practice.</p><p class="fd-insight">Tutoring shifts students toward practice. Next, we need to learn what practice does to passing.</p>`;
  } else if (stage === 2) {
    el("fd-content").innerHTML =
      `<p>Practice and passing share the path M ← A ← U → Y. Comparing within A blocks it; then we average over the same tutoring mix.</p><div class="fd-strata">${[0, 1].map((a) => `<section><h3>${a ? "Tutoring" : "No tutoring"}</h3>${probabilityBar("Little practice", result.outcome[a][0], { arm: a })}${probabilityBar("Regular practice", result.outcome[a][1], { arm: a })}<p class="small">${percent(result.pA[a])} of the population</p></section>`).join("")}</div><div class="fd-pooling" aria-hidden="true">½ from each group ↓</div><div class="fd-standardized"><h3>Pass rates after averaging</h3>${probabilityBar("If everyone practiced little", result.response[0])}${probabilityBar("If everyone practiced regularly", result.response[1])}</div><p class="small">Same 0–100% scale throughout. The 50/50 weights are this population’s tutoring shares, not a universal rule.</p>`;
  } else if (stage === 3) {
    el("fd-content").innerHTML =
      `<p>Weight the practice → passing responses by the tutoring → practice mix.</p>${mixture(result)}${effectPlot(result, population, true)}<p class="fd-insight">53% − 33% = <strong>+20 percentage points</strong>. Both causal stages are retained, so this is the total effect.</p>`;
  } else {
    el("fd-content").innerHTML =
      `<label class="fd-control" for="fd-world">Which world are we in?<select id="fd-world">${Object.entries(
        frontDoorWorlds,
      )
        .map(
          ([key, item]) =>
            `<option value="${key}" ${key === world ? "selected" : ""}>${item.label}</option>`,
        )
        .join(
          "",
        )}</select></label><label class="fd-control" for="fd-selection">How strongly U selects students into tutoring <output id="fd-selection-value">${selection.toFixed(1)}</output><input id="fd-selection" type="range" min="0" max="0.8" step="0.1" value="${selection}"></label><div id="fd-limit-results"></div><details class="fd-transfer"><summary>Check your understanding</summary><fieldset class="fd-question"><legend>A learning app changes practice, but also improves exam scores through hints. Does practice identify the total effect by the front-door criterion?</legend><button data-answer="yes">Yes, practice is measured</button><button data-answer="no">No, the hints bypass practice</button></fieldset><p id="fd-answer" class="fd-feedback" role="status">${answer ? answerText() : ""}</p></details>`;
    updateLimits();
    el("fd-world").addEventListener("change", (event) => {
      world = event.target.value;
      updateLimits();
    });
    el("fd-selection").addEventListener("input", (event) => {
      selection = Number(event.target.value);
      updateLimits();
    });
    document.querySelectorAll("[data-answer]").forEach((button) =>
      button.addEventListener("click", () => {
        answer = button.dataset.answer;
        el("fd-answer").textContent = answerText();
      }),
    );
  }
  if (focus) el("fd-title").focus();
}

function updateLimits() {
  const population = frontDoorPopulation({ world, selection });
  const result = reconstructFrontDoor(population.cells);
  el("fd-selection-value").textContent = selection.toFixed(1);
  el("fd-graph").innerHTML = frontDoorGraph({ stage, world, selection });
  el("fd-limit-results").innerHTML =
    `${effectPlot(result, population, true)}<p class="fd-insight" role="status">${frontDoorWorlds[world].note}${selection === 0 ? " U → A is set to zero here." : ""}</p>`;
}

function predictionText() {
  return `${prediction === "no" ? "Right." : "Not from that comparison."} The +38 pp mixes tutoring’s effect with differences in readiness. Follow M to reconstruct the effect without measuring U.`;
}
function answerText() {
  return `${answer === "no" ? "Right." : "Measuring the mediator is not enough."} The hints create an A → Y route outside M, violating the first condition. The front-door reconstruction cannot recover the total effect here.`;
}
document.querySelectorAll("[data-step]").forEach((button) =>
  button.addEventListener("click", () => {
    stage = Number(button.dataset.step);
    render(true);
  }),
);
el("fd-back").addEventListener("click", () => {
  stage--;
  render(true);
});
el("fd-next").addEventListener("click", () => {
  stage++;
  render(true);
});
el("fd-restart").addEventListener("click", () => {
  stage = 0;
  world = "valid";
  selection = 0.6;
  prediction = null;
  answer = null;
  document.querySelectorAll(".fd-details").forEach((detail) => {
    detail.open = false;
  });
  render(true);
});
render();
document.querySelector("h1").focus({ preventScroll: true });
