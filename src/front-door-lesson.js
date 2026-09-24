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
  frontDoorFormulas,
  frontDoorModel,
  frontDoorWorlds,
  effectCards,
  percent,
  points,
} from "./front-door-view.js";
import icon from "./brand.svg?raw";

let world = "valid";
let selection = 0.6;
const el = (id) => document.getElementById(id);
const signed = (value) =>
  value === null ? "Unavailable" : `${value > 0 ? "+" : ""}${points(value)}`;
document.title = "The front-door criterion · Causal Sandbox";
document.querySelector("#app").innerHTML =
  `<div class="instrument-page fd-page">
<header><a class="brand" href="./">${icon}<span>Causal Sandbox</span></a>${themeControl()}</header>
<main>${lessonNavigation({ currentOptional: "front-door" })}
<p class="eyebrow">ADVANCED · IDENTIFICATION</p>
<h1 tabindex="-1">The front-door criterion</h1>
<p class="intro fd-takeaway">Front-door learns a treatment’s effect by following what it changes in the middle.</p>
<p class="fd-takeaway">Hidden causes can make treated and untreated people different from the start. We learn how treatment changes an intermediate step (the mediator), then how that step changes the outcome. If we can identify both links and the whole effect passes through that step, we can combine them without measuring the hidden causes.</p>
<section class="panel fd-experiment" aria-labelledby="fd-title">
  <div class="fd-stage">
    <p class="eyebrow">FICTIONAL TUTORING STUDY · EXACT POPULATION PROPORTIONS</p>
    <h2 id="fd-title">How many extra students pass because tutoring changes practice?</h2>
    <div class="fd-main"><div id="fd-graph"></div><div id="fd-results"></div></div>
    <p id="fd-explanation" class="fd-explanation" role="status"></p>
    <div class="fd-controls">
      <div><label class="fd-control" for="fd-selection">How strongly readiness selects students into tutoring <output id="fd-selection-value">0.6</output><input id="fd-selection" type="range" min="0" max="0.8" step="0.1" value="0.6" aria-describedby="fd-selection-hint"></label><p id="fd-selection-hint" class="small">Move the slider. Does the reconstruction change with the observed difference?</p></div>
      <label class="fd-control" for="fd-world">Test the causal story<select id="fd-world">${Object.entries(
        frontDoorWorlds,
      )
        .map(([key, item]) => `<option value="${key}">${item.label}</option>`)
        .join("")}</select></label>
    </div>
  </div>
</section>
<details id="fd-evidence" class="fd-details"><summary>Why compare practice within tutoring groups?</summary><div id="fd-evidence-content"></div></details>
<details id="fd-arithmetic" class="fd-details"><summary>How do the two changes give the total effect?</summary><div id="fd-arithmetic-content"></div></details>
    <details class="fd-details"><summary>The four front-door conditions</summary><ol><li>Every causal path from A to Y passes through M.</li><li>There is no open back-door path from A to M.</li><li>Conditioning on A blocks every back-door path from M to Y.</li><li>The A/M combinations needed for both averages occur in the data.</li></ol><p>These conditions describe the assumed causal structure and support. An observed association or a successful fit cannot establish the graph. Consistency and no interference are also assumed.</p></details>
    <details id="fd-formulas" class="fd-details"><summary>The full front-door formula</summary>${frontDoorFormulas()}<p>Simply adjusting Y for A and M and reading off A’s coefficient does not perform this reconstruction. Holding M fixed blocks the mediated route we want to include.</p></details>
    <details id="fd-model" class="fd-details"><summary>Model and source</summary><p>This is an invented example, not evidence about tutoring. U, A, M and Y are binary with independent background randomness.</p>${frontDoorModel()}<p>Initially <math><mi>s</mi><mo>=</mo><mn>0.6</mn></math>.</p><p>The direct-path world adds <math><mn>0.15</mn><mi>A</mi></math> to the outcome probability. The hidden-mediator-cause world adds <math><mn>0.2</mn><mi>U</mi></math> to the practice probability. The no-overlap world sets <math><mi>M</mi><mo>=</mo><mi>A</mi></math>. Truth comes from intervening on A in each model. The reconstruction receives only the observed A/M/Y distribution.</p><p>Exact enumeration isolates identification. In finite studies the probabilities must be estimated, adding sampling error and possibly model error.</p><p><a href="https://bayes.cs.ucla.edu/PRIMER/primer-ch3.pdf">Pearl, Glymour & Jewell, Causal Inference in Statistics: A Primer</a>, §3.4, definition and theorem 3.4.1.</p></details>
<details class="fd-details fd-transfer"><summary>Check your understanding</summary><fieldset class="fd-question"><legend>A learning app changes practice, but also improves exam scores through hints. Does practice identify the total effect by the front-door criterion?</legend><button data-answer="yes">Yes, practice is measured</button><button data-answer="no">No, the hints bypass practice</button></fieldset><p id="fd-answer" class="fd-feedback" role="status"></p></details>
<nav class="fd-footer" aria-label="Continue learning"><button id="fd-restart">Restart lesson</button><a href="?lesson=hidden-confounding">← Hidden confounding</a><a href="?lesson=topics">All topics</a><a href="?lesson=misspecification">Resume core lessons →</a></nav>
</main></div>`;
setupLessonNavigation();

function render() {
  const population = frontDoorPopulation({ world, selection });
  const result = reconstructFrontDoor(population.cells);
  const practiceChange = result.pM[1][1] - result.pM[0][1];
  const passingChange = result.supported
    ? result.response[1] - result.response[0]
    : null;
  el("fd-selection-value").textContent = selection.toFixed(1);
  el("fd-graph").innerHTML = frontDoorGraph({ world, selection, result });
  el("fd-results").innerHTML = effectCards(result, population, true);
  el("fd-explanation").textContent =
    world === "valid"
      ? `Tutoring increases regular practice by ${points(practiceChange)}. A ${points(passingChange)} gain from practice gives ${Number((result.effect * 100).toFixed(1))} extra passes per 100 students, on average.${selection === 0 ? " Readiness → tutoring is off here." : ""}`
      : frontDoorWorlds[world].note;
  el("fd-explanation").classList.toggle("fd-invalid", world !== "valid");
  el("fd-selection-hint").textContent =
    world === "valid"
      ? "Move the slider. Does the reconstruction change with the observed difference?"
      : "The same reconstruction now faces a different causal story.";
  el("fd-evidence-content").innerHTML =
    `<p>Compare little with regular practice separately among untutored and tutored students.</p><div class="fd-comparisons">${[0, 1].map((a) => `<div><h3>${a ? "Tutored students" : "Untutored students"}</h3><p class="small">Little practice → regular practice</p><p class="fd-pair">${result.outcome[a].map((value) => (value === null ? "Missing" : percent(value))).join(' <span aria-hidden="true">→</span> ')}<strong data-within="${a}">${signed(result.outcome[a].every((value) => value !== null) ? result.outcome[a][1] - result.outcome[a][0] : null)}</strong></p></div>`).join("")}</div><p>${world === "mediator" ? "Readiness now causes practice directly. Comparing within tutoring groups leaves Practice ← Readiness → Passing open, so these comparisons are still confounded." : world === "support" ? "The missing combinations prevent both within-group comparisons. Reweighting cannot supply the missing outcomes." : "In this graph, conditioning on tutoring blocks Practice ← Tutoring ← Readiness → Passing. The within-group comparisons identify the effect of practice."}</p>${result.supported ? `<p>Average the responses using this population’s tutoring shares (${percent(result.pA[0])} untutored, ${percent(result.pA[1])} tutored): <strong>${percent(result.response[0])}</strong> passing with little practice and <strong>${percent(result.response[1])}</strong> with regular practice.${world === "mediator" ? " These adjusted averages are not causal responses in this world." : ""}</p>` : ""}`;
  el("fd-arithmetic-content").innerHTML = result.supported
    ? `<p>In this binary example, the front-door risk difference is the change in regular practice multiplied by the adjusted practice–passing contrast.</p><div class="fd-formula" role="math" aria-label="${percent(practiceChange)} times ${percent(passingChange)} equals ${percent(result.effect)}"><math aria-hidden="true"><mn>${Number((practiceChange * 100).toFixed(1))}</mn><mo>%</mo><mo>×</mo><mn>${Number((passingChange * 100).toFixed(1))}</mn><mo>%</mo><mo>=</mo><mn>${Number((result.effect * 100).toFixed(1))}</mn><mo>%</mo></math></div><p>The full reconstruction gives <strong>${percent(result.rebuilt[0])}</strong> passing under no tutoring and <strong>${percent(result.rebuilt[1])}</strong> under tutoring. Their difference is <strong>${signed(result.effect)}</strong>.</p><p>${world === "valid" ? "Here, tutoring affects passing entirely through practice, so this recovers the total effect." : "The arithmetic still works, but the violated causal assumptions prevent interpreting it as the total effect."} Multiplying arbitrary regression coefficients does not generally perform front-door identification.</p>`
    : `<p>The practice–passing contrast is unavailable because required tutoring/practice combinations are missing. The total effect cannot be reconstructed from these data.</p>`;
}
el("fd-world").addEventListener("change", (event) => {
  world = event.target.value;
  render();
});
el("fd-selection").addEventListener("input", (event) => {
  selection = Number(event.target.value);
  render();
});
document.querySelectorAll("[data-answer]").forEach((button) =>
  button.addEventListener("click", () => {
    document
      .querySelectorAll("[data-answer]")
      .forEach((choice) =>
        choice.setAttribute("aria-pressed", String(choice === button)),
      );
    el("fd-answer").textContent =
      `${button.dataset.answer === "no" ? "Right." : "Measuring the mediator is not enough."} The hints create a tutoring → passing route outside practice, so the reconstruction misses part of the total effect.`;
  }),
);
el("fd-restart").addEventListener("click", () => {
  world = "valid";
  selection = 0.6;
  el("fd-world").value = world;
  el("fd-selection").value = selection;
  el("fd-answer").textContent = "";
  document
    .querySelectorAll("[data-answer]")
    .forEach((button) => button.removeAttribute("aria-pressed"));
  document.querySelectorAll(".fd-details").forEach((detail) => {
    detail.open = false;
  });
  render();
  document.querySelector("h1").focus();
});
render();
document.querySelector("h1").focus({ preventScroll: true });
